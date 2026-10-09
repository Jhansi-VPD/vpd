"""Tests for the Role & Permission Management router (app/routers/role.py)
— the backend of the Super Admin portal's /admin/roles-permissions module —
plus the require_permissions() enforcement layer (app/core/dependencies.py).

Strategy: call the endpoint coroutines directly with mocked dependencies
(AsyncSession + patched audit/cache helpers), matching this suite's
established pattern (see test_users_management.py). Unauthenticated (401)
coverage for these paths lives in test_api_comprehensive.py; this file
exercises the endpoint behaviours: guards, system-role protection,
transactional permission replacement, audit events and cache invalidation.
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.core import dependencies as deps
from app.core.errors import ApiError
from app.models.audit_log import AuditLog
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.routers import role as role_router
from app.schemas.role import (
    PermissionCreate,
    PermissionStatusUpdate,
    PermissionUpdate,
    RoleCreate,
    RolePermissionAdd,
    RolePermissionsUpdate,
    RoleStatusUpdate,
    RoleUpdate,
)
from app.utils.pagination import PageParams


# ---------------------------------------------------------------------------
# Fixtures / factories
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_permission_cache():
    """The require_permissions cache is module-global state — clear it
    before and after every test so no test can leak grants into another."""
    deps.invalidate_permission_cache()
    yield
    deps.invalidate_permission_cache()


def _stamps() -> dict:
    now = datetime.now(UTC)
    return {"created_at": now, "updated_at": now}


def _make_role(slug: str = "data_analyst", **overrides) -> Role:
    data = {
        "id": uuid.uuid4(),
        "name": slug.replace("_", " ").title(),
        "slug": slug,
        "description": None,
        "is_system": False,
        "is_active": True,
        "portal": "admin",
        **_stamps(),
    }
    data.update(overrides)
    return Role(**data)


def _make_permission(name: str = "reports:read", **overrides) -> Permission:
    module, action = name.split(":")
    data = {
        "id": uuid.uuid4(),
        "name": name,
        "module": module,
        "action": action,
        "description": None,
        "is_system": False,
        "is_active": True,
        **_stamps(),
    }
    data.update(overrides)
    return Permission(**data)


def _make_user(role: str = "super_admin", **overrides) -> User:
    data = {
        "id": uuid.uuid4(),
        "name": "Test User",
        "email": f"user-{uuid.uuid4().hex[:8]}@vpdtechnologies.com",
        "password_hash": "$2b$12$" + "x" * 53,
        "phone": None,
        "avatar": None,
        "role": role,
        "is_active": True,
        "is_email_verified": True,
        "email_verified_at": None,
        "last_login_at": None,
        "password_changed_at": None,
        "failed_login_attempts": 0,
        "is_locked": False,
        "locked_until": None,
        "suspended_at": None,
        "mfa_enabled": False,
        **_stamps(),
    }
    data.update(overrides)
    return User(**data)


def _mock_request(query: dict | None = None) -> MagicMock:
    request = MagicMock()
    request.query_params = query or {}
    request.headers = {"user-agent": "pytest"}
    request.client.host = "127.0.0.1"
    return request


def _mock_db() -> AsyncMock:
    db = AsyncMock()
    db.add = MagicMock()
    return db


def _refresh_stamps(obj, *args, **kwargs) -> None:
    """SQLAlchemy applies column defaults only at flush; the mocked session
    never flushes, so db.refresh must stamp what the DB would have."""
    if getattr(obj, "id", None) is None:
        obj.id = uuid.uuid4()
    now = datetime.now(UTC)
    if getattr(obj, "created_at", None) is None:
        obj.created_at = now
    if getattr(obj, "updated_at", None) is None:
        obj.updated_at = now


# Result-shape helpers — role.py mixes `.first()`/`.all()` directly on the
# Result with `.scalars().first()/.all()`, so both shapes are needed.


def _result_rows(rows: list) -> MagicMock:
    return MagicMock(all=MagicMock(return_value=rows))


def _result_row_first(row) -> MagicMock:
    return MagicMock(first=MagicMock(return_value=row))


def _result_first(value) -> MagicMock:
    return MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=value))))


def _result_all(items: list) -> MagicMock:
    return MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=items))))


def _result_scalar(value) -> MagicMock:
    return MagicMock(scalar_one=MagicMock(return_value=value))


def _result_optional(value) -> MagicMock:
    return MagicMock(scalar_one_or_none=MagicMock(return_value=value))


def _result_one(value) -> MagicMock:
    return MagicMock(one=MagicMock(return_value=value))


def _capture_audit(monkeypatch) -> AsyncMock:
    """Replace log_audit (called by the real _write_audit wrapper) so tests
    assert on the exact audit kwargs without touching a session factory."""
    audit = AsyncMock()
    monkeypatch.setattr(role_router, "log_audit", audit)
    return audit


def _capture_invalidate(monkeypatch) -> MagicMock:
    invalidate = MagicMock()
    monkeypatch.setattr(role_router, "invalidate_permission_cache", invalidate)
    return invalidate


def _audit_actions(audit: AsyncMock) -> list[str]:
    return [call.kwargs["action"] for call in audit.await_args_list]


# ---------------------------------------------------------------------------
# Roles — list + filters
# ---------------------------------------------------------------------------


class TestRoleList:
    async def test_list_returns_rows_with_live_counts(self, monkeypatch):
        role = _make_role("data_analyst")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_rows([(role, 4, 2)]), _result_scalar(1)])

        result = await role_router.list_roles(_mock_request({"portal": "admin"}), db, PageParams())

        assert result["message"] == "Roles fetched"
        assert result["meta"].total == 1
        entry = result["data"][0]
        assert entry.slug == "data_analyst"
        assert entry.user_count == 4
        assert entry.permission_count == 2

    @pytest.mark.parametrize(
        ("query", "fragment"),
        [
            ({"portal": "warehouse"}, "Invalid portal filter"),
            ({"status": "zombie"}, "Invalid status filter"),
            ({"type": "magic"}, "Invalid type filter"),
        ],
    )
    async def test_invalid_filters_return_400(self, query, fragment):
        with pytest.raises(ApiError) as exc:
            await role_router.list_roles(_mock_request(query), _mock_db(), PageParams())
        assert exc.value.status_code == 400
        assert fragment in exc.value.message


# ---------------------------------------------------------------------------
# Roles — create
# ---------------------------------------------------------------------------


class TestRoleCreate:
    async def test_create_derives_slug_and_writes_audit(self, monkeypatch):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_row_first(None))
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)

        result = await role_router.create_role(
            RoleCreate(name="Data Analyst", portal="admin"),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert result["status_code"] == 201
        assert result["data"].slug == "data_analyst"
        assert result["data"].is_system is False
        assert result["data"].is_active is True
        created = db.add.call_args.args[0]
        assert created.slug == "data_analyst"
        assert created.portal == "admin"
        assert _audit_actions(audit) == ["ROLE_CREATED"]
        assert audit.await_args_list[0].kwargs["log_metadata"] == {
            "name": "Data Analyst",
            "slug": "data_analyst",
            "portal": "admin",
        }

    async def test_create_accepts_explicit_slug(self, monkeypatch):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_row_first(None))
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        _capture_audit(monkeypatch)

        result = await role_router.create_role(
            RoleCreate(name="Data Analyst", slug="analyst", portal="admin"),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert result["data"].slug == "analyst"

    async def test_underivable_slug_is_rejected_before_any_query(self):
        db = _mock_db()
        with pytest.raises(ApiError) as exc:
            await role_router.create_role(
                RoleCreate(name="123 456", portal="admin"),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )
        assert exc.value.status_code == 400
        assert "provide an explicit slug" in exc.value.message
        db.execute.assert_not_awaited()

    @pytest.mark.parametrize(
        ("conflict_row", "fragment"),
        [
            (("Data Analyst", "other_slug"), "name"),
            (("Other Name", "data_analyst"), "slug"),
        ],
    )
    async def test_duplicate_name_or_slug_conflicts_409(self, monkeypatch, conflict_row, fragment):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_row_first(conflict_row))
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.create_role(
                RoleCreate(name="Data Analyst", portal="admin"),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )

        assert exc.value.status_code == 409
        assert fragment in exc.value.message
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_race_conflict_rolls_back(self, monkeypatch):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_row_first(None))
        db.commit = AsyncMock(side_effect=IntegrityError("stmt", {}, Exception("boom")))
        _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.create_role(
                RoleCreate(name="Data Analyst", portal="admin"),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )

        assert exc.value.status_code == 409
        db.rollback.assert_awaited_once()

    def test_role_create_schema_rejects_bad_input(self):
        with pytest.raises(ValidationError):
            RoleCreate(name="X", portal="warehouse")
        with pytest.raises(ValidationError):
            RoleCreate(name="X", slug="Bad Slug", portal="admin")
        with pytest.raises(ValidationError):
            RoleCreate(name="", portal="admin")


# ---------------------------------------------------------------------------
# Roles — get + update
# ---------------------------------------------------------------------------


class TestRoleDetailAndUpdate:
    async def test_get_role_surfaces_counts_and_implicit_flag(self):
        role = _make_role("super_admin", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_one((3, 21))])

        result = await role_router.get_role(role.id, db)

        assert result["data"].user_count == 3
        assert result["data"].permission_count == 21
        assert result["data"].implicit_all_permissions is True

    async def test_update_role_applies_changes_and_audits_old_new(self, monkeypatch):
        role = _make_role("data_analyst", name="Data Analyst", description="old")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_row_first(None)])
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)

        result = await role_router.update_role(
            role.id,
            RoleUpdate(name="Data Science", description="new"),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert result["message"] == "Role updated successfully"
        assert role.name == "Data Science"
        assert role.description == "new"
        assert _audit_actions(audit) == ["ROLE_UPDATED"]
        changes = audit.await_args_list[0].kwargs["log_metadata"]["changes"]
        assert changes["name"] == {"old": "Data Analyst", "new": "Data Science"}
        assert changes["description"] == {"old": "old", "new": "new"}

    async def test_update_role_name_collision_409(self, monkeypatch):
        role = _make_role("data_analyst", name="Data Analyst")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_row_first((uuid.uuid4(),))])
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.update_role(
                role.id,
                RoleUpdate(name="Taken"),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )

        assert exc.value.status_code == 409
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_update_system_role_portal_is_immutable(self, monkeypatch):
        role = _make_role("hr", is_system=True, portal="hr")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.update_role(
                role.id,
                RoleUpdate(portal="admin"),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )

        assert exc.value.status_code == 400
        assert "system roles cannot be changed" in exc.value.message
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_update_no_changes_short_circuits(self, monkeypatch):
        role = _make_role("data_analyst", name="Data Analyst")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))
        audit = _capture_audit(monkeypatch)

        result = await role_router.update_role(
            role.id,
            RoleUpdate(name="Data Analyst"),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert result["message"] == "Role unchanged"
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_update_blank_description_normalizes_to_none(self, monkeypatch):
        role = _make_role("data_analyst", name="Data Analyst", description="old")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        _capture_audit(monkeypatch)

        await role_router.update_role(
            role.id,
            RoleUpdate(description=""),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert role.description is None
        db.commit.assert_awaited_once()


# ---------------------------------------------------------------------------
# Roles — status + delete guards (system protection, assigned users)
# ---------------------------------------------------------------------------


class TestRoleStatusAndDelete:
    async def test_system_role_cannot_be_deactivated(self, monkeypatch):
        role = _make_role("hr", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.set_role_status(
                role.id, RoleStatusUpdate(is_active=False), _mock_request(), db, _make_user("super_admin")
            )

        assert exc.value.status_code == 409
        assert exc.value.message == "System roles cannot be deactivated"
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_role_with_users_cannot_be_deactivated(self, monkeypatch):
        role = _make_role("data_analyst")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_scalar(2)])
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.set_role_status(
                role.id, RoleStatusUpdate(is_active=False), _mock_request(), db, _make_user("super_admin")
            )

        assert exc.value.status_code == 409
        assert "2 user(s)" in exc.value.message
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_custom_role_deactivation_succeeds_and_invalidates(self, monkeypatch):
        role = _make_role("data_analyst")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_scalar(0)])
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.set_role_status(
            role.id, RoleStatusUpdate(is_active=False), _mock_request(), db, _make_user("super_admin")
        )

        assert role.is_active is False
        assert result["message"] == "Role deactivated"
        assert _audit_actions(audit) == ["ROLE_DEACTIVATED"]
        invalidate.assert_called_once_with("data_analyst")

    async def test_role_activation_succeeds_without_assignment_check(self, monkeypatch):
        role = _make_role("data_analyst", is_active=False)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.set_role_status(
            role.id, RoleStatusUpdate(is_active=True), _mock_request(), db, _make_user("super_admin")
        )

        assert role.is_active is True
        assert result["message"] == "Role activated"
        assert _audit_actions(audit) == ["ROLE_ACTIVATED"]
        invalidate.assert_called_once_with("data_analyst")

    async def test_status_unchanged_short_circuits(self, monkeypatch):
        role = _make_role("data_analyst")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))
        audit = _capture_audit(monkeypatch)

        result = await role_router.set_role_status(
            role.id, RoleStatusUpdate(is_active=True), _mock_request(), db, _make_user("super_admin")
        )

        assert result["message"] == "Role status unchanged"
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_system_role_cannot_be_deleted(self, monkeypatch):
        role = _make_role("hr", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.delete_role(role.id, _mock_request(), db, _make_user("super_admin"))

        assert exc.value.status_code == 409
        assert exc.value.message == "System roles cannot be deleted"
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_role_with_users_cannot_be_deleted(self, monkeypatch):
        role = _make_role("data_analyst")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_scalar(3)])

        with pytest.raises(ApiError) as exc:
            await role_router.delete_role(role.id, _mock_request(), db, _make_user("super_admin"))

        assert exc.value.status_code == 409
        assert "3 user(s)" in exc.value.message
        db.commit.assert_not_awaited()

    async def test_custom_role_soft_delete_audits_and_invalidates(self, monkeypatch):
        role = _make_role("data_analyst")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_scalar(0)])
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.delete_role(role.id, _mock_request(), db, _make_user("super_admin"))

        assert role.deleted_at is not None
        assert result["message"] == "Role deleted successfully"
        assert _audit_actions(audit) == ["ROLE_DELETED"]
        invalidate.assert_called_once_with("data_analyst")


# ---------------------------------------------------------------------------
# Role → permission mapping
# ---------------------------------------------------------------------------


class TestRolePermissions:
    async def test_super_admin_role_set_is_implicit_and_not_editable(self, monkeypatch):
        role = _make_role("super_admin", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))

        with pytest.raises(ApiError) as exc:
            await role_router.set_role_permissions(
                role.id,
                RolePermissionsUpdate(permission_ids=[]),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )
        assert exc.value.status_code == 409
        assert "implicitly has all permissions" in exc.value.message

        with pytest.raises(ApiError) as exc:
            await role_router.add_role_permission(
                role.id, RolePermissionAdd(permission_id=uuid.uuid4()), _mock_request(), db, _make_user("super_admin")
            )
        assert exc.value.status_code == 409

        with pytest.raises(ApiError) as exc:
            await role_router.remove_role_permission(
                role.id, uuid.uuid4(), _mock_request(), db, _make_user("super_admin")
            )
        assert exc.value.status_code == 409

    async def test_system_role_edit_requires_super_admin(self, monkeypatch):
        role = _make_role("hr", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))

        with pytest.raises(ApiError) as exc:
            await role_router.set_role_permissions(
                role.id,
                RolePermissionsUpdate(permission_ids=[]),
                _mock_request(),
                db,
                _make_user("admin"),
            )
        assert exc.value.status_code == 403
        assert exc.value.message == "Only a Super Admin can modify a system role's permissions"

    async def test_get_role_permissions_super_admin_returns_all_active(self):
        role = _make_role("super_admin", is_system=True)
        perms = [_make_permission("permissions:read"), _make_permission("roles:read")]
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_all(perms)])

        result = await role_router.get_role_permissions(role.id, db)

        assert result["data"].implicit_all_permissions is True
        assert [p.name for p in result["data"].permissions] == ["permissions:read", "roles:read"]

    async def test_get_role_permissions_mapped_set(self):
        role = _make_role("data_analyst")
        perms = [_make_permission("reports:read")]
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_all(perms)])

        result = await role_router.get_role_permissions(role.id, db)

        assert result["data"].implicit_all_permissions is False
        assert [p.name for p in result["data"].permissions] == ["reports:read"]

    async def test_replace_rejects_unknown_ids_before_any_write(self, monkeypatch):
        role = _make_role("data_analyst")
        unknown = uuid.uuid4()
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_rows([])])
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.set_role_permissions(
                role.id,
                RolePermissionsUpdate(permission_ids=[unknown]),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )

        assert exc.value.status_code == 400
        assert "Unknown, inactive, or deleted permission ids" in exc.value.message
        assert str(unknown) in exc.value.message
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()
        invalidate.assert_not_called()

    async def test_replace_applies_diff_atomically_with_audits(self, monkeypatch):
        role = _make_role("data_analyst")
        keep = _make_permission("reports:read")
        added = _make_permission("reports:export")
        removed = _make_permission("users:write")
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[
                _result_first(role),  # _load_role
                _result_rows([(added.id, added.name), (keep.id, keep.name)]),  # validate requested ids
                _result_all([keep.id, removed.id]),  # current mapped ids
                _result_rows([(removed.id, removed.name)]),  # names of removed
                MagicMock(),  # delete
                MagicMock(),  # insert
                _result_all([added, keep]),  # final mapped set
            ]
        )
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.set_role_permissions(
            role.id,
            RolePermissionsUpdate(permission_ids=[added.id, keep.id]),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        db.commit.assert_awaited_once()
        assert _audit_actions(audit) == ["ROLE_PERMISSION_ASSIGNED", "ROLE_PERMISSION_REMOVED"]
        assert audit.await_args_list[0].kwargs["log_metadata"] == {
            "role": "data_analyst",
            "permission": "reports:export",
        }
        assert audit.await_args_list[1].kwargs["log_metadata"] == {
            "role": "data_analyst",
            "permission": "users:write",
        }
        invalidate.assert_called_once_with("data_analyst")
        assert "added 1, removed 1" in result["message"]

    async def test_replace_noop_writes_nothing(self, monkeypatch):
        role = _make_role("data_analyst")
        keep = _make_permission("reports:read")
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[
                _result_first(role),
                _result_rows([(keep.id, keep.name)]),
                _result_all([keep.id]),
                _result_all([keep]),
            ]
        )
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.set_role_permissions(
            role.id,
            RolePermissionsUpdate(permission_ids=[keep.id]),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert "added 0, removed 0" in result["message"]
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()
        invalidate.assert_not_called()

    async def test_replace_mid_commit_failure_rolls_back(self, monkeypatch):
        role = _make_role("data_analyst")
        added = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[
                _result_first(role),
                _result_rows([(added.id, added.name)]),
                _result_all([]),
                IntegrityError("stmt", {}, Exception("boom")),  # insert fails
            ]
        )
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.set_role_permissions(
                role.id,
                RolePermissionsUpdate(permission_ids=[added.id]),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )

        assert exc.value.status_code == 409
        db.rollback.assert_awaited_once()
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_add_permission_maps_and_audits(self, monkeypatch):
        role = _make_role("data_analyst")
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[
                _result_first(role),
                _result_first(permission),
                _result_row_first(None),  # not already mapped
                MagicMock(),  # insert
            ]
        )
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.add_role_permission(
            role.id, RolePermissionAdd(permission_id=permission.id), _mock_request(), db, _make_user("super_admin")
        )

        assert result["status_code"] == 201
        assert result["data"].name == "reports:export"
        assert _audit_actions(audit) == ["ROLE_PERMISSION_ASSIGNED"]
        invalidate.assert_called_once_with("data_analyst")

    async def test_add_missing_permission_404(self, monkeypatch):
        role = _make_role("data_analyst")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_first(None)])

        with pytest.raises(ApiError) as exc:
            await role_router.add_role_permission(
                role.id, RolePermissionAdd(permission_id=uuid.uuid4()), _mock_request(), db, _make_user("super_admin")
            )
        assert exc.value.status_code == 404

    async def test_add_inactive_permission_400(self, monkeypatch):
        role = _make_role("data_analyst")
        permission = _make_permission("reports:export", is_active=False)
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_first(permission)])

        with pytest.raises(ApiError) as exc:
            await role_router.add_role_permission(
                role.id, RolePermissionAdd(permission_id=permission.id), _mock_request(), db, _make_user("super_admin")
            )
        assert exc.value.status_code == 400
        assert exc.value.message == "Cannot assign an inactive permission"

    async def test_add_already_mapped_permission_409(self, monkeypatch):
        role = _make_role("data_analyst")
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[_result_first(role), _result_first(permission), _result_row_first((permission.id,))]
        )

        with pytest.raises(ApiError) as exc:
            await role_router.add_role_permission(
                role.id, RolePermissionAdd(permission_id=permission.id), _mock_request(), db, _make_user("super_admin")
            )
        assert exc.value.status_code == 409
        assert "already assigned" in exc.value.message

    async def test_remove_unmapped_permission_404(self, monkeypatch):
        role = _make_role("data_analyst")
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[_result_first(role), _result_first(permission), _result_row_first(None)]
        )

        with pytest.raises(ApiError) as exc:
            await role_router.remove_role_permission(
                role.id, permission.id, _mock_request(), db, _make_user("super_admin")
            )
        assert exc.value.status_code == 404
        assert exc.value.message == "This permission is not assigned to the role"

    async def test_remove_permission_succeeds_and_audits(self, monkeypatch):
        role = _make_role("data_analyst")
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[
                _result_first(role),
                _result_first(permission),
                _result_row_first((permission.id,)),
                MagicMock(),  # delete
            ]
        )
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.remove_role_permission(
            role.id, permission.id, _mock_request(), db, _make_user("super_admin")
        )

        assert result["message"] == "Permission removed"
        assert _audit_actions(audit) == ["ROLE_PERMISSION_REMOVED"]
        invalidate.assert_called_once_with("data_analyst")


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------


class TestPermissionListAndCreate:
    async def test_list_permissions_returns_role_counts(self):
        permission = _make_permission("roles:read")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_rows([(permission, 3)]), _result_scalar(1)])

        result = await role_router.list_permissions(_mock_request(), db, PageParams())

        assert result["meta"].total == 1
        assert result["data"][0].role_count == 3

    @pytest.mark.parametrize(
        ("query", "fragment"),
        [
            ({"status": "zombie"}, "Invalid status filter"),
            ({"type": "magic"}, "Invalid type filter"),
        ],
    )
    async def test_invalid_permission_filters_return_400(self, query, fragment):
        with pytest.raises(ApiError) as exc:
            await role_router.list_permissions(_mock_request(query), _mock_db(), PageParams())
        assert exc.value.status_code == 400
        assert fragment in exc.value.message

    async def test_module_summary_groups_by_module(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([("reports", 2), ("roles", 5)]))

        result = await role_router.list_permission_modules(db)

        assert [(m.module, m.permission_count) for m in result["data"]] == [("reports", 2), ("roles", 5)]

    async def test_create_permission_derives_name_and_audits(self, monkeypatch):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_row_first(None))
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)

        result = await role_router.create_permission(
            PermissionCreate(module="reports", action="export", description="Export reports"),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert result["status_code"] == 201
        assert result["data"].name == "reports:export"
        assert result["data"].is_system is False
        assert result["data"].is_active is True
        assert _audit_actions(audit) == ["PERMISSION_CREATED"]
        assert audit.await_args_list[0].kwargs["log_metadata"]["name"] == "reports:export"

    async def test_create_duplicate_permission_409(self, monkeypatch):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_row_first((uuid.uuid4(),)))
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.create_permission(
                PermissionCreate(module="reports", action="export"),
                _mock_request(),
                db,
                _make_user("super_admin"),
            )

        assert exc.value.status_code == 409
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    def test_permission_create_schema_rejects_bad_module_or_action(self):
        with pytest.raises(ValidationError):
            PermissionCreate(module="Reports", action="export")
        with pytest.raises(ValidationError):
            PermissionCreate(module="reports", action="Export Now")


class TestPermissionGetUpdateStatusDelete:
    async def test_get_permission_returns_mapped_roles(self):
        permission = _make_permission("roles:read")
        role = _make_role("hr", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(permission), _result_all([role])])

        result = await role_router.get_permission(permission.id, db)

        assert result["data"].name == "roles:read"
        assert [r.slug for r in result["data"].roles] == ["hr"]

    async def test_update_permission_description_audits_old_new(self, monkeypatch):
        permission = _make_permission("reports:export", description="old")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(permission))
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)

        result = await role_router.update_permission(
            permission.id, PermissionUpdate(description="new"), _mock_request(), db, _make_user("super_admin")
        )

        assert result["message"] == "Permission updated successfully"
        assert permission.description == "new"
        assert _audit_actions(audit) == ["PERMISSION_UPDATED"]
        changes = audit.await_args_list[0].kwargs["log_metadata"]["changes"]
        assert changes["description"] == {"old": "old", "new": "new"}

    @pytest.mark.parametrize("description", [None, "same"])
    async def test_update_permission_noop_short_circuits(self, monkeypatch, description):
        permission = _make_permission("reports:export", description="same")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(permission))
        audit = _capture_audit(monkeypatch)

        result = await role_router.update_permission(
            permission.id,
            PermissionUpdate(description=description),
            _mock_request(),
            db,
            _make_user("super_admin"),
        )

        assert result["message"] == "Permission unchanged"
        db.commit.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_system_permission_cannot_be_deactivated(self, monkeypatch):
        permission = _make_permission("roles:read", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(permission))
        audit = _capture_audit(monkeypatch)

        with pytest.raises(ApiError) as exc:
            await role_router.set_permission_status(
                permission.id, PermissionStatusUpdate(is_active=False), _mock_request(), db, _make_user("super_admin")
            )

        assert exc.value.status_code == 409
        assert exc.value.message == "System permissions cannot be deactivated"
        audit.assert_not_awaited()

    async def test_mapped_permission_cannot_be_deactivated(self, monkeypatch):
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(permission), _result_scalar(2)])

        with pytest.raises(ApiError) as exc:
            await role_router.set_permission_status(
                permission.id, PermissionStatusUpdate(is_active=False), _mock_request(), db, _make_user("super_admin")
            )
        assert exc.value.status_code == 409
        assert "2 role(s)" in exc.value.message

    async def test_custom_permission_deactivation_clears_whole_cache(self, monkeypatch):
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(permission), _result_scalar(0)])
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.set_permission_status(
            permission.id, PermissionStatusUpdate(is_active=False), _mock_request(), db, _make_user("super_admin")
        )

        assert permission.is_active is False
        assert result["message"] == "Permission deactivated"
        assert _audit_actions(audit) == ["PERMISSION_DEACTIVATED"]
        invalidate.assert_called_once_with()

    async def test_permission_activation_succeeds(self, monkeypatch):
        permission = _make_permission("reports:export", is_active=False)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(permission))
        db.refresh = AsyncMock(side_effect=_refresh_stamps)
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.set_permission_status(
            permission.id, PermissionStatusUpdate(is_active=True), _mock_request(), db, _make_user("super_admin")
        )

        assert permission.is_active is True
        assert result["message"] == "Permission activated"
        assert _audit_actions(audit) == ["PERMISSION_ACTIVATED"]
        invalidate.assert_called_once_with()

    async def test_permission_status_unchanged_short_circuits(self, monkeypatch):
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(permission))

        result = await role_router.set_permission_status(
            permission.id, PermissionStatusUpdate(is_active=True), _mock_request(), db, _make_user("super_admin")
        )

        assert result["message"] == "Permission status unchanged"
        db.commit.assert_not_awaited()

    async def test_system_permission_cannot_be_deleted(self, monkeypatch):
        permission = _make_permission("roles:read", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(permission))

        with pytest.raises(ApiError) as exc:
            await role_router.delete_permission(permission.id, _mock_request(), db, _make_user("super_admin"))
        assert exc.value.status_code == 409
        assert exc.value.message == "System permissions cannot be deleted"

    async def test_mapped_permission_cannot_be_deleted(self, monkeypatch):
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(permission), _result_scalar(1)])

        with pytest.raises(ApiError) as exc:
            await role_router.delete_permission(permission.id, _mock_request(), db, _make_user("super_admin"))
        assert exc.value.status_code == 409
        assert "1 role(s)" in exc.value.message

    async def test_custom_permission_soft_delete_clears_whole_cache(self, monkeypatch):
        permission = _make_permission("reports:export")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(permission), _result_scalar(0)])
        audit = _capture_audit(monkeypatch)
        invalidate = _capture_invalidate(monkeypatch)

        result = await role_router.delete_permission(permission.id, _mock_request(), db, _make_user("super_admin"))

        assert permission.deleted_at is not None
        assert result["message"] == "Permission deleted successfully"
        assert _audit_actions(audit) == ["PERMISSION_DELETED"]
        invalidate.assert_called_once_with()

    async def test_list_permission_roles_returns_live_roles(self):
        permission = _make_permission("roles:read")
        role = _make_role("hr", is_system=True)
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(permission), _result_all([role])])

        result = await role_router.list_permission_roles(permission.id, db)

        assert [r.slug for r in result["data"]] == ["hr"]


# ---------------------------------------------------------------------------
# Role users + activity
# ---------------------------------------------------------------------------


class TestRoleUsersAndActivity:
    async def test_list_role_users_filters_by_slug(self):
        role = _make_role("data_analyst")
        user = _make_user("data_analyst", name="Analyst One")
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_first(role), _result_all([user]), _result_scalar(1)])

        result = await role_router.list_role_users(role.id, db, PageParams())

        assert result["meta"].total == 1
        assert result["data"][0].name == "Analyst One"
        assert result["data"][0].status == "active"

    async def test_role_activity_resolves_actor_name(self):
        role = _make_role("data_analyst")
        log = AuditLog(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            action="ROLE_CREATED",
            entity_type="role",
            entity_id=role.id,
            ip_address="10.0.0.1",
            user_agent="pytest",
            log_metadata={"k": 1},
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db = _mock_db()
        db.execute = AsyncMock(
            side_effect=[_result_first(role), _result_rows([(log, "Admin Actor")]), _result_scalar(1)]
        )

        result = await role_router.get_role_activity(role.id, db, PageParams())

        entry = result["data"][0]
        assert entry.action == "ROLE_CREATED"
        assert entry.actor_name == "Admin Actor"
        assert entry.metadata == {"k": 1}


# ---------------------------------------------------------------------------
# require_permissions() enforcement layer
# ---------------------------------------------------------------------------


class TestRequirePermissions:
    async def test_super_admin_bypasses_without_db_query(self):
        db = _mock_db()
        dep = deps.require_permissions("roles:read")
        user = _make_user("super_admin")

        assert await dep(current_user=user, db=db) is user
        db.execute.assert_not_awaited()

    async def test_granted_role_passes_all_requested_permissions(self):
        db = _mock_db()
        db.execute = AsyncMock(
            return_value=_result_rows([(True, "roles:read", True, None), (True, "users:write", True, None)])
        )
        dep = deps.require_permissions("roles:read", "users:write")
        user = _make_user("custom_grantee")

        assert await dep(current_user=user, db=db) is user

    async def test_first_missing_permission_is_403(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(True, "roles:read", True, None)]))
        dep = deps.require_permissions("roles:read", "users:write")

        with pytest.raises(ApiError) as exc:
            await dep(current_user=_make_user("custom_partial"), db=db)

        assert exc.value.status_code == 403
        assert exc.value.message == "Missing permission: users:write"

    async def test_unknown_role_grants_nothing(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([]))
        dep = deps.require_permissions("roles:read")

        with pytest.raises(ApiError) as exc:
            await dep(current_user=_make_user("ghost_role"), db=db)
        assert exc.value.status_code == 403

    async def test_deactivated_role_grants_nothing(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(False, "roles:read", True, None)]))
        dep = deps.require_permissions("roles:read")

        with pytest.raises(ApiError) as exc:
            await dep(current_user=_make_user("frozen_role"), db=db)
        assert exc.value.status_code == 403

    async def test_inactive_permission_is_not_granted(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(True, "roles:read", False, None)]))
        dep = deps.require_permissions("roles:read")

        with pytest.raises(ApiError) as exc:
            await dep(current_user=_make_user("inactive_perm_role"), db=db)
        assert exc.value.status_code == 403

    async def test_soft_deleted_permission_is_not_granted(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(True, "roles:read", True, datetime.now(UTC))]))
        dep = deps.require_permissions("roles:read")

        with pytest.raises(ApiError) as exc:
            await dep(current_user=_make_user("deleted_perm_role"), db=db)
        assert exc.value.status_code == 403

    async def test_role_with_no_permissions_grants_nothing(self):
        # The LEFT JOIN yields one row with NULL permission columns — a role
        # that exists but grants nothing must still be treated as empty.
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(True, None, None, None)]))
        dep = deps.require_permissions("roles:read")

        with pytest.raises(ApiError) as exc:
            await dep(current_user=_make_user("empty_role"), db=db)
        assert exc.value.status_code == 403

    async def test_cache_hit_avoids_second_query(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(True, "roles:read", True, None)]))
        dep = deps.require_permissions("roles:read")
        user = _make_user("cache_hit_role")

        await dep(current_user=user, db=db)
        await dep(current_user=user, db=db)

        db.execute.assert_awaited_once()

    async def test_invalidation_forces_refetch(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(True, "roles:read", True, None)]))
        dep = deps.require_permissions("roles:read")
        user = _make_user("cache_inv_role")

        await dep(current_user=user, db=db)
        deps.invalidate_permission_cache("cache_inv_role")
        await dep(current_user=user, db=db)

        assert db.execute.await_count == 2

    async def test_ttl_expiry_forces_refetch(self, monkeypatch):
        fake_time = MagicMock()
        fake_time.monotonic = MagicMock(
            side_effect=[1000.0, 1000.0 + deps._PERMISSION_CACHE_TTL_SECONDS + 1.0]
        )
        monkeypatch.setattr(deps, "time", fake_time)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_rows([(True, "roles:read", True, None)]))
        dep = deps.require_permissions("roles:read")
        user = _make_user("cache_ttl_role")

        await dep(current_user=user, db=db)
        await dep(current_user=user, db=db)

        assert db.execute.await_count == 2

    async def test_revoked_permission_stops_working_on_next_request(self):
        """§50: after the mapping changes, the very next request on this
        worker must see the new state (invalidation), not the old grant."""
        db = _mock_db()
        db.execute = AsyncMock(
            return_value=_result_rows([(True, "roles:read", True, None), (True, "users:write", True, None)])
        )
        dep = deps.require_permissions("users:write")
        user = _make_user("revocation_role")
        await dep(current_user=user, db=db)

        # simulate the role->permission mapping removing users:write
        db.execute = AsyncMock(return_value=_result_rows([(True, "roles:read", True, None)]))
        deps.invalidate_permission_cache("revocation_role")

        with pytest.raises(ApiError) as exc:
            await dep(current_user=user, db=db)
        assert exc.value.status_code == 403
