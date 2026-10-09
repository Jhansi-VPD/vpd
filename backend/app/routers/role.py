"""Role & Permission Management — the authorization configuration surface
behind the Admin portal's /admin/roles-permissions module.

Design notes (consistent with routers/users.py):

- This router is gated EXCLUSIVELY by `require_permissions(...)` against the
  role→permission mapping in the database — not by `require_roles`. That is
  the module's whole point: authorization becomes DB-configurable instead of
  a hardcoded role list. "super_admin" still bypasses by design (see
  core/dependencies.py). Unauthenticated requests get 401 before any
  permission lookup happens.

- System roles (is_system=true — the 14 built-in slugs) cannot be deleted or
  deactivated; their permission set can only be edited by a Super Admin, and
  the super_admin role itself is implicitly all-permissions (409 on any
  attempt to edit its mapped set). The last active Super Admin can never be
  locked out: role deletion/deactivation requires zero assigned users, and
  users.py independently protects the last active super_admin account.

- Dual-write between role slugs and users: blocking (409) whenever a role
  still has users assigned prevents orphan rows and keeps every soft-deleted
  role's audit history unambiguous.

- Every mutation writes an audit row (entity_type="role"/"permission") and
  invalidates the require_permissions() cache so changes apply immediately
  on this worker (§50). Transactions: multi-step permission updates are one
  commit — all-or-nothing.
"""
import re
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy import delete, func, insert, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import log_audit
from app.core.database import get_db
from app.core.dependencies import get_client_ip, invalidate_permission_cache, require_permissions
from app.core.errors import ApiError
from app.core.logger import logger
from app.models.associations import role_permissions
from app.models.audit_log import AuditLog
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.schemas.role import (
    SLUG_PATTERN,
    VALID_PORTALS,
    ModuleSummary,
    PermissionCreate,
    PermissionDetailOut,
    PermissionListOut,
    PermissionOut,
    PermissionRoleEntry,
    PermissionStatusUpdate,
    PermissionUpdate,
    RoleActivityEntry,
    RoleCreate,
    RoleDetailOut,
    RoleListOut,
    RolePermissionAdd,
    RolePermissionSummary,
    RolePermissionsUpdate,
    RoleStatusUpdate,
    RoleUpdate,
    RoleUserEntry,
)
from app.utils.pagination import PageParams, page_params
from app.utils.responses import build_pagination_meta, success_response

router = APIRouter(prefix="/access-control", tags=["Access Control"])
role_router = APIRouter(prefix="/roles", tags=["Roles"])
permission_router = APIRouter(prefix="/permissions", tags=["Permissions"])

