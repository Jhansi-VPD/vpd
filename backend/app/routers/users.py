"""Admin/HR user-management endpoints — the full lifecycle surface for the
Super Admin portal's /admin/users module.

Design notes (kept here rather than scattered):
- Backend-enforced RBAC: the router admits admin/hr/super_admin; every
  mutation additionally guards admin/super_admin *targets* (only a Super
  Admin may act on those) and blocks self-lockout (no acting on your own
  account for role/state changes) plus demote/deactivate/lock/delete of the
  last active Super Admin.
- Status model is derived from what the schema already stores (see
  User.status): suspended > inactive > locked > pending > active. No
  parallel status column exists.
- Audit events (entity_type="user"): USER_CREATED, USER_UPDATED,
  USER_DELETED, USER_ACTIVATED, USER_DEACTIVATED, USER_SUSPENDED,
  USER_RESTORED, USER_LOCKED, USER_UNLOCKED, ROLE_ASSIGNED, ROLE_REMOVED,
  PASSWORD_RESET_REQUESTED, SESSIONS_REVOKED, USER_EXPORTED.
- Passwords: never generated-and-returned, never logged. Force-reset issues
  a hashed single-use token + email link only.
- Delete is a soft delete (= deactivation; history preserved) — the schema's
  Base.deleted_at column is intentionally unused across this codebase.
"""

import csv
import io
import secrets
import uuid
from datetime import UTC, date, datetime, time, timedelta
from enum import Enum

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.audit import log_audit
from app.core.config import settings
from app.core.cookies import ACCESS_TOKEN_COOKIE
from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, require_roles
from app.core.errors import ApiError
from app.core.logger import logger
from app.core.password import hash_password
from app.core.tokens import generate_token, hash_token
from app.crud.base import CRUDBase
from app.models.audit_log import AuditLog
from app.models.department import Department
from app.models.employee import Employee
from app.models.enums import UserRole
from app.models.password_reset_token import PasswordResetToken
from app.models.role import Role
from app.models.user import User
from app.models.user_session import UserSession
from app.routers.auth import PASSWORD_RESET_TOKEN_TTL
from app.schemas.role import PermissionOut
from app.schemas.user import (
    BulkUserActionRequest,
    LoginHistoryEntry,
    UserActivityEntry,
    UserCreate,
    UserDetailOut,
    UserEmployeeSummary,
    UserListOut,
    UserOut,
    UserRoleAssignment,
    UserSessionOut,
    UserUpdate,
)
from app.services.auth_service import is_account_locked, revoke_all_sessions
from app.services.email_service import send_password_reset_email
from app.utils.pagination import PageParams, page_params, paginate_query
from app.utils.responses import build_pagination_meta, success_response

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(require_roles("admin", "hr"))])

crud = CRUDBase(User, searchable_fields=["name", "email"])

# Roles that get an auto-created Employee profile (and may carry
# designation/department). client/guest/partner accounts do not.
EMPLOYEE_ROLES = {
    "employee",
    "developer",
    "sales",
    "marketing",
    "project_manager",
    "qa",
    "support",
    "finance",
    "hr",
    "admin",
    "super_admin",
}

# CSV exports are capped so a filtered export can never be an unbounded query.
_EXPORT_MAX_ROWS = 10000

