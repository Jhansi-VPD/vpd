"""Comprehensive tests for the admin/HR user-management router
(app/routers/users.py) — the backend of the Super Admin portal's
/admin/users module.

Strategy: call the endpoint coroutines directly with mocked dependencies
(AsyncSession + patched CRUD/email/audit helpers), matching this suite's
established pattern. Unauthenticated (401) coverage lives in
test_api_comprehensive.py; the authorization matrix lives in
test_authz_gap_fixes.py / test_rbac_matrix.py. This file exercises the
endpoint behaviours: filters, guards, audit events, session handling,
CSV export safety and bulk semantics.
"""

import csv
import io
import json
import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from app.core.config import settings
from app.core.cookies import ACCESS_TOKEN_COOKIE
from app.core.errors import ApiError
from app.models.audit_log import AuditLog
from app.models.department import Department
from app.models.employee import Employee
from app.models.enums import EmployeeStatus, EmploymentType, UserRole
from app.models.password_reset_token import PasswordResetToken
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.models.user_session import UserSession
from app.routers import users as users_router
from app.schemas.user import BulkUserActionRequest, UserCreate, UserRoleAssignment, UserUpdate
from app.utils.pagination import PageParams
from app.utils.responses import build_pagination_meta

# ---------------------------------------------------------------------------
# Fixtures / factories
# ---------------------------------------------------------------------------


def _stamps() -> dict:
    now = datetime.now(UTC)
    return {"created_at": now, "updated_at": now}


def _make_user(role: UserRole = UserRole.employee, **overrides) -> User:
    """Transient User with every non-nullable column and derived-status input
    set explicitly — SQLAlchemy column defaults are NOT applied to objects
    that were never inserted."""
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


def _make_employee(user: User, department: Department | None = None, **overrides) -> Employee:
    data = {
        "id": uuid.uuid4(),
        "user_id": user.id,
        "employee_code": f"EMP-{uuid.uuid4().hex[:8].upper()}",
        "department_id": department.id if department is not None else None,
        "designation": "Engineer",
        "date_of_joining": None,
        "employment_type": EmploymentType.full_time,
        "status": EmployeeStatus.active,
        "department": department,
        **_stamps(),
    }
    data.update(overrides)
    return Employee(**data)


def _make_session(user: User, **overrides) -> UserSession:
    data = {
        "id": uuid.uuid4(),
        "user_id": user.id,
        "session_token_hash": uuid.uuid4().hex,
        "refresh_token_hash": uuid.uuid4().hex,
        "previous_refresh_token_hash": None,
        "expires_at": datetime.now(UTC) + timedelta(hours=1),
        "last_used_at": None,
        "revoked_at": None,
        "ip_address": "127.0.0.1",
        "user_agent": "pytest",
        **_stamps(),
    }
    data.update(overrides)
    return UserSession(**data)


def _mock_request(query: dict | None = None, cookies: dict | None = None) -> MagicMock:
    request = MagicMock()
    request.query_params = query or {}
    request.cookies = cookies or {}
    request.headers = {"user-agent": "pytest"}
    request.client.host = "127.0.0.1"
    return request


def _mock_db() -> AsyncMock:
    db = AsyncMock()
    db.add = MagicMock()
    return db


def _result_all(items: list) -> MagicMock:
    return MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=items))))


def _result_optional(value) -> MagicMock:
    return MagicMock(scalar_one_or_none=MagicMock(return_value=value))


def _result_scalar(value) -> MagicMock:
    return MagicMock(scalar_one=MagicMock(return_value=value))


def _result_first(value) -> MagicMock:
    return MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=value))))


def _result_rows(rows: list) -> MagicMock:
    return MagicMock(all=MagicMock(return_value=rows))


def _patch_crud_get(monkeypatch, target) -> AsyncMock:
    get = AsyncMock(return_value=target)
    monkeypatch.setattr(users_router.crud, "get", get)
    return get


def _patch_revoke(monkeypatch) -> AsyncMock:
    revoke = AsyncMock()
    monkeypatch.setattr(users_router, "revoke_all_sessions", revoke)
    return revoke


def _capture_audit(monkeypatch) -> AsyncMock:
    """Replace log_audit (called by the real _write_audit wrapper) so tests
    assert on the exact audit kwargs without touching a session factory."""
    audit = AsyncMock()
    monkeypatch.setattr(users_router, "log_audit", audit)
    return audit


def _audit_actions(audit: AsyncMock) -> list[str]:
    return [call.kwargs["action"] for call in audit.await_args_list]


def _apply_update_to(target: User):
    async def _update(db, user_id, data):
        for key, value in data.items():
            setattr(target, key, value)
        return target

    return _update