SUPER_ADMIN_SLUG = "super_admin"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _write_audit(
    request: Request,
    actor: User,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None = None,
    metadata: dict | None = None,
) -> None:
    """Best-effort audit write — same swallow-and-log pattern as users.py:
    an audit-store problem must never change the response the admin sees."""
    try:
        await log_audit(
            user_id=actor.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            log_metadata=metadata or {},
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Audit log failed: %s", exc)


async def _load_role(db: AsyncSession, role_id: uuid.UUID) -> Role:
    stmt = select(Role).where(Role.id == role_id, Role.deleted_at.is_(None))
    role = (await db.execute(stmt)).scalars().first()
    if role is None:
        raise ApiError.not_found("Role not found")
    return role


async def _load_permission(db: AsyncSession, permission_id: uuid.UUID) -> Permission:
    # Eager-load roles (excluding soft-deleted ones, matching every other
    # roles-for-permission query in this module): PermissionDetailOut reads
    # permission.roles, and a lazy load here would raise MissingGreenlet
    # inside pydantic's sync validation against a real async session.
    stmt = (
        select(Permission)
        .where(Permission.id == permission_id, Permission.deleted_at.is_(None))
        .options(selectinload(Permission.roles.and_(Role.deleted_at.is_(None))))
    )
    permission = (await db.execute(stmt)).scalars().first()
    if permission is None:
        raise ApiError.not_found("Permission not found")
    return permission


def _mapped_permissions_stmt(role_id: uuid.UUID):
    return (
        select(Permission)
        .join(role_permissions, role_permissions.c.permission_id == Permission.id)
        .where(role_permissions.c.role_id == role_id, Permission.deleted_at.is_(None))
        .order_by(Permission.module.asc(), Permission.action.asc())
    )


def _role_user_count_subquery():
    return (
        select(func.count())
        .select_from(User)
        .where(User.role == Role.slug)
        .correlate(Role)
        .scalar_subquery()
        .label("user_count")
    )


def _role_permission_count_subquery():
    return (
        select(func.count())
        .select_from(role_permissions)
        .where(role_permissions.c.role_id == Role.id)
        .correlate(Role)
        .scalar_subquery()
        .label("permission_count")
    )


def _permission_role_count_subquery():
    return (
        select(func.count())
        .select_from(role_permissions)
        .join(Role, Role.id == role_permissions.c.role_id)
        .where(role_permissions.c.permission_id == Permission.id, Role.deleted_at.is_(None))
        .correlate(Permission)
        .scalar_subquery()
        .label("role_count")
    )


async def _mapped_role_count(db: AsyncSession, permission_id: uuid.UUID) -> int:
    """How many live (non-deleted) roles currently map this permission —
    used to block deactivation/deletion while mappings exist."""
    stmt = (
        select(func.count())
        .select_from(role_permissions)
        .join(Role, Role.id == role_permissions.c.role_id)
        .where(role_permissions.c.permission_id == permission_id, Role.deleted_at.is_(None))
    )
    return (await db.execute(stmt)).scalar_one()


async def _assigned_user_count(db: AsyncSession, slug: str) -> int:
    stmt = select(func.count()).select_from(User).where(User.role == slug)
    return (await db.execute(stmt)).scalar_one()


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")[:64]


def _build_role_filters(request: Request, page: PageParams) -> list:
    params = request.query_params
    conditions: list = [Role.deleted_at.is_(None)]
    if search := page.search:
        term = f"%{search}%"
        conditions.append(or_(Role.name.ilike(term), Role.slug.ilike(term), Role.description.ilike(term)))
    if portal := params.get("portal"):
        if portal not in VALID_PORTALS:
            raise ApiError.bad_request(f"Invalid portal filter. Allowed: {', '.join(VALID_PORTALS)}")
        conditions.append(Role.portal == portal)
    if status := params.get("status"):
        value = status.strip().lower()
        if value == "active":
            conditions.append(Role.is_active.is_(True))
        elif value == "inactive":
            conditions.append(Role.is_active.is_(False))
        else:
            raise ApiError.bad_request("Invalid status filter. Allowed: active, inactive")
    if role_type := params.get("type"):
        value = role_type.strip().lower()
        if value == "system":
            conditions.append(Role.is_system.is_(True))
        elif value == "custom":
            conditions.append(Role.is_system.is_(False))
        else:
            raise ApiError.bad_request("Invalid type filter. Allowed: system, custom")
    return conditions


def _build_permission_filters(request: Request, page: PageParams) -> list:
    params = request.query_params
    conditions: list = [Permission.deleted_at.is_(None)]
    if search := page.search:
        term = f"%{search}%"
        conditions.append(or_(Permission.name.ilike(term), Permission.description.ilike(term)))
    if module := params.get("module"):
        conditions.append(Permission.module == module)
    if action := params.get("action"):
        conditions.append(Permission.action == action)
    if status := params.get("status"):
        value = status.strip().lower()
        if value == "active":
            conditions.append(Permission.is_active.is_(True))
        elif value == "inactive":
            conditions.append(Permission.is_active.is_(False))
        else:
            raise ApiError.bad_request("Invalid status filter. Allowed: active, inactive")
    if perm_type := params.get("type"):
        value = perm_type.strip().lower()
        if value == "system":
            conditions.append(Permission.is_system.is_(True))
        elif value == "custom":
            conditions.append(Permission.is_system.is_(False))
        else:
            raise ApiError.bad_request("Invalid type filter. Allowed: system, custom")
    return conditions


_ROLE_SORT_COLUMNS = {"name": Role.name, "created_at": Role.created_at, "updated_at": Role.updated_at}


def _apply_role_sort(stmt, sort: str | None, user_count_col, permission_count_col):
    applied = False
    if sort:
        for field in sort.split(","):
            field = field.strip()
            if not field:
                continue
            desc = field.startswith("-")
            key = field[1:] if desc else field
            if key == "user_count":
                column = user_count_col
            elif key == "permission_count":
                column = permission_count_col
            else:
                column = _ROLE_SORT_COLUMNS.get(key)
            if column is None:
                continue
            stmt = stmt.order_by(column.desc() if desc else column.asc())
            applied = True
    if not applied:
        stmt = stmt.order_by(Role.name.asc())
    return stmt


_PERMISSION_SORT_COLUMNS = {
    "name": Permission.name,
    "module": Permission.module,
    "action": Permission.action,
    "created_at": Permission.created_at,
    "updated_at": Permission.updated_at,
}


def _apply_permission_sort(stmt, sort: str | None, role_count_col):
    applied = False
    if sort:
        for field in sort.split(","):
            field = field.strip()
            if not field:
                continue
            desc = field.startswith("-")
            key = field[1:] if desc else field
            if key == "role_count":
                column = role_count_col
            else:
                column = _PERMISSION_SORT_COLUMNS.get(key)
            if column is None:
                continue
            stmt = stmt.order_by(column.desc() if desc else column.asc())
            applied = True
    if not applied:
        stmt = stmt.order_by(Permission.name.asc())
    return stmt


def _ensure_editable_permissions(role: Role, current_user: User) -> None:
    """System roles' permission sets are foundational — only a Super Admin
    may edit them; the super_admin role itself is implicitly all-permissions
    and has no editable mapped set at all."""
    if role.slug == SUPER_ADMIN_SLUG:
        raise ApiError.conflict("The Super Admin role implicitly has all permissions and cannot be edited")
    if role.is_system and current_user.role != SUPER_ADMIN_SLUG:
        raise ApiError.forbidden("Only a Super Admin can modify a system role's permissions")


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------


@role_router.get("", response_model=dict)
async def list_roles(
    request: Request,
    db: AsyncSession = Depends(get_db),
    page: PageParams = Depends(page_params),
    _: User = Depends(require_permissions("roles:read")),
):
    """Server-paginated role list with live user/permission counts computed
    as scalar subqueries (one SQL statement — no N+1). Filters: search
    (name/slug/description), portal, status, type. Sort keys: name,
    created_at, updated_at, user_count, permission_count."""
    conditions = _build_role_filters(request, page)
    user_count_sq = _role_user_count_subquery()
    permission_count_sq = _role_permission_count_subquery()
    stmt = _apply_role_sort(select(Role, user_count_sq, permission_count_sq).where(*conditions), page.sort, user_count_sq, permission_count_sq)
    stmt = stmt.offset(page.offset).limit(page.limit)
    count_stmt = select(func.count()).select_from(Role).where(*conditions)

    rows = (await db.execute(stmt)).all()
    total = (await db.execute(count_stmt)).scalar_one()
    data = []
    for role, user_count, permission_count in rows:
        entry = RoleListOut.model_validate(role)
        entry.user_count = user_count
        entry.permission_count = permission_count
        data.append(entry)
    return success_response(
        data=data, message="Roles fetched", meta=build_pagination_meta(total, page.page, page.limit)
    )


@role_router.post("", response_model=dict, status_code=201)
async def create_role(
    payload: RoleCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:create")),
):
    """Create a custom role (is_system is always forced False — system roles
    are the built-in slugs and cannot be created via API). The slug is
    derived from the name when omitted; a collision with ANY role row —
    including soft-deleted ones, since the DB unique constraint is global —
    returns 409."""
    slug = payload.slug or _slugify(payload.name)
    if not re.fullmatch(SLUG_PATTERN, slug):
        raise ApiError.bad_request(
            "Could not derive a valid slug from this name — provide an explicit slug "
            "(lowercase letters, digits, underscores; must start with a letter)"
        )
    conflict = (
        await db.execute(select(Role.name, Role.slug).where(or_(Role.name == payload.name, Role.slug == slug)))
    ).first()
    if conflict is not None:
        field = "name" if conflict[0] == payload.name else "slug"
        raise ApiError.conflict(f"A role with this {field} already exists")

    role = Role(
        name=payload.name,
        slug=slug,
        description=payload.description or None,
        is_system=False,
        is_active=True,
        portal=payload.portal,
    )
    db.add(role)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ApiError.conflict("A role with this name or slug already exists") from None
    await db.refresh(role)
    await _write_audit(
        request, current_user, "ROLE_CREATED", "role", role.id, {"name": role.name, "slug": role.slug, "portal": role.portal}
    )
    detail = RoleDetailOut.model_validate(role)
    detail.user_count = 0
    detail.permission_count = 0
    return success_response(data=detail, message="Role created successfully", status_code=201)


@role_router.get("/{role_id}", response_model=dict)
async def get_role(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("roles:read")),
):
    role = await _load_role(db, role_id)
    counts_stmt = select(
        select(func.count()).select_from(User).where(User.role == role.slug).scalar_subquery(),
        select(func.count())
        .select_from(role_permissions)
        .where(role_permissions.c.role_id == role.id)
        .scalar_subquery(),
    )
    user_count, permission_count = (await db.execute(counts_stmt)).one()
    detail = RoleDetailOut.model_validate(role)
    detail.user_count = user_count
    detail.permission_count = permission_count
    detail.implicit_all_permissions = role.slug == SUPER_ADMIN_SLUG
    return success_response(data=detail, message="Role fetched")