# Sortable columns: user fields plus the two employee-joined sort keys.
_SORT_COLUMNS = {
    "name": User.name,
    "email": User.email,
    "role": User.role,
    "created_at": User.created_at,
    "updated_at": User.updated_at,
    "last_login_at": User.last_login_at,
    "employee_code": Employee.employee_code,
    "designation": Employee.designation,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _role_value(role) -> str:
    return getattr(role, "value", role)


def _jsonable(value):
    """Audit metadata must be JSONB-serializable — datetimes/UUIDs/enums are
    converted to strings, everything else passes through."""
    if isinstance(value, Enum):
        return getattr(value, "value", str(value))
    if isinstance(value, datetime | date):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


async def _write_audit(
    request: Request, actor: User, action: str, entity_id: uuid.UUID | None = None, metadata: dict | None = None
) -> None:
    """Best-effort audit write — same swallow-and-log pattern as the login
    failure audit: an audit-store problem must never change the response the
    admin sees."""
    try:
        await log_audit(
            user_id=actor.id,
            action=action,
            entity_type="user",
            entity_id=entity_id,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            log_metadata=metadata or {},
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Audit log failed: %s", exc)


async def _load_guarded_target(db: AsyncSession, user_id: uuid.UUID, current_user: User) -> User:
    """Fetch the target user (404 if missing) and enforce the admin-target
    rule: only a Super Admin may manage an Admin or Super Admin account."""
    target = await crud.get(db, user_id)
    if _role_value(target.role) in ("admin", "super_admin") and current_user.role != "super_admin":
        raise ApiError.forbidden("Only a Super Admin can manage an Admin or Super Admin account")
    return target


def _ensure_not_self(current_user: User, target: User, verb: str) -> None:
    if current_user.id == target.id:
        raise ApiError.bad_request(f"You cannot {verb} your own account")


async def _active_super_admin_count(db: AsyncSession) -> int:
    stmt = (
        select(func.count())
        .select_from(User)
        .where(User.role == UserRole.super_admin, User.is_active.is_(True), User.suspended_at.is_(None))
    )
    return (await db.execute(stmt)).scalar_one()


async def _protect_last_super_admin(db: AsyncSession, target: User, action: str) -> None:
    """Early-returns for every non-super target (cheap, and keeps non-super
    flows free of the count query), then refuses the action when it would
    leave zero active Super Admins."""
    if _role_value(target.role) != "super_admin" or not target.is_active or target.suspended_at is not None:
        return
    if await _active_super_admin_count(db) <= 1:
        raise ApiError.bad_request(f"Cannot {action} the last active Super Admin")


def _status_condition(status: str):
    """SQL mirror of User.status (keep both in sync). Explicit positive/
    negative column predicates rather than `~` so NULL semantics stay exact:
    is_locked is never NULL in practice, but locked_until is."""
    locked_now = and_(User.is_locked.is_(True), or_(User.locked_until.is_(None), User.locked_until > func.now()))
    not_locked_now = or_(
        User.is_locked.is_(False), and_(User.locked_until.is_not(None), User.locked_until <= func.now())
    )
    if status == "suspended":
        return User.suspended_at.is_not(None)
    if status == "inactive":
        return and_(User.is_active.is_(False), User.suspended_at.is_(None))
    if status == "locked":
        return and_(User.is_active.is_(True), User.suspended_at.is_(None), locked_now)
    if status == "pending":
        return and_(
            User.is_active.is_(True), User.suspended_at.is_(None), not_locked_now, User.is_email_verified.is_(False)
        )
    if status == "active":
        return and_(
            User.is_active.is_(True), User.suspended_at.is_(None), not_locked_now, User.is_email_verified.is_(True)
        )
    raise ApiError.bad_request("Invalid status filter. Allowed: active, inactive, suspended, locked, pending")


def _build_user_filters(request: Request) -> list:
    """Shared by list and export so a CSV always honors exactly the filters
    the on-screen table applies."""
    params = request.query_params
    conditions: list = []

    if role := params.get("role"):
        try:
            conditions.append(User.role == UserRole(role))
        except ValueError:
            raise ApiError.bad_request("Invalid role filter") from None
    if is_active := params.get("is_active"):
        value = str(is_active).strip().lower()
        if value in ("true", "1", "yes", "on"):
            conditions.append(User.is_active.is_(True))
        elif value in ("false", "0", "no", "off"):
            conditions.append(User.is_active.is_(False))
        else:
            raise ApiError.bad_request("Invalid is_active filter")
    if status := params.get("status"):
        conditions.append(_status_condition(status))
    if department_id := params.get("department_id"):
        try:
            conditions.append(Employee.department_id == uuid.UUID(department_id))
        except ValueError:
            raise ApiError.bad_request("Invalid department_id filter") from None
    if designation := params.get("designation"):
        conditions.append(Employee.designation.ilike(f"%{designation}%"))
    if created_from := params.get("created_from"):
        try:
            start = date.fromisoformat(created_from)
        except ValueError:
            raise ApiError.bad_request("Invalid created_from date (expected YYYY-MM-DD)") from None
        conditions.append(User.created_at >= datetime.combine(start, time.min, tzinfo=UTC))
    if created_to := params.get("created_to"):
        try:
            end = date.fromisoformat(created_to)
        except ValueError:
            raise ApiError.bad_request("Invalid created_to date (expected YYYY-MM-DD)") from None
        conditions.append(User.created_at < datetime.combine(end, time.min, tzinfo=UTC) + timedelta(days=1))
    if search := params.get("search"):
        term = f"%{search}%"
        conditions.append(
            or_(
                User.name.ilike(term),
                User.email.ilike(term),
                User.phone.ilike(term),
                Employee.employee_code.ilike(term),
            )
        )
    return conditions


def _apply_user_sort(query, sort: str | None):
    applied = False
    if sort:
        for field in sort.split(","):
            field = field.strip()
            if not field:
                continue
            desc = field.startswith("-")
            column = _SORT_COLUMNS.get(field[1:] if desc else field)
            if column is None:
                continue
            query = query.order_by(column.desc().nullslast() if desc else column.asc().nullslast())
            applied = True
    if not applied:
        query = query.order_by(User.created_at.desc())
    return query


def _base_user_query():
    return (
        select(User)
        .outerjoin(Employee, Employee.user_id == User.id)
        .options(joinedload(User.employee_profile).joinedload(Employee.department))
    )


def _base_count_query():
    return select(func.count()).select_from(User).outerjoin(Employee, Employee.user_id == User.id)


def _list_row(user: User) -> UserListOut:
    row = UserListOut.model_validate(user)
    employee = user.employee_profile
    if employee is not None:
        row.employee_code = employee.employee_code
        row.designation = employee.designation
        if employee.department is not None:
            row.department_name = employee.department.name
    return row


def _employee_summary(employee: Employee | None) -> UserEmployeeSummary | None:
    if employee is None:
        return None
    return UserEmployeeSummary(
        employee_code=employee.employee_code,
        designation=employee.designation,
        date_of_joining=employee.date_of_joining,
        department_id=employee.department_id,
        department_name=employee.department.name if employee.department is not None else None,
    )


async def _issue_password_reset_link(db: AsyncSession, user: User) -> bool:
    """Invalidate outstanding reset tokens, issue a fresh single-use one and
    email the reset link. Returns whether the email was actually dispatched
    (False when Brevo isn't configured, e.g. local dev). The plaintext
    password itself is never set, returned, or logged anywhere."""
    await db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
        .values(used_at=datetime.now(UTC))
    )
    token = generate_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=datetime.now(UTC) + PASSWORD_RESET_TOKEN_TTL,
        )
    )
    await db.commit()
    reset_url = f"{settings.client_url.rstrip('/')}/reset-password?token={token}"
    try:
        await send_password_reset_email(user.name, user.email, reset_url)
    except Exception as exc:  # noqa: BLE001 — token issuance must not fail over email delivery
        logger.warning("Failed to send password-reset email to %s: %s", user.email, exc)
        return False
    return bool(settings.brevo_api_key)