def _fake_create(captured: list):
    async def _create(db, data):
        captured.append(data)
        full = {
            "is_active": True,
            "phone": None,
            "avatar": None,
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
        full.update(data)
        return User(**full)

    return _create


# ---------------------------------------------------------------------------
# List + filters
# ---------------------------------------------------------------------------


class TestListUsers:
    async def test_list_returns_rows_and_meta(self, monkeypatch):
        dept = Department(id=uuid.uuid4(), name="Engineering", description=None, head_employee_id=None, **_stamps())
        user = _make_user()
        user.employee_profile = _make_employee(
            user, department=dept, employee_code="EMP-AB12CD34", designation="Engineer"
        )
        other = _make_user(name="No Profile")

        monkeypatch.setattr(
            users_router,
            "paginate_query",
            AsyncMock(return_value=([user, other], build_pagination_meta(2, 1, 20))),
        )
        result = await users_router.list_users(_mock_request(), _mock_db(), PageParams())

        assert result["message"] == "Users fetched"
        assert result["meta"].total == 2
        rows = result["data"]
        assert rows[0].employee_code == "EMP-AB12CD34"
        assert rows[0].department_name == "Engineering"
        assert rows[0].designation == "Engineer"
        assert rows[0].status == "active"
        assert rows[1].employee_code is None

    @pytest.mark.parametrize(
        ("query", "fragment"),
        [
            ({"role": "wizard"}, "Invalid role filter"),
            ({"status": "zombie"}, "Invalid status filter"),
            ({"is_active": "maybe"}, "Invalid is_active filter"),
            ({"department_id": "not-a-uuid"}, "Invalid department_id filter"),
            ({"created_from": "01-01-2026"}, "Invalid created_from date"),
            ({"created_to": "yesterday"}, "Invalid created_to date"),
        ],
    )
    async def test_invalid_filters_return_400(self, query, fragment):
        with pytest.raises(ApiError) as exc:
            await users_router.list_users(_mock_request(query), _mock_db(), PageParams())
        assert exc.value.status_code == 400
        assert fragment in exc.value.message

    async def test_full_filter_set_is_accepted(self, monkeypatch):
        paginate = AsyncMock(return_value=([], build_pagination_meta(0, 1, 20)))
        monkeypatch.setattr(users_router, "paginate_query", paginate)
        query = {
            "role": "hr",
            "status": "active",
            "is_active": "true",
            "department_id": str(uuid.uuid4()),
            "designation": "Eng",
            "created_from": "2026-01-01",
            "created_to": "2026-01-31",
            "search": "ann",
        }
        result = await users_router.list_users(_mock_request(query), _mock_db(), PageParams())
        assert result["data"] == []
        paginate.assert_awaited_once()


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------


class TestExportUsers:
    async def test_export_escapes_formulas_and_audits(self, monkeypatch):
        dept = Department(id=uuid.uuid4(), name="Engineering", description=None, head_employee_id=None, **_stamps())
        sneaky = _make_user(name="=2+2", email="evil@example.com")
        sneaky.employee_profile = _make_employee(sneaky, department=dept, employee_code="EMP-X")
        audit = _capture_audit(monkeypatch)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_all([sneaky]))

        resp = await users_router.export_users(_mock_request({"role": "hr"}), db, _make_user(role=UserRole.admin))

        assert resp.headers["content-disposition"].startswith('attachment; filename="vpd-users-')
        assert "text/csv" in resp.headers["content-type"]
        text = resp.body.decode("utf-8")
        assert text.startswith("\ufeff")
        rows = list(csv.reader(io.StringIO(text.lstrip("\ufeff"))))
        assert rows[0][0] == "Name"
        assert rows[0][4] == "Status"
        assert rows[1][0] == "'=2+2"
        kwargs = audit.await_args.kwargs
        assert kwargs["action"] == "USER_EXPORTED"
        assert kwargs["log_metadata"]["count"] == 1
        assert kwargs["log_metadata"]["filters"] == {"role": "hr"}

    async def test_export_rejects_invalid_filter(self):
        with pytest.raises(ApiError) as exc:
            await users_router.export_users(_mock_request({"role": "nope"}), _mock_db(), _make_user())
        assert exc.value.status_code == 400


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


class TestGetUser:
    async def test_detail_includes_employee_summary(self):
        dept = Department(id=uuid.uuid4(), name="Engineering", description=None, head_employee_id=None, **_stamps())
        user = _make_user()
        emp = _make_employee(user, department=dept)
        user.employee_profile = emp
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(user))

        result = await users_router.get_user(user.id, db)

        detail = result["data"]
        assert detail.is_locked is False
        assert detail.failed_login_attempts == 0
        assert detail.mfa_enabled is False
        assert detail.employee_profile.employee_code == emp.employee_code
        assert detail.employee_profile.department_name == "Engineering"

    async def test_missing_user_returns_404(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(None))
        with pytest.raises(ApiError) as exc:
            await users_router.get_user(uuid.uuid4(), db)
        assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