@role_router.put("/{role_id}", response_model=dict)
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:update")),
):
    """Edit name/description/portal. The slug is immutable (it is the
    authorization identity referenced by users.role and audit history), and
    a system role's portal mapping is fixed to match the frontend's
    compile-time guards."""
    role = await _load_role(db, role_id)
    changes: dict = {}

    if payload.name is not None and payload.name != role.name:
        duplicate = (
            await db.execute(select(Role.id).where(Role.name == payload.name, Role.id != role.id))
        ).first()
        if duplicate is not None:
            raise ApiError.conflict("A role with this name already exists")
        changes["name"] = {"old": role.name, "new": payload.name}
        role.name = payload.name

    new_description = payload.description or None
    if payload.description is not None and new_description != role.description:
        changes["description"] = {"old": role.description, "new": new_description}
        role.description = new_description

    if payload.portal is not None and payload.portal != role.portal:
        if role.is_system:
            raise ApiError.bad_request("Portal mapping for system roles cannot be changed")
        changes["portal"] = {"old": role.portal, "new": payload.portal}
        role.portal = payload.portal

    if not changes:
        return success_response(data=RoleDetailOut.model_validate(role), message="Role unchanged")

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ApiError.conflict("A role with this name already exists") from None
    await db.refresh(role)
    await _write_audit(request, current_user, "ROLE_UPDATED", "role", role.id, {"role": role.slug, "changes": changes})
    return success_response(data=RoleDetailOut.model_validate(role), message="Role updated successfully")