# ---------------------------------------------------------------------------
# State-transition helpers (shared by PATCH endpoints, PUT is_active and bulk)
# ---------------------------------------------------------------------------


async def _apply_deactivate(db: AsyncSession, current_user: User, target: User, request: Request) -> User:
    _ensure_not_self(current_user, target, "deactivate")
    if not target.is_active and target.suspended_at is None:
        return target
    await _protect_last_super_admin(db, target, "deactivate")
    target.is_active = False
    target.suspended_at = None
    await db.commit()
    await revoke_all_sessions(db, target.id)
    await db.refresh(target)
    await _write_audit(request, current_user, "USER_DEACTIVATED", target.id)
    return target


async def _apply_activate(db: AsyncSession, current_user: User, target: User, request: Request) -> User:
    # Self-check first even for the idempotent path: "activate" clears
    # lockout state, which must not be self-serviceable via this endpoint.
    _ensure_not_self(current_user, target, "activate")
    if target.is_active and target.suspended_at is None and not is_account_locked(target):
        return target
    target.is_active = True
    target.suspended_at = None
    target.is_locked = False
    target.locked_until = None
    target.failed_login_attempts = 0
    await db.commit()
    await db.refresh(target)
    await _write_audit(request, current_user, "USER_ACTIVATED", target.id)
    return target


async def _apply_suspend(db: AsyncSession, current_user: User, target: User, request: Request) -> User:
    _ensure_not_self(current_user, target, "suspend")
    if target.suspended_at is not None:
        return target
    await _protect_last_super_admin(db, target, "suspend")
    target.suspended_at = datetime.now(UTC)
    target.is_active = False
    await db.commit()
    await revoke_all_sessions(db, target.id)
    await db.refresh(target)
    await _write_audit(request, current_user, "USER_SUSPENDED", target.id)
    return target