class TestCreateUser:
    async def test_invite_mode_creates_unverified_user_without_password(self, monkeypatch):
        captured: list = []
        monkeypatch.setattr(users_router.crud, "create", AsyncMock(side_effect=_fake_create(captured)))
        audit = _capture_audit(monkeypatch)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(None))

        payload = UserCreate(name="New Hire", email="new.hire@vpdtechnologies.com", role="sales")
        result = await users_router.create_user(payload, _mock_request(), db, _make_user(role=UserRole.admin))

        assert result["status_code"] == 201
        assert result["message"] == "User created successfully"
        assert result["data"]["invite_sent"] is False
        data = captured[0]
        assert data["is_email_verified"] is False
        assert "password" not in data
        assert data["password_hash"].startswith("$argon2")
        added = [call.args[0] for call in db.add.call_args_list]
        assert any(isinstance(obj, Employee) for obj in added)
        token = next(obj for obj in added if isinstance(obj, PasswordResetToken))
        assert len(token.token_hash) == 64
        assert token.used_at is None
        meta = audit.await_args.kwargs["log_metadata"]
        assert meta["invite_mode"] is True
        assert meta["invite_sent"] is False
        assert "password" not in json.dumps(result["data"])
        assert "password_hash" not in json.dumps(result["data"])

    async def test_inline_password_is_hashed_never_echoed(self, monkeypatch):
        captured: list = []
        monkeypatch.setattr(users_router.crud, "create", AsyncMock(side_effect=_fake_create(captured)))
        _capture_audit(monkeypatch)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(None))

        payload = UserCreate(
            name="Inline", email="inline@vpdtechnologies.com", role="developer", password="Str0ng@Pass1"
        )
        result = await users_router.create_user(payload, _mock_request(), db, _make_user(role=UserRole.admin))

        data = captured[0]
        assert data["is_email_verified"] is True
        assert data["email_verified_at"] is not None
        assert data["password_hash"] != "Str0ng@Pass1"
        assert data["password_hash"].startswith("$argon2")
        added = [call.args[0] for call in db.add.call_args_list]
        assert not any(isinstance(obj, PasswordResetToken) for obj in added)
        assert "Str0ng@Pass1" not in json.dumps(result["data"])

    async def test_department_and_designation_flow_to_employee_row(self, monkeypatch):
        captured: list = []
        monkeypatch.setattr(users_router.crud, "create", AsyncMock(side_effect=_fake_create(captured)))
        _capture_audit(monkeypatch)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(None))
        dept = Department(id=uuid.uuid4(), name="Sales", description=None, head_employee_id=None, **_stamps())
        db.get = AsyncMock(return_value=dept)

        payload = UserCreate(
            name="Sales Rep", email="rep@vpdtechnologies.com", role="sales", designation="SDR", department_id=dept.id
        )
        await users_router.create_user(payload, _mock_request(), db, _make_user(role=UserRole.admin))

        emp = next(call.args[0] for call in db.add.call_args_list if isinstance(call.args[0], Employee))
        assert emp.designation == "SDR"
        assert emp.department_id == dept.id
        assert emp.employee_code.startswith("EMP-")

    async def test_duplicate_email_returns_409(self):
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(_make_user()))
        payload = UserCreate(name="Dup", email="dup@vpdtechnologies.com")
        with pytest.raises(ApiError) as exc:
            await users_router.create_user(payload, _mock_request(), db, _make_user(role=UserRole.admin))
        assert exc.value.status_code == 409

    async def test_hr_cannot_create_admin(self):
        payload = UserCreate(name="New Admin", email="admin2@vpdtechnologies.com", role="admin")
        with pytest.raises(ApiError) as exc:
            await users_router.create_user(payload, _mock_request(), _mock_db(), _make_user(role=UserRole.hr))
        assert exc.value.status_code == 403

    async def test_designation_rejected_for_non_employee_role(self):
        payload = UserCreate(name="Client", email="client2@example.com", role="client", designation="CEO")
        with pytest.raises(ApiError) as exc:
            await users_router.create_user(payload, _mock_request(), _mock_db(), _make_user(role=UserRole.admin))
        assert exc.value.status_code == 400

    async def test_unknown_department_returns_400(self, monkeypatch):
        create = AsyncMock()
        monkeypatch.setattr(users_router.crud, "create", create)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(None))
        db.get = AsyncMock(return_value=None)

        payload = UserCreate(name="X", email="x@vpdtechnologies.com", department_id=uuid.uuid4())
        with pytest.raises(ApiError) as exc:
            await users_router.create_user(payload, _mock_request(), db, _make_user(role=UserRole.admin))
        assert exc.value.status_code == 400
        create.assert_not_awaited()


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