@role_router.patch("/{role_id}/status", response_model=dict)
async def set_role_status(
    role_id: uuid.UUID,
    payload: RoleStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:update")),
):
    """Activate/deactivate a custom role. System roles are permanently
    active; a role with users still assigned cannot be deactivated (reassign
    them first) so a deactivation can never silently strip access from a
    live account list."""
    role = await _load_role(db, role_id)
    if payload.is_active == role.is_active:
        return success_response(data=RoleDetailOut.model_validate(role), message="Role status unchanged")

    if not payload.is_active:
        if role.is_system:
            raise ApiError.conflict("System roles cannot be deactivated")
        assigned = await _assigned_user_count(db, role.slug)
        if assigned:
            raise ApiError.conflict(
                f"Cannot deactivate this role: {assigned} user(s) still have it assigned. Reassign them first."
            )

    role.is_active = payload.is_active
    await db.commit()
    await db.refresh(role)
    await _write_audit(
        request,
        current_user,
        "ROLE_ACTIVATED" if payload.is_active else "ROLE_DEACTIVATED",
        "role",
        role.id,
        {"role": role.slug},
    )
    invalidate_permission_cache(role.slug)
    return success_response(
        data=RoleDetailOut.model_validate(role),
        message="Role activated" if payload.is_active else "Role deactivated",
    )


@role_router.delete("/{role_id}", response_model=dict)
async def delete_role(
    role_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:delete")),
):
    """Soft delete (= deleted_at; history preserved). System roles are never
    deletable and a role with users assigned is blocked with the count so
    nobody can strand a live account on a deleted role."""
    role = await _load_role(db, role_id)
    if role.is_system:
        raise ApiError.conflict("System roles cannot be deleted")
    assigned = await _assigned_user_count(db, role.slug)
    if assigned:
        raise ApiError.conflict(
            f"Cannot delete this role: {assigned} user(s) still have it assigned. Reassign them first."
        )
    role.deleted_at = datetime.now(UTC)
    await db.commit()
    await _write_audit(request, current_user, "ROLE_DELETED", "role", role.id, {"role": role.slug, "name": role.name})
    invalidate_permission_cache(role.slug)
    return success_response(message="Role deleted successfully")