async def _apply_restore(db: AsyncSession, current_user: User, target: User, request: Request) -> User:
    _ensure_not_self(current_user, target, "restore")
    if target.suspended_at is None:
        raise ApiError.bad_request("This account is not suspended")
    target.suspended_at = None
    target.is_active = True
    await db.commit()
    await db.refresh(target)
    await _write_audit(request, current_user, "USER_RESTORED", target.id)
    return target


_BULK_APPLIERS = {
    "activate": _apply_activate,
    "deactivate": _apply_deactivate,
    "suspend": _apply_suspend,
    "restore": _apply_restore,
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("", response_model=dict)
async def list_users(request: Request, db: AsyncSession = Depends(get_db), page: PageParams = Depends(page_params)):
    """Server-paginated user list: search (name/email/phone/employee code),
    filters (role, status, is_active, department, designation, created
    range) and multi-key sort via `sort=name,-created_at`."""
    conditions = _build_user_filters(request)
    stmt = _apply_user_sort(_base_user_query().where(*conditions), page.sort)
    count_stmt = _base_count_query().where(*conditions)
    items, meta = await paginate_query(db, stmt, count_stmt, page)
    return success_response(data=[_list_row(u) for u in items], message="Users fetched", meta=meta)


@router.get("/export", response_model=None)
async def export_users(
    request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """CSV export of the *filtered* user list (same filter parser as the list
    endpoint, capped at _EXPORT_MAX_ROWS). Values starting with =,+,-,@ are
    prefixed with an apostrophe to neutralize spreadsheet formula injection."""
    conditions = _build_user_filters(request)
    stmt = _base_user_query().where(*conditions).order_by(User.created_at.desc()).limit(_EXPORT_MAX_ROWS)
    users = (await db.execute(stmt)).scalars().all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Name",
            "Email",
            "Phone",
            "Role",
            "Status",
            "Employee ID",
            "Department",
            "Designation",
            "Email Verified",
            "Last Login",
            "Created At",
        ]
    )
    for user in users:
        employee = user.employee_profile
        writer.writerow(
            [
                _csv_safe(user.name),
                _csv_safe(user.email),
                _csv_safe(user.phone),
                _csv_safe(_role_value(user.role)),
                _csv_safe(user.status),
                _csv_safe(employee.employee_code if employee else None),
                _csv_safe(employee.department.name if employee and employee.department else None),
                _csv_safe(employee.designation if employee else None),
                "yes" if user.is_email_verified else "no",
                user.last_login_at.isoformat() if user.last_login_at else "",
                user.created_at.isoformat() if user.created_at else "",
            ]
        )

    await _write_audit(
        request,
        current_user,
        "USER_EXPORTED",
        metadata={"count": len(users), "filters": dict(request.query_params.items())},
    )
    filename = f"vpd-users-{datetime.now(UTC).strftime('%Y%m%d-%H%M%S')}.csv"
    return Response(
        content=("\ufeff" + buffer.getvalue()).encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _csv_safe(value) -> str:
    text = "" if value is None else str(value)
    if text.startswith(("=", "+", "-", "@")):
        return "'" + text
    return text


@router.post("/bulk", response_model=dict)
async def bulk_user_action(
    payload: BulkUserActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Safe bulk state changes only (activate/deactivate/suspend/restore) —
    deliberately no bulk delete. Each user is processed independently with
    its own guards; per-user failures are reported instead of aborting the
    batch, and every successful transition writes its own audit event."""
    applier = _BULK_APPLIERS[payload.action]
    succeeded: list[str] = []
    failed: list[dict] = []
    for target_id in payload.user_ids:
        try:
            target = await _load_guarded_target(db, target_id, current_user)
            await applier(db, current_user, target, request)
            succeeded.append(str(target_id))
        except ApiError as exc:
            failed.append({"user_id": str(target_id), "reason": exc.message})
        except Exception:  # noqa: BLE001 — one bad row must not fail the batch
            logger.exception("Bulk %s failed for user %s", payload.action, target_id)
            failed.append({"user_id": str(target_id), "reason": "Unexpected error"})
    await _write_audit(
        request,
        current_user,
        "USERS_BULK_ACTION",
        metadata={"action": payload.action, "succeeded": len(succeeded), "failed": len(failed)},
    )
    return success_response(
        data={"action": payload.action, "total": len(payload.user_ids), "succeeded": succeeded, "failed": failed},
        message="Bulk action completed",
    )


@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(User)
        .options(joinedload(User.employee_profile).joinedload(Employee.department))
        .where(User.id == user_id)
    )
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None:
        raise ApiError.not_found("User not found")
    detail = UserDetailOut.model_validate(user)
    if user.employee_profile is not None:
        detail.employee_profile = _employee_summary(user.employee_profile)
    return success_response(data=detail, message="User fetched")


@router.post("", response_model=dict, status_code=201)
async def create_user(
    payload: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates the local account directly — VPD owns identity end to end.

    Two provisioning modes: an inline password (complexity-checked, hashed,
    never echoed back) or invite mode (password omitted) where the account
    gets an unusable random hash and the invitee receives a password-setup
    email link. Only a Super Admin may grant admin/super_admin.
    """
    role_value = _role_value(payload.role)
    if role_value in ("admin", "super_admin") and current_user.role != "super_admin":
        raise ApiError.forbidden("Only a Super Admin can create an Admin or Super Admin account")
    if role_value not in EMPLOYEE_ROLES and (payload.designation or payload.department_id):
        raise ApiError.bad_request("Designation and department can only be set on employee accounts")

    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing is not None:
        raise ApiError.conflict("An account with this email already exists")
    if payload.department_id is not None and await db.get(Department, payload.department_id) is None:
        raise ApiError.bad_request("Department not found")

    invite_mode = payload.password is None
    data = payload.model_dump(exclude={"password", "designation", "department_id"})
    data["id"] = uuid.uuid4()
    data["password_hash"] = hash_password(payload.password if payload.password else secrets.token_urlsafe(32))
    data["is_email_verified"] = not invite_mode
    if not invite_mode:
        data["email_verified_at"] = datetime.now(UTC)

    # Staged before crud.create so the employee row is flushed in the same
    # commit as the user row — a failure in either insert must not leave a
    # half-provisioned account behind.
    if role_value in EMPLOYEE_ROLES:
        short_id = str(data["id"]).replace("-", "")[:8].upper()
        db.add(
            Employee(
                user_id=data["id"],
                employee_code=f"EMP-{short_id}",
                designation=payload.designation,
                department_id=payload.department_id,
            )
        )

    user = await crud.create(db, data)

    invite_sent = await _issue_password_reset_link(db, user) if invite_mode else False
    await _write_audit(
        request,
        current_user,
        "USER_CREATED",
        user.id,
        {"role": role_value, "email": str(payload.email), "invite_mode": invite_mode, "invite_sent": invite_sent},
    )
    response_data = {**UserOut.model_validate(user).model_dump(mode="json"), "invite_sent": invite_sent}
    return success_response(data=response_data, message="User created successfully", status_code=201)


@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Partial update. Mirrors create/role-endpoint restrictions: only a
    Super Admin may grant admin/super_admin or modify an admin target, nobody
    may change their own role, and the last active Super Admin cannot be
    demoted. Changing the email resets verification (the new address is
    unproven until re-verified)."""
    target = await _load_guarded_target(db, user_id, current_user)
    data = payload.model_dump(exclude_unset=True)

    role_value = None
    if "role" in data:
        new_role_value = _role_value(data["role"])
        if new_role_value in ("admin", "super_admin") and current_user.role != "super_admin":
            raise ApiError.forbidden("Only a Super Admin can grant Admin or Super Admin roles")
        current_role_value = _role_value(target.role)
        if new_role_value == current_role_value:
            data.pop("role")
        else:
            _ensure_not_self(current_user, target, "change the role of")
            await _protect_last_super_admin(db, target, "change the role of")
            role_value = new_role_value

    if "email" in data:
        new_email = str(data["email"])
        data["email"] = new_email
        if new_email != target.email:
            duplicate = (
                await db.execute(select(User).where(User.email == new_email, User.id != user_id))
            ).scalar_one_or_none()
            if duplicate is not None:
                raise ApiError.conflict("An account with this email already exists")
            data["is_email_verified"] = False
            data["email_verified_at"] = None

    is_active_update = data.pop("is_active", None)
    previous_snapshot = {key: _jsonable(getattr(target, key, None)) for key in data}
    user = await crud.update(db, user_id, data) if data else target
    if is_active_update is not None:
        if is_active_update:
            user = await _apply_activate(db, current_user, user, request)
        else:
            user = await _apply_deactivate(db, current_user, user, request)

    if data:
        new_snapshot = {key: _jsonable(getattr(user, key, None)) for key in data}
        await _write_audit(
            request, current_user, "USER_UPDATED", user.id, {"previous": previous_snapshot, "new": new_snapshot}
        )
    if role_value is not None:
        await _write_audit(request, current_user, "ROLE_REMOVED", user.id, {"role": previous_snapshot.get("role")})
        await _write_audit(request, current_user, "ROLE_ASSIGNED", user.id, {"role": role_value})
    return success_response(data=UserOut.model_validate(user), message="User updated successfully")


@router.patch("/{user_id}/deactivate", response_model=dict)
async def deactivate_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivates the account and revokes every active session — `is_active`
    is checked on every authenticated request, so the user is locked out
    immediately, and a revoked session can't be renewed by the refresh flow."""
    target = await _load_guarded_target(db, user_id, current_user)
    user = await _apply_deactivate(db, current_user, target, request)
    return success_response(data=UserOut.model_validate(user), message="User deactivated")


@router.patch("/{user_id}/activate", response_model=dict)
async def activate_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-activates an inactive/suspended account and clears lockout state.
    Blocked on your own account — activates are the counter-move to
    deactivation, and self-service here would let a locked-out admin restore
    themselves."""
    target = await _load_guarded_target(db, user_id, current_user)
    user = await _apply_activate(db, current_user, target, request)
    return success_response(data=UserOut.model_validate(user), message="User activated")


@router.patch("/{user_id}/suspend", response_model=dict)
async def suspend_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Administrative suspension (distinct from deactivation and from the
    automatic brute-force lockout): sets `suspended_at`, forces is_active
    False and revokes sessions. Cleared via /restore or /activate."""
    target = await _load_guarded_target(db, user_id, current_user)
    user = await _apply_suspend(db, current_user, target, request)
    return success_response(data=UserOut.model_validate(user), message="User suspended")


@router.patch("/{user_id}/restore", response_model=dict)
async def restore_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lifts a suspension and re-activates the account. Errors if the account
    is not suspended (use /activate for plain deactivated accounts)."""
    target = await _load_guarded_target(db, user_id, current_user)
    user = await _apply_restore(db, current_user, target, request)
    return success_response(data=UserOut.model_validate(user), message="User restored")


@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete: the account is deactivated and all sessions revoked, but
    the row (and its audit history, sessions, login records) is preserved —
    this codebase never hard-deletes users. Blocked on your own account and
    on the last active Super Admin."""
    target = await _load_guarded_target(db, user_id, current_user)
    _ensure_not_self(current_user, target, "delete")
    await _protect_last_super_admin(db, target, "delete")
    target.is_active = False
    target.suspended_at = None
    await db.commit()
    await revoke_all_sessions(db, target.id)
    await db.refresh(target)
    await _write_audit(request, current_user, "USER_DELETED", target.id, {"mode": "soft"})
    return success_response(message="User deleted successfully (account deactivated; history preserved)")


@router.post("/{user_id}/lock", response_model=dict)
async def lock_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually locks the account indefinitely (locked_until=None) and revokes
    sessions. Counterpart to the automatic lockout — cleared by /unlock or
    /activate."""
    target = await _load_guarded_target(db, user_id, current_user)
    _ensure_not_self(current_user, target, "lock")
    await _protect_last_super_admin(db, target, "lock")
    target.is_locked = True
    target.locked_until = None
    await db.commit()
    await revoke_all_sessions(db, target.id)
    await db.refresh(target)
    await _write_audit(request, current_user, "USER_LOCKED", target.id, {"until": None})
    return success_response(data=UserOut.model_validate(target), message="User locked")


@router.post("/{user_id}/unlock", response_model=dict)
async def unlock_user(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await _load_guarded_target(db, user_id, current_user)
    _ensure_not_self(current_user, target, "unlock")
    if not target.is_locked and not target.failed_login_attempts:
        return success_response(data=UserOut.model_validate(target), message="User unlocked")
    target.is_locked = False
    target.locked_until = None
    target.failed_login_attempts = 0
    await db.commit()
    await db.refresh(target)
    await _write_audit(request, current_user, "USER_UNLOCKED", target.id)
    return success_response(data=UserOut.model_validate(target), message="User unlocked")


@router.post("/{user_id}/revoke-sessions", response_model=dict)
async def revoke_user_sessions(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Force-logout: revokes every active session. Allowed on your own
    account too (admin-initiated "log me out everywhere")."""
    target = await _load_guarded_target(db, user_id, current_user)
    await revoke_all_sessions(db, target.id)
    await _write_audit(request, current_user, "SESSIONS_REVOKED", target.id, {"scope": "all"})
    return success_response(message="Sessions revoked successfully")


@router.post("/{user_id}/force-password-reset", response_model=dict)
async def force_password_reset(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Issues a fresh single-use reset link by email and revokes every
    session. No plaintext password is ever generated, returned, or logged —
    this endpoint deliberately has nothing to leak."""
    target = await _load_guarded_target(db, user_id, current_user)
    _ensure_not_self(current_user, target, "force a password reset on")
    email_sent = await _issue_password_reset_link(db, target)
    await revoke_all_sessions(db, target.id)
    await _write_audit(
        request, current_user, "PASSWORD_RESET_REQUESTED", target.id, {"forced": True, "email_sent": email_sent}
    )
    message = (
        "Password reset email sent to the user"
        if email_sent
        else "Password reset link issued, but email delivery is not configured on this environment"
    )
    return success_response(data={"email_sent": email_sent}, message=message)


@router.get("/{user_id}/roles", response_model=dict)
async def get_user_roles(
    user_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Single-role architecture: `users.role` is the source of truth. `current`
    is that one role; `available` lists what the caller may assign (non-Super
    Admins never get admin/super_admin options — matches the PUT grant rule)."""
    target = await crud.get(db, user_id)
    current_value = _role_value(target.role)
    available = [role.value for role in UserRole]
    if current_user.role != "super_admin":
        available = [role for role in available if role not in ("admin", "super_admin")]
    return success_response(data={"current": current_value, "available": available}, message="Roles fetched")


@router.put("/{user_id}/roles", response_model=dict)
async def update_user_roles(
    user_id: uuid.UUID,
    payload: UserRoleAssignment,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await _load_guarded_target(db, user_id, current_user)
    new_role = payload.roles[0]
    new_value = _role_value(new_role)
    if new_value in ("admin", "super_admin") and current_user.role != "super_admin":
        raise ApiError.forbidden("Only a Super Admin can grant Admin or Super Admin roles")
    current_value = _role_value(target.role)
    if new_value == current_value:
        return success_response(data={"role": new_value}, message="Role unchanged")
    _ensure_not_self(current_user, target, "change the role of")
    await _protect_last_super_admin(db, target, "change the role of")
    target.role = new_role
    await db.commit()
    await db.refresh(target)
    await _write_audit(request, current_user, "ROLE_REMOVED", target.id, {"role": current_value})
    await _write_audit(request, current_user, "ROLE_ASSIGNED", target.id, {"role": new_value})
    return success_response(data={"role": new_value}, message="Role updated successfully")


@router.get("/{user_id}/permissions", response_model=dict)
async def get_user_permissions(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Permissions of the user's role (role → role_permissions → permissions).

    Honest architecture note: this codebase has no per-user permission
    grants (no user_permissions table) — authorization is role-based, so
    this is a read-only view of what the assigned role confers. A per-user
    assign/remove API is intentionally NOT faked here; it would require a
    schema change first.
    """
    target = await crud.get(db, user_id)
    role_value = _role_value(target.role)
    role = (
        (await db.execute(select(Role).where(Role.slug == role_value).options(selectinload(Role.permissions))))
        .scalars()
        .first()
    )
    permissions = sorted(role.permissions, key=lambda p: (p.module, p.action)) if role is not None else []
    return success_response(
        data={
            "role": role_value,
            "source": "role",
            "permissions": [PermissionOut.model_validate(p) for p in permissions],
        },
        message="Permissions fetched",
    )


@router.get("/{user_id}/sessions", response_model=dict)
async def list_user_sessions(
    user_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Active sessions only (not revoked, not expired). Token hashes are
    never serialized — `is_current` is computed by hashing the caller's own
    cookie and comparing hashes server-side."""
    await crud.get(db, user_id)
    now = datetime.now(UTC)
    stmt = (
        select(UserSession)
        .where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None), UserSession.expires_at > now)
        .order_by(UserSession.created_at.desc())
        .limit(200)
    )
    sessions = (await db.execute(stmt)).scalars().all()
    current_token = request.cookies.get(ACCESS_TOKEN_COOKIE)
    current_hash = hash_token(current_token) if isinstance(current_token, str) else None
    data = [
        UserSessionOut(
            id=session.id,
            created_at=session.created_at,
            last_used_at=session.last_used_at,
            expires_at=session.expires_at,
            revoked_at=session.revoked_at,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            is_current=bool(current_hash and user_id == current_user.id and session.session_token_hash == current_hash),
        )
        for session in sessions
    ]
    return success_response(data=data, message="Sessions fetched")


@router.delete("/{user_id}/sessions/{session_id}", response_model=dict)
async def revoke_user_session(
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revokes one session. Double-matched on (id, user_id) so a session id
    belonging to another user can't be revoked via this route (IDOR-safe),
    and idempotent — revoking an already-revoked session reports success."""
    await _load_guarded_target(db, user_id, current_user)
    session = (
        await db.execute(select(UserSession).where(UserSession.id == session_id, UserSession.user_id == user_id))
    ).scalar_one_or_none()
    if session is None:
        raise ApiError.not_found("Session not found")
    if session.revoked_at is None:
        session.revoked_at = datetime.now(UTC)
        await db.commit()
    await _write_audit(
        request, current_user, "SESSIONS_REVOKED", user_id, {"scope": "one", "session_id": str(session_id)}
    )
    return success_response(message="Session revoked successfully")


@router.get("/{user_id}/login-history", response_model=dict)
async def get_login_history(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """Merged login timeline: successful logins (UserSession rows) and failed
    attempts (LOGIN_FAILED audit rows), newest first."""
    await crud.get(db, user_id)
    now = datetime.now(UTC)
    sessions = (
        (
            await db.execute(
                select(UserSession)
                .where(UserSession.user_id == user_id)
                .order_by(UserSession.created_at.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    failures = (
        (
            await db.execute(
                select(AuditLog)
                .where(AuditLog.entity_type == "user", AuditLog.entity_id == user_id, AuditLog.action == "LOGIN_FAILED")
                .order_by(AuditLog.created_at.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )

    entries: list[LoginHistoryEntry] = []
    for session in sessions:
        if session.revoked_at is not None:
            status = "revoked"
        elif session.expires_at <= now:
            status = "expired"
        else:
            status = "active"
        entries.append(
            LoginHistoryEntry(
                id=session.id,
                event="login",
                timestamp=session.created_at,
                status=status,
                success=True,
                ip_address=session.ip_address,
                user_agent=session.user_agent,
            )
        )
    for failure in failures:
        entries.append(
            LoginHistoryEntry(
                id=failure.id,
                event="login_failed",
                timestamp=failure.created_at,
                status="failed",
                success=False,
                ip_address=failure.ip_address,
                user_agent=failure.user_agent,
            )
        )
    entries.sort(key=lambda entry: entry.timestamp, reverse=True)
    return success_response(data=entries[:limit], message="Login history fetched")


@router.get("/{user_id}/activity", response_model=dict)
async def get_user_activity(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    page: PageParams = Depends(page_params),
):
    """Per-user audit timeline: every audit row with entity_type="user" and
    entity_id=this user — i.e. actions performed ON this account (actor name
    resolved from the acting admin). Deliberately does not include the
    generic AuditMiddleware request log, which is not entity-scoped."""
    await crud.get(db, user_id)
    conditions = [AuditLog.entity_type == "user", AuditLog.entity_id == user_id]
    total = (await db.execute(select(func.count()).select_from(AuditLog).where(*conditions))).scalar_one()
    rows = (
        await db.execute(
            select(AuditLog, User.name)
            .outerjoin(User, AuditLog.user_id == User.id)
            .where(*conditions)
            .order_by(AuditLog.created_at.desc())
            .offset(page.offset)
            .limit(page.limit)
        )
    ).all()
    data = [
        UserActivityEntry(
            id=row[0].id,
            action=row[0].action,
            timestamp=row[0].created_at,
            actor_id=row[0].user_id,
            actor_name=row[1],
            ip_address=row[0].ip_address,
            metadata=row[0].log_metadata or {},
        )
        for row in rows
    ]
    return success_response(
        data=data, message="User activity fetched", meta=build_pagination_meta(total, page.page, page.limit)
    )