class TestUpdateUser:
    async def test_role_change_writes_updated_and_role_audits(self, monkeypatch):
        target = _make_user(role=UserRole.employee)
        _patch_crud_get(monkeypatch, target)
        monkeypatch.setattr(users_router.crud, "update", AsyncMock(side_effect=_apply_update_to(target)))
        audit = _capture_audit(monkeypatch)

        result = await users_router.update_user(
            target.id, UserUpdate(role=UserRole.sales), _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User updated successfully"
        assert target.role == UserRole.sales
        assert _audit_actions(audit) == ["USER_UPDATED", "ROLE_REMOVED", "ROLE_ASSIGNED"]
        snapshot = audit.await_args_list[0].kwargs["log_metadata"]
        assert snapshot["previous"]["role"] == "employee"
        assert snapshot["new"]["role"] == "sales"

    async def test_email_change_resets_verification(self, monkeypatch):
        target = _make_user(is_email_verified=True)
        _patch_crud_get(monkeypatch, target)
        update = AsyncMock(side_effect=_apply_update_to(target))
        monkeypatch.setattr(users_router.crud, "update", update)
        _capture_audit(monkeypatch)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(None))

        result = await users_router.update_user(
            target.id,
            UserUpdate(email="renamed@vpdtechnologies.com"),
            _mock_request(),
            db,
            _make_user(role=UserRole.admin),
        )

        assert result["message"] == "User updated successfully"
        data = update.await_args.args[2]
        assert data["is_email_verified"] is False
        assert data["email_verified_at"] is None
        assert target.is_email_verified is False

    async def test_email_unchanged_keeps_verification(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        update = AsyncMock(side_effect=_apply_update_to(target))
        monkeypatch.setattr(users_router.crud, "update", update)
        _capture_audit(monkeypatch)

        await users_router.update_user(
            target.id, UserUpdate(email=target.email), _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        data = update.await_args.args[2]
        assert "is_email_verified" not in data
        assert "email_verified_at" not in data

    async def test_email_duplicate_returns_409(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(_make_user()))

        with pytest.raises(ApiError) as exc:
            await users_router.update_user(
                target.id,
                UserUpdate(email="taken@vpdtechnologies.com"),
                _mock_request(),
                db,
                _make_user(role=UserRole.admin),
            )
        assert exc.value.status_code == 409

    async def test_is_active_false_routes_through_deactivate(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        update = AsyncMock(side_effect=_apply_update_to(target))
        monkeypatch.setattr(users_router.crud, "update", update)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.update_user(
            target.id, UserUpdate(is_active=False), _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User updated successfully"
        assert target.is_active is False
        update.assert_not_awaited()
        revoke.assert_awaited_once()
        assert _audit_actions(audit) == ["USER_DEACTIVATED"]

    async def test_is_active_true_routes_through_activate(self, monkeypatch):
        target = _make_user(
            is_active=False,
            is_locked=True,
            failed_login_attempts=4,
            locked_until=datetime.now(UTC) + timedelta(minutes=10),
        )
        _patch_crud_get(monkeypatch, target)
        monkeypatch.setattr(users_router.crud, "update", AsyncMock(side_effect=_apply_update_to(target)))
        audit = _capture_audit(monkeypatch)

        await users_router.update_user(
            target.id, UserUpdate(is_active=True), _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert target.is_active is True
        assert target.is_locked is False
        assert target.failed_login_attempts == 0
        assert _audit_actions(audit) == ["USER_ACTIVATED"]

    async def test_same_role_is_a_noop(self, monkeypatch):
        target = _make_user(role=UserRole.employee)
        _patch_crud_get(monkeypatch, target)
        update = AsyncMock(side_effect=_apply_update_to(target))
        monkeypatch.setattr(users_router.crud, "update", update)
        audit = _capture_audit(monkeypatch)

        result = await users_router.update_user(
            target.id, UserUpdate(role=UserRole.employee), _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User updated successfully"
        update.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_hr_cannot_grant_admin(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        with pytest.raises(ApiError) as exc:
            await users_router.update_user(
                target.id, UserUpdate(role=UserRole.admin), _mock_request(), _mock_db(), _make_user(role=UserRole.hr)
            )
        assert exc.value.status_code == 403

    async def test_cannot_change_own_role(self, monkeypatch):
        hr = _make_user(role=UserRole.hr)
        _patch_crud_get(monkeypatch, hr)
        with pytest.raises(ApiError) as exc:
            await users_router.update_user(hr.id, UserUpdate(role=UserRole.employee), _mock_request(), _mock_db(), hr)
        assert exc.value.status_code == 400
        assert "own account" in exc.value.message

    async def test_cannot_demote_last_active_super_admin(self, monkeypatch):
        target = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, target)
        monkeypatch.setattr(users_router, "_active_super_admin_count", AsyncMock(return_value=1))
        caller = _make_user(role=UserRole.super_admin)

        with pytest.raises(ApiError) as exc:
            await users_router.update_user(
                target.id, UserUpdate(role=UserRole.admin), _mock_request(), _mock_db(), caller
            )
        assert exc.value.status_code == 400
        assert "last active Super Admin" in exc.value.message


# ---------------------------------------------------------------------------
# State transitions (PATCH / DELETE / lock)
# ---------------------------------------------------------------------------


class TestStateTransitions:
    async def test_suspend_sets_flag_revokes_and_audits(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.suspend_user(
            target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User suspended"
        assert target.suspended_at is not None
        assert target.is_active is False
        assert target.status == "suspended"
        revoke.assert_awaited_once()
        kwargs = audit.await_args.kwargs
        assert kwargs["action"] == "USER_SUSPENDED"
        assert kwargs["entity_type"] == "user"
        assert kwargs["entity_id"] == target.id

    async def test_suspend_self_is_blocked(self, monkeypatch):
        me = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, me)
        with pytest.raises(ApiError) as exc:
            await users_router.suspend_user(me.id, _mock_request(), _mock_db(), me)
        assert exc.value.status_code == 400
        assert "own account" in exc.value.message

    async def test_suspend_is_idempotent(self, monkeypatch):
        target = _make_user(suspended_at=datetime.now(UTC), is_active=False)
        _patch_crud_get(monkeypatch, target)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.suspend_user(
            target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User suspended"
        revoke.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_restore_requires_suspended_account(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        with pytest.raises(ApiError) as exc:
            await users_router.restore_user(target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin))
        assert exc.value.status_code == 400
        assert "not suspended" in exc.value.message

    async def test_restore_lifts_suspension(self, monkeypatch):
        target = _make_user(suspended_at=datetime.now(UTC), is_active=False)
        _patch_crud_get(monkeypatch, target)
        audit = _capture_audit(monkeypatch)

        result = await users_router.restore_user(
            target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User restored"
        assert target.suspended_at is None
        assert target.is_active is True
        assert _audit_actions(audit) == ["USER_RESTORED"]

    async def test_activate_self_is_blocked_even_when_idempotent(self, monkeypatch):
        me = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, me)
        with pytest.raises(ApiError) as exc:
            await users_router.activate_user(me.id, _mock_request(), _mock_db(), me)
        assert exc.value.status_code == 400
        assert "own account" in exc.value.message

    async def test_activate_clears_lockout_state(self, monkeypatch):
        target = _make_user(
            is_active=False,
            is_locked=True,
            locked_until=datetime.now(UTC) + timedelta(minutes=10),
            failed_login_attempts=5,
        )
        _patch_crud_get(monkeypatch, target)
        audit = _capture_audit(monkeypatch)

        result = await users_router.activate_user(
            target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User activated"
        assert target.is_active is True
        assert target.is_locked is False
        assert target.locked_until is None
        assert target.failed_login_attempts == 0
        assert _audit_actions(audit) == ["USER_ACTIVATED"]

    async def test_deactivate_is_idempotent(self, monkeypatch):
        target = _make_user(is_active=False)
        _patch_crud_get(monkeypatch, target)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.deactivate_user(
            target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User deactivated"
        revoke.assert_not_awaited()
        audit.assert_not_awaited()

    async def test_deactivate_revokes_sessions_and_audits(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.deactivate_user(
            target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User deactivated"
        assert target.is_active is False
        revoke.assert_awaited_once()
        assert _audit_actions(audit) == ["USER_DEACTIVATED"]

    async def test_deactivate_self_is_blocked(self, monkeypatch):
        me = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, me)
        with pytest.raises(ApiError) as exc:
            await users_router.deactivate_user(me.id, _mock_request(), _mock_db(), me)
        assert exc.value.status_code == 400
        assert "own account" in exc.value.message

    async def test_cannot_deactivate_last_active_super_admin(self, monkeypatch):
        target = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, target)
        monkeypatch.setattr(users_router, "_active_super_admin_count", AsyncMock(return_value=1))
        caller = _make_user(role=UserRole.super_admin)

        with pytest.raises(ApiError) as exc:
            await users_router.deactivate_user(target.id, _mock_request(), _mock_db(), caller)
        assert exc.value.status_code == 400
        assert "last active Super Admin" in exc.value.message

    async def test_delete_is_soft_and_preserves_history(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.delete_user(target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin))

        assert "history preserved" in result["message"]
        assert result["data"] is None
        assert target.is_active is False
        revoke.assert_awaited_once()
        kwargs = audit.await_args.kwargs
        assert kwargs["action"] == "USER_DELETED"
        assert kwargs["log_metadata"] == {"mode": "soft"}

    async def test_delete_self_is_blocked(self, monkeypatch):
        me = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, me)
        with pytest.raises(ApiError) as exc:
            await users_router.delete_user(me.id, _mock_request(), _mock_db(), me)
        assert exc.value.status_code == 400
        assert "own account" in exc.value.message

    async def test_manual_lock_revokes_sessions(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.lock_user(target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin))

        assert result["message"] == "User locked"
        assert target.is_locked is True
        assert target.locked_until is None
        revoke.assert_awaited_once()
        kwargs = audit.await_args.kwargs
        assert kwargs["action"] == "USER_LOCKED"
        assert kwargs["log_metadata"] == {"until": None}

    async def test_lock_self_is_blocked(self, monkeypatch):
        me = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, me)
        with pytest.raises(ApiError) as exc:
            await users_router.lock_user(me.id, _mock_request(), _mock_db(), me)
        assert exc.value.status_code == 400
        assert "own account" in exc.value.message

    async def test_unlock_clears_attempts(self, monkeypatch):
        target = _make_user(is_locked=True, failed_login_attempts=3)
        _patch_crud_get(monkeypatch, target)
        audit = _capture_audit(monkeypatch)

        result = await users_router.unlock_user(target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin))

        assert result["message"] == "User unlocked"
        assert target.is_locked is False
        assert target.failed_login_attempts == 0
        assert _audit_actions(audit) == ["USER_UNLOCKED"]

    async def test_unlock_is_noop_on_clean_account(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        audit = _capture_audit(monkeypatch)
        db = _mock_db()

        result = await users_router.unlock_user(target.id, _mock_request(), db, _make_user(role=UserRole.admin))

        assert result["message"] == "User unlocked"
        audit.assert_not_awaited()
        db.commit.assert_not_awaited()

    async def test_revoke_all_sessions_allowed_on_self(self, monkeypatch):
        me = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, me)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        result = await users_router.revoke_user_sessions(me.id, _mock_request(), _mock_db(), me)

        assert result["message"] == "Sessions revoked successfully"
        revoke.assert_awaited_once()
        assert audit.await_args.kwargs["log_metadata"] == {"scope": "all"}

    async def test_audit_failure_never_changes_response(self, monkeypatch):
        failing = AsyncMock(side_effect=RuntimeError("audit store down"))
        monkeypatch.setattr(users_router, "log_audit", failing)
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        _patch_revoke(monkeypatch)

        result = await users_router.suspend_user(
            target.id, _mock_request(), _mock_db(), _make_user(role=UserRole.admin)
        )

        assert result["message"] == "User suspended"
        failing.assert_awaited_once()


# ---------------------------------------------------------------------------
# Force password reset
# ---------------------------------------------------------------------------


class TestForcePasswordReset:
    async def test_issues_hashed_single_use_token_only(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        revoke = _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)
        db = _mock_db()

        result = await users_router.force_password_reset(
            target.id, _mock_request(), db, _make_user(role=UserRole.admin)
        )

        assert result["data"] == {"email_sent": False}
        assert "not configured" in result["message"]
        assert "token" not in json.dumps(result["data"])
        tokens = [call.args[0] for call in db.add.call_args_list if isinstance(call.args[0], PasswordResetToken)]
        assert len(tokens) == 1
        assert len(tokens[0].token_hash) == 64
        assert tokens[0].used_at is None
        assert tokens[0].expires_at > datetime.now(UTC)
        revoke.assert_awaited_once()
        kwargs = audit.await_args.kwargs
        assert kwargs["action"] == "PASSWORD_RESET_REQUESTED"
        assert kwargs["log_metadata"] == {"forced": True, "email_sent": False}

    async def test_with_email_configured_sends_reset_link(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)
        monkeypatch.setattr(settings, "brevo_api_key", "test-key")
        send = AsyncMock()
        monkeypatch.setattr(users_router, "send_password_reset_email", send)
        db = _mock_db()

        result = await users_router.force_password_reset(
            target.id, _mock_request(), db, _make_user(role=UserRole.admin)
        )

        assert result["data"] == {"email_sent": True}
        assert result["message"] == "Password reset email sent to the user"
        assert "/reset-password?token=" in send.await_args.args[2]
        assert audit.await_args.kwargs["log_metadata"] == {"forced": True, "email_sent": True}

    async def test_self_force_reset_is_blocked(self, monkeypatch):
        me = _make_user(role=UserRole.super_admin)
        _patch_crud_get(monkeypatch, me)
        with pytest.raises(ApiError) as exc:
            await users_router.force_password_reset(me.id, _mock_request(), _mock_db(), me)
        assert exc.value.status_code == 400
        assert "own account" in exc.value.message
        assert "own account" in exc.value.message


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


class TestSessionsEndpoints:
    async def test_list_marks_current_without_leaking_hashes(self, monkeypatch):
        user = _make_user()
        _patch_crud_get(monkeypatch, user)
        current = _make_session(user, session_token_hash="HASH-CALLER")
        other = _make_session(user, session_token_hash="HASH-OTHER")
        monkeypatch.setattr(users_router, "hash_token", lambda token: "HASH-CALLER")
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_all([current, other]))

        request = _mock_request(cookies={ACCESS_TOKEN_COOKIE: "caller-token"})
        result = await users_router.list_user_sessions(user.id, request, db, user)

        data = result["data"]
        assert data[0].is_current is True
        assert data[1].is_current is False
        dumped = json.dumps([item.model_dump(mode="json") for item in data])
        assert "session_token_hash" not in dumped
        assert "refresh_token_hash" not in dumped

    async def test_revoke_single_session(self, monkeypatch):
        user = _make_user()
        _patch_crud_get(monkeypatch, user)
        session = _make_session(user)
        audit = _capture_audit(monkeypatch)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(session))

        result = await users_router.revoke_user_session(
            user.id, session.id, _mock_request(), db, _make_user(role=UserRole.admin)
        )

        assert result["message"] == "Session revoked successfully"
        assert session.revoked_at is not None
        db.commit.assert_awaited()
        kwargs = audit.await_args.kwargs
        assert kwargs["action"] == "SESSIONS_REVOKED"
        assert kwargs["log_metadata"]["scope"] == "one"
        assert kwargs["log_metadata"]["session_id"] == str(session.id)

    async def test_revoke_unknown_session_returns_404(self, monkeypatch):
        user = _make_user()
        _patch_crud_get(monkeypatch, user)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_optional(None))

        with pytest.raises(ApiError) as exc:
            await users_router.revoke_user_session(
                user.id, uuid.uuid4(), _mock_request(), db, _make_user(role=UserRole.admin)
            )
        assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Login history + activity
# ---------------------------------------------------------------------------


class TestLoginHistory:
    async def test_merged_timeline_newest_first(self, monkeypatch):
        user = _make_user()
        _patch_crud_get(monkeypatch, user)
        now = datetime.now(UTC)
        active = _make_session(user, created_at=now - timedelta(minutes=30), updated_at=now - timedelta(minutes=30))
        revoked = _make_session(
            user,
            created_at=now - timedelta(hours=2),
            updated_at=now - timedelta(hours=2),
            revoked_at=now - timedelta(hours=1),
        )
        expired = _make_session(
            user,
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=3),
            expires_at=now - timedelta(hours=1),
        )
        failure = AuditLog(
            id=uuid.uuid4(),
            user_id=None,
            action="LOGIN_FAILED",
            entity_type="user",
            entity_id=user.id,
            ip_address="1.2.3.4",
            user_agent="curl",
            log_metadata={"reason": "invalid_password"},
            created_at=now - timedelta(minutes=10),
            updated_at=now - timedelta(minutes=10),
        )
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_all([active, revoked, expired]), _result_all([failure])])

        result = await users_router.get_login_history(user.id, db, limit=50)

        entries = result["data"]
        assert [e.status for e in entries] == ["failed", "active", "revoked", "expired"]
        assert [e.success for e in entries] == [False, True, True, True]
        assert entries[0].event == "login_failed"
        assert entries[0].ip_address == "1.2.3.4"


class TestActivity:
    async def test_activity_entries_include_actor_and_meta(self, monkeypatch):
        user = _make_user()
        _patch_crud_get(monkeypatch, user)
        log = AuditLog(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            action="USER_SUSPENDED",
            entity_type="user",
            entity_id=user.id,
            ip_address="10.0.0.1",
            user_agent="pytest",
            log_metadata={"x": 1},
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db = _mock_db()
        db.execute = AsyncMock(side_effect=[_result_scalar(3), _result_rows([(log, "Admin Actor")])])

        result = await users_router.get_user_activity(user.id, db, PageParams(page=2, limit=10))

        assert result["meta"].total == 3
        assert result["meta"].page == 2
        entry = result["data"][0]
        assert entry.action == "USER_SUSPENDED"
        assert entry.actor_name == "Admin Actor"
        assert entry.metadata == {"x": 1}


# ---------------------------------------------------------------------------
# Roles + permissions
# ---------------------------------------------------------------------------


class TestRoles:
    async def test_hr_role_options_hide_privileged_roles(self, monkeypatch):
        target = _make_user(role=UserRole.employee)
        _patch_crud_get(monkeypatch, target)

        result = await users_router.get_user_roles(target.id, _mock_db(), _make_user(role=UserRole.hr))

        assert result["data"]["current"] == "employee"
        assert "admin" not in result["data"]["available"]
        assert "super_admin" not in result["data"]["available"]
        assert "employee" in result["data"]["available"]

    async def test_super_admin_sees_full_role_list(self, monkeypatch):
        target = _make_user(role=UserRole.hr)
        _patch_crud_get(monkeypatch, target)

        result = await users_router.get_user_roles(target.id, _mock_db(), _make_user(role=UserRole.super_admin))

        assert result["data"]["current"] == "hr"
        assert set(result["data"]["available"]) == {role.value for role in UserRole}

    async def test_assign_role_writes_removed_and_assigned_audits(self, monkeypatch):
        target = _make_user(role=UserRole.employee)
        _patch_crud_get(monkeypatch, target)
        audit = _capture_audit(monkeypatch)

        result = await users_router.update_user_roles(
            target.id,
            UserRoleAssignment(roles=[UserRole.sales]),
            _mock_request(),
            _mock_db(),
            _make_user(role=UserRole.admin),
        )

        assert result["message"] == "Role updated successfully"
        assert result["data"] == {"role": "sales"}
        assert target.role == UserRole.sales
        assert _audit_actions(audit) == ["ROLE_REMOVED", "ROLE_ASSIGNED"]

    async def test_same_role_is_unchanged(self, monkeypatch):
        target = _make_user(role=UserRole.employee)
        _patch_crud_get(monkeypatch, target)
        audit = _capture_audit(monkeypatch)
        db = _mock_db()

        result = await users_router.update_user_roles(
            target.id,
            UserRoleAssignment(roles=[UserRole.employee]),
            _mock_request(),
            db,
            _make_user(role=UserRole.admin),
        )

        assert result["message"] == "Role unchanged"
        audit.assert_not_awaited()
        db.commit.assert_not_awaited()

    async def test_hr_cannot_grant_admin_via_roles_endpoint(self, monkeypatch):
        target = _make_user(role=UserRole.employee)
        _patch_crud_get(monkeypatch, target)

        with pytest.raises(ApiError) as exc:
            await users_router.update_user_roles(
                target.id,
                UserRoleAssignment(roles=[UserRole.admin]),
                _mock_request(),
                _mock_db(),
                _make_user(role=UserRole.hr),
            )
        assert exc.value.status_code == 403

    def test_assignment_schema_pins_exactly_one_role(self):
        with pytest.raises(ValidationError):
            UserRoleAssignment(roles=[])
        with pytest.raises(ValidationError):
            UserRoleAssignment(roles=[UserRole.employee, UserRole.hr])


class TestPermissions:
    async def test_permissions_sorted_come_from_role(self, monkeypatch):
        target = _make_user(role=UserRole.employee)
        _patch_crud_get(monkeypatch, target)
        role = Role(id=uuid.uuid4(), name="Employee", slug="employee", description=None, is_system=True, **_stamps())
        role.permissions = [
            Permission(
                id=uuid.uuid4(), name="users.update", module="users", action="update", description=None, **_stamps()
            ),
            Permission(
                id=uuid.uuid4(), name="users.create", module="users", action="create", description=None, **_stamps()
            ),
            Permission(
                id=uuid.uuid4(), name="auth.login", module="auth", action="login", description=None, **_stamps()
            ),
        ]
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(role))

        result = await users_router.get_user_permissions(target.id, db)

        assert result["data"]["role"] == "employee"
        assert result["data"]["source"] == "role"
        assert [(p.module, p.action) for p in result["data"]["permissions"]] == [
            ("auth", "login"),
            ("users", "create"),
            ("users", "update"),
        ]

    async def test_missing_role_row_yields_empty_permissions(self, monkeypatch):
        target = _make_user()
        _patch_crud_get(monkeypatch, target)
        db = _mock_db()
        db.execute = AsyncMock(return_value=_result_first(None))

        result = await users_router.get_user_permissions(target.id, db)

        assert result["data"]["permissions"] == []


# ---------------------------------------------------------------------------
# Bulk actions
# ---------------------------------------------------------------------------


class TestBulkActions:
    async def test_partial_failure_reported_per_user(self, monkeypatch):
        good = _make_user(role=UserRole.employee)
        admin_target = _make_user(role=UserRole.admin)
        missing_id = uuid.uuid4()
        monkeypatch.setattr(
            users_router.crud,
            "get",
            AsyncMock(side_effect=[good, ApiError.not_found("User not found"), admin_target]),
        )
        _patch_revoke(monkeypatch)
        audit = _capture_audit(monkeypatch)

        payload = BulkUserActionRequest(action="deactivate", user_ids=[good.id, missing_id, admin_target.id])
        result = await users_router.bulk_user_action(payload, _mock_request(), _mock_db(), _make_user(role=UserRole.hr))

        data = result["data"]
        assert data["total"] == 3
        assert data["succeeded"] == [str(good.id)]
        assert [f["user_id"] for f in data["failed"]] == [str(missing_id), str(admin_target.id)]
        assert data["failed"][0]["reason"] == "User not found"
        assert data["failed"][1]["reason"] == "Only a Super Admin can manage an Admin or Super Admin account"
        assert _audit_actions(audit)[-1] == "USERS_BULK_ACTION"
        meta = audit.await_args_list[-1].kwargs["log_metadata"]
        assert meta == {"action": "deactivate", "succeeded": 1, "failed": 2}

    async def test_self_in_bulk_is_reported_not_crashed(self, monkeypatch):
        caller = _make_user(role=UserRole.super_admin)
        other = _make_user(role=UserRole.employee)
        monkeypatch.setattr(users_router.crud, "get", AsyncMock(side_effect=[caller, other]))
        _patch_revoke(monkeypatch)
        _capture_audit(monkeypatch)

        payload = BulkUserActionRequest(action="deactivate", user_ids=[caller.id, other.id])
        result = await users_router.bulk_user_action(payload, _mock_request(), _mock_db(), caller)

        assert result["data"]["succeeded"] == [str(other.id)]
        assert result["data"]["failed"][0]["reason"] == "You cannot deactivate your own account"

    def test_bulk_schema_rejects_delete_and_empty_lists(self):
        with pytest.raises(ValidationError):
            BulkUserActionRequest(action="delete", user_ids=[uuid.uuid4()])
        with pytest.raises(ValidationError):
            BulkUserActionRequest(action="deactivate", user_ids=[])


# ---------------------------------------------------------------------------
# Derived status
# ---------------------------------------------------------------------------


class TestDerivedStatus:
    def test_status_precedence_matches_sql_mirror(self):
        assert _make_user().status == "active"
        assert _make_user(is_email_verified=False).status == "pending"
        assert _make_user(is_locked=True).status == "locked"
        assert _make_user(is_active=False).status == "inactive"
        assert _make_user(suspended_at=datetime.now(UTC)).status == "suspended"