@role_router.get("/{role_id}/permissions", response_model=dict)
async def get_role_permissions(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("roles:read")),
):
    """The role's mapped permissions. For the super_admin role this returns
    every active permission with implicit_all_permissions=true — its access
    comes from the code-level bypass, and showing an empty mapped set would
    misrepresent reality."""
    role = await _load_role(db, role_id)
    if role.slug == SUPER_ADMIN_SLUG:
        stmt = (
            select(Permission)
            .where(Permission.deleted_at.is_(None), Permission.is_active.is_(True))
            .order_by(Permission.module.asc(), Permission.action.asc())
        )
        permissions = (await db.execute(stmt)).scalars().all()
        return success_response(
            data=RolePermissionSummary(
                role_id=role.id,
                role_slug=role.slug,
                implicit_all_permissions=True,
                permissions=[PermissionOut.model_validate(p) for p in permissions],
            ),
            message="Role permissions fetched",
        )
    permissions = (await db.execute(_mapped_permissions_stmt(role.id))).scalars().all()
    return success_response(
        data=RolePermissionSummary(
            role_id=role.id,
            role_slug=role.slug,
            implicit_all_permissions=False,
            permissions=[PermissionOut.model_validate(p) for p in permissions],
        ),
        message="Role permissions fetched",
    )


@role_router.put("/{role_id}/permissions", response_model=dict)
async def set_role_permissions(
    role_id: uuid.UUID,
    payload: RolePermissionsUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:manage_permissions")),
):
    """Transactional full replacement of the role's permission set — every
    id is validated (exists, not deleted, active) BEFORE any write, the diff
    (add/remove) is applied in one commit, and a failure rolls back with no
    partial update. This is also the module's bulk assign/remove operation:
    one call can add and remove many permissions atomically."""
    role = await _load_role(db, role_id)
    _ensure_editable_permissions(role, current_user)

    requested = set(payload.permission_ids)
    names: dict[uuid.UUID, str] = {}
    if requested:
        found = (
            await db.execute(
                select(Permission.id, Permission.name).where(
                    Permission.id.in_(requested),
                    Permission.deleted_at.is_(None),
                    Permission.is_active.is_(True),
                )
            )
        ).all()
        names = {row[0]: row[1] for row in found}
        unknown = requested - set(names)
        if unknown:
            raise ApiError.bad_request(
                f"Unknown, inactive, or deleted permission ids: {', '.join(sorted(str(i) for i in unknown))}"
            )

    current_ids = set(
        (await db.execute(select(role_permissions.c.permission_id).where(role_permissions.c.role_id == role.id)))
        .scalars()
        .all()
    )
    to_add = requested - current_ids
    to_remove = current_ids - requested

    if to_add or to_remove:
        removed_names: list[str] = []
        if to_remove:
            removed_rows = (
                await db.execute(select(Permission.id, Permission.name).where(Permission.id.in_(to_remove)))
            ).all()
            removed_names = [row[1] for row in removed_rows]
        try:
            if to_remove:
                await db.execute(
                    delete(role_permissions).where(
                        role_permissions.c.role_id == role.id,
                        role_permissions.c.permission_id.in_(to_remove),
                    )
                )
            if to_add:
                await db.execute(
                    insert(role_permissions).values(
                        [{"role_id": role.id, "permission_id": pid} for pid in to_add]
                    )
                )
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise ApiError.conflict("The role's permissions were modified concurrently — retry") from None

        for pid in sorted(to_add, key=lambda i: names[i]):
            await _write_audit(
                request,
                current_user,
                "ROLE_PERMISSION_ASSIGNED",
                "role",
                role.id,
                {"role": role.slug, "permission": names[pid]},
            )
        for name in sorted(removed_names):
            await _write_audit(
                request,
                current_user,
                "ROLE_PERMISSION_REMOVED",
                "role",
                role.id,
                {"role": role.slug, "permission": name},
            )
        invalidate_permission_cache(role.slug)

    permissions = (await db.execute(_mapped_permissions_stmt(role.id))).scalars().all()
    return success_response(
        data=RolePermissionSummary(
            role_id=role.id,
            role_slug=role.slug,
            implicit_all_permissions=False,
            permissions=[PermissionOut.model_validate(p) for p in permissions],
        ),
        message=f"Role permissions updated (added {len(to_add)}, removed {len(to_remove)})",
    )


@role_router.post("/{role_id}/permissions", response_model=dict, status_code=201)
async def add_role_permission(
    role_id: uuid.UUID,
    payload: RolePermissionAdd,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:manage_permissions")),
):
    role = await _load_role(db, role_id)
    _ensure_editable_permissions(role, current_user)

    permission = (
        await db.execute(
            select(Permission).where(Permission.id == payload.permission_id, Permission.deleted_at.is_(None))
        )
    ).scalars().first()
    if permission is None:
        raise ApiError.not_found("Permission not found")
    if not permission.is_active:
        raise ApiError.bad_request("Cannot assign an inactive permission")

    already = (
        await db.execute(
            select(role_permissions.c.permission_id).where(
                role_permissions.c.role_id == role.id,
                role_permissions.c.permission_id == permission.id,
            )
        )
    ).first()
    if already is not None:
        raise ApiError.conflict("This permission is already assigned to the role")

    try:
        await db.execute(insert(role_permissions).values([{"role_id": role.id, "permission_id": permission.id}]))
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ApiError.conflict("This permission is already assigned to the role") from None
    await _write_audit(
        request,
        current_user,
        "ROLE_PERMISSION_ASSIGNED",
        "role",
        role.id,
        {"role": role.slug, "permission": permission.name},
    )
    invalidate_permission_cache(role.slug)
    return success_response(data=PermissionOut.model_validate(permission), message="Permission assigned", status_code=201)


@role_router.delete("/{role_id}/permissions/{permission_id}", response_model=dict)
async def remove_role_permission(
    role_id: uuid.UUID,
    permission_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:manage_permissions")),
):
    role = await _load_role(db, role_id)
    _ensure_editable_permissions(role, current_user)

    permission = (await db.execute(select(Permission).where(Permission.id == permission_id))).scalars().first()
    mapped = (
        await db.execute(
            select(role_permissions.c.permission_id).where(
                role_permissions.c.role_id == role.id,
                role_permissions.c.permission_id == permission_id,
            )
        )
    ).first()
    if permission is None or mapped is None:
        raise ApiError.not_found("This permission is not assigned to the role")

    await db.execute(
        delete(role_permissions).where(
            role_permissions.c.role_id == role.id, role_permissions.c.permission_id == permission_id
        )
    )
    await db.commit()
    await _write_audit(
        request,
        current_user,
        "ROLE_PERMISSION_REMOVED",
        "role",
        role.id,
        {"role": role.slug, "permission": permission.name},
    )
    invalidate_permission_cache(role.slug)
    return success_response(message="Permission removed")


@role_router.get("/{role_id}/users", response_model=dict)
async def list_role_users(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    page: PageParams = Depends(page_params),
    _: User = Depends(require_permissions("roles:read")),
):
    """Users currently holding this role (users.role == slug), paginated."""
    role = await _load_role(db, role_id)
    conditions = [User.role == role.slug]
    if search := page.search:
        term = f"%{search}%"
        conditions.append(or_(User.name.ilike(term), User.email.ilike(term)))
    stmt = (
        select(User)
        .where(*conditions)
        .order_by(User.name.asc())
        .offset(page.offset)
        .limit(page.limit)
    )
    count_stmt = select(func.count()).select_from(User).where(*conditions)
    users = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(count_stmt)).scalar_one()
    return success_response(
        data=[RoleUserEntry.model_validate(u) for u in users],
        message="Role users fetched",
        meta=build_pagination_meta(total, page.page, page.limit),
    )


@role_router.get("/{role_id}/activity", response_model=dict)
async def get_role_activity(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    page: PageParams = Depends(page_params),
    _: User = Depends(require_permissions("roles:read")),
):
    """Audit trail for this role (entity_type='role', entity_id=role_id),
    newest first, with the actor's name resolved in the same query."""
    role = await _load_role(db, role_id)
    conditions = [AuditLog.entity_type == "role", AuditLog.entity_id == role.id]
    stmt = (
        select(AuditLog, User.name)
        .outerjoin(User, User.id == AuditLog.user_id)
        .where(*conditions)
        .order_by(AuditLog.created_at.desc())
        .offset(page.offset)
        .limit(page.limit)
    )
    count_stmt = select(func.count()).select_from(AuditLog).where(*conditions)
    rows = (await db.execute(stmt)).all()
    total = (await db.execute(count_stmt)).scalar_one()
    entries = [
        RoleActivityEntry(
            id=entry.id,
            action=entry.action,
            timestamp=entry.created_at,
            actor_id=entry.user_id,
            actor_name=actor_name,
            ip_address=entry.ip_address,
            metadata=entry.log_metadata or {},
        )
        for entry, actor_name in rows
    ]
    return success_response(
        data=entries, message="Role activity fetched", meta=build_pagination_meta(total, page.page, page.limit)
    )


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------


@permission_router.get("", response_model=dict)
async def list_permissions(
    request: Request,
    db: AsyncSession = Depends(get_db),
    page: PageParams = Depends(page_params),
    _: User = Depends(require_permissions("permissions:read")),
):
    """Server-paginated permission list with a live role_count per row
    (scalar subquery — no N+1). Filters: search (name/description), module,
    action, status, type. Sort keys: name, module, action, created_at,
    updated_at, role_count."""
    conditions = _build_permission_filters(request, page)
    role_count_sq = _permission_role_count_subquery()
    stmt = _apply_permission_sort(
        select(Permission, role_count_sq).where(*conditions), page.sort, role_count_sq
    )
    stmt = stmt.offset(page.offset).limit(page.limit)
    count_stmt = select(func.count()).select_from(Permission).where(*conditions)

    rows = (await db.execute(stmt)).all()
    total = (await db.execute(count_stmt)).scalar_one()
    data = []
    for permission, role_count in rows:
        entry = PermissionListOut.model_validate(permission)
        entry.role_count = role_count
        data.append(entry)
    return success_response(
        data=data, message="Permissions fetched", meta=build_pagination_meta(total, page.page, page.limit)
    )


@permission_router.get("/modules", response_model=dict)
async def list_permission_modules(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("permissions:read")),
):
    """Distinct modules with permission counts — powers the group-by-module
    view of the permission matrix. Declared before /{permission_id} so
    'modules' is not parsed as a UUID path param."""
    stmt = (
        select(Permission.module, func.count())
        .where(Permission.deleted_at.is_(None))
        .group_by(Permission.module)
        .order_by(Permission.module.asc())
    )
    rows = (await db.execute(stmt)).all()
    return success_response(
        data=[ModuleSummary(module=module, permission_count=count) for module, count in rows],
        message="Modules fetched",
    )


@permission_router.post("", response_model=dict, status_code=201)
async def create_permission(
    payload: PermissionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("permissions:create")),
):
    """Create a custom permission. `name` is derived as module:action (the
    existing colon convention) — accepting a separate name would allow the
    three fields to disagree. is_system is always False."""
    name = f"{payload.module}:{payload.action}"
    duplicate = (await db.execute(select(Permission.id).where(Permission.name == name))).first()
    if duplicate is not None:
        raise ApiError.conflict("A permission with this name already exists")

    permission = Permission(
        name=name,
        module=payload.module,
        action=payload.action,
        description=payload.description or None,
        is_system=False,
        is_active=True,
    )
    db.add(permission)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ApiError.conflict("A permission with this name already exists") from None
    # Load the (empty) roles collection so PermissionDetailOut's validation
    # below never triggers an async lazy load from sync pydantic code.
    await db.refresh(permission, attribute_names=["roles"])
    await _write_audit(
        request,
        current_user,
        "PERMISSION_CREATED",
        "permission",
        permission.id,
        {"name": permission.name, "module": permission.module, "action": permission.action},
    )
    detail = PermissionDetailOut.model_validate(permission)
    detail.roles = []
    return success_response(data=detail, message="Permission created successfully", status_code=201)


@permission_router.get("/{permission_id}", response_model=dict)
async def get_permission(
    permission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("permissions:read")),
):
    permission = await _load_permission(db, permission_id)
    roles = (
        await db.execute(
            select(Role)
            .join(role_permissions, role_permissions.c.role_id == Role.id)
            .where(role_permissions.c.permission_id == permission.id, Role.deleted_at.is_(None))
            .order_by(Role.name.asc())
        )
    ).scalars().all()
    detail = PermissionDetailOut.model_validate(permission)
    detail.roles = [PermissionRoleEntry.model_validate(r) for r in roles]
    return success_response(data=detail, message="Permission fetched")


@permission_router.put("/{permission_id}", response_model=dict)
async def update_permission(
    permission_id: uuid.UUID,
    payload: PermissionUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("permissions:update")),
):
    """Only the description is editable — name/module/action are referenced
    literally by require_permissions(...) call sites in code, so changing
    them would silently drop enforcement."""
    permission = await _load_permission(db, permission_id)
    new_description = payload.description or None
    if payload.description is None or new_description == permission.description:
        return success_response(data=PermissionDetailOut.model_validate(permission), message="Permission unchanged")
    old_description = permission.description
    permission.description = new_description
    await db.commit()
    await db.refresh(permission)
    await _write_audit(
        request,
        current_user,
        "PERMISSION_UPDATED",
        "permission",
        permission.id,
        {"name": permission.name, "changes": {"description": {"old": old_description, "new": new_description}}},
    )
    return success_response(data=PermissionDetailOut.model_validate(permission), message="Permission updated successfully")


@permission_router.patch("/{permission_id}/status", response_model=dict)
async def set_permission_status(
    permission_id: uuid.UUID,
    payload: PermissionStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("permissions:update")),
):
    """Activate/deactivate a custom permission. System permissions are
    permanently active; a permission still mapped to any live role cannot be
    deactivated (it would silently strip access from that role's users)."""
    permission = await _load_permission(db, permission_id)
    if payload.is_active == permission.is_active:
        return success_response(data=PermissionDetailOut.model_validate(permission), message="Permission status unchanged")

    if not payload.is_active:
        if permission.is_system:
            raise ApiError.conflict("System permissions cannot be deactivated")
        mapped = await _mapped_role_count(db, permission.id)
        if mapped:
            raise ApiError.conflict(
                f"Cannot deactivate this permission: it is still assigned to {mapped} role(s). Remove it from them first."
            )

    permission.is_active = payload.is_active
    await db.commit()
    await db.refresh(permission)
    await _write_audit(
        request,
        current_user,
        "PERMISSION_ACTIVATED" if payload.is_active else "PERMISSION_DEACTIVATED",
        "permission",
        permission.id,
        {"name": permission.name},
    )
    # A permission change can affect any role holding it — drop the whole cache.
    invalidate_permission_cache()
    return success_response(
        data=PermissionDetailOut.model_validate(permission),
        message="Permission activated" if payload.is_active else "Permission deactivated",
    )


@permission_router.delete("/{permission_id}", response_model=dict)
async def delete_permission(
    permission_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions("permissions:delete")),
):
    """Soft delete. System permissions are never deletable and a permission
    still mapped to any live role is blocked with the count."""
    permission = await _load_permission(db, permission_id)
    if permission.is_system:
        raise ApiError.conflict("System permissions cannot be deleted")
    mapped = await _mapped_role_count(db, permission.id)
    if mapped:
        raise ApiError.conflict(
            f"Cannot delete this permission: it is still assigned to {mapped} role(s). Remove it from them first."
        )
    permission.deleted_at = datetime.now(UTC)
    await db.commit()
    await _write_audit(
        request, current_user, "PERMISSION_DELETED", "permission", permission.id, {"name": permission.name}
    )
    invalidate_permission_cache()
    return success_response(message="Permission deleted successfully")


@permission_router.get("/{permission_id}/roles", response_model=dict)
async def list_permission_roles(
    permission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permissions("permissions:read")),
):
    """Live roles currently mapped to this permission."""
    permission = await _load_permission(db, permission_id)
    roles = (
        await db.execute(
            select(Role)
            .join(role_permissions, role_permissions.c.role_id == Role.id)
            .where(role_permissions.c.permission_id == permission.id, Role.deleted_at.is_(None))
            .order_by(Role.name.asc())
        )
    ).scalars().all()
    return success_response(
        data=[PermissionRoleEntry.model_validate(r) for r in roles], message="Permission roles fetched"
    )


router.include_router(role_router)
router.include_router(permission_router)
