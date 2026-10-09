"""Schemas for the Role & Permission Management module
(/access-control/*).

Permission names follow the existing `module:action` colon convention
(e.g. "roles:read") — the same one the baseline seeds use — because
`require_permissions(...)` call sites in code reference names literally
and renaming the convention would silently break every existing mapping.
"""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase, TimestampedRead

SLUG_PATTERN = r"^[a-z][a-z0-9_]{1,63}$"

# Portals that exist as real frontend routes today (see
# frontend/src/auth/role-route.tsx ROLE_HOME + docs/portal-map.md).
# "partner" is a documented portal that is not routed yet — the frontend
# falls back to /employee for it — it is kept assignable so the partner
# role row stays consistent. Guest has no portal (NULL).
VALID_PORTALS = ("admin", "sales", "hr", "delivery", "employee", "client", "partner")

PortalValue = Literal["admin", "sales", "hr", "delivery", "employee", "client", "partner"]


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------


class RoleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    # Optional — derived from `name` server-side when omitted, then
    # validated against SLUG_PATTERN.
    slug: str | None = Field(default=None, min_length=2, max_length=64, pattern=SLUG_PATTERN)
    description: str | None = Field(default=None, max_length=2000)
    portal: PortalValue


class RoleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    portal: PortalValue | None = None


class RoleStatusUpdate(BaseModel):
    is_active: bool


class RolePermissionsUpdate(BaseModel):
    """Full replacement of a role's permission set (the transactional bulk
    assign/remove operation — single commit, all-or-nothing)."""

    permission_ids: list[uuid.UUID] = Field(default_factory=list, max_length=500)


class RolePermissionAdd(BaseModel):
    permission_id: uuid.UUID


class RoleOut(TimestampedRead):
    name: str
    slug: str
    description: str | None = None
    is_system: bool
    is_active: bool
    portal: str | None = None


class RoleListOut(RoleOut):
    user_count: int = 0
    permission_count: int = 0


class RoleDetailOut(RoleListOut):
    # super_admin implicitly holds every permission (code-level bypass in
    # require_roles/require_permissions) — surfaced so the UI shows the
    # truth instead of an empty mapped set.
    implicit_all_permissions: bool = False


class RoleUserEntry(ORMBase):
    id: uuid.UUID
    name: str
    email: str
    is_active: bool
    status: str


class RoleActivityEntry(BaseModel):
    id: uuid.UUID
    action: str
    timestamp: datetime
    actor_id: uuid.UUID | None = None
    actor_name: str | None = None
    ip_address: str | None = None
    metadata: dict = {}


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------


class PermissionCreate(BaseModel):
    """`name` is derived server-side as f"{module}:{action}" — accepting it
    separately would allow name/module/action to disagree."""

    module: str = Field(min_length=2, max_length=100, pattern=r"^[a-z][a-z0-9_]{1,49}$")
    action: str = Field(min_length=2, max_length=50, pattern=r"^[a-z][a-z0-9_]{1,49}$")
    description: str | None = Field(default=None, max_length=255)


class PermissionUpdate(BaseModel):
    """Only the description is editable — name/module/action are referenced
    literally by require_permissions(...) call sites in code."""

    description: str | None = Field(default=None, max_length=255)


class PermissionStatusUpdate(BaseModel):
    is_active: bool


class PermissionOut(TimestampedRead):
    name: str
    module: str
    action: str
    description: str | None = None
    is_system: bool
    is_active: bool


class PermissionListOut(PermissionOut):
    role_count: int = 0


class PermissionRoleEntry(ORMBase):
    id: uuid.UUID
    name: str
    slug: str
    is_system: bool


class PermissionDetailOut(PermissionOut):
    roles: list[PermissionRoleEntry] = []


class ModuleSummary(BaseModel):
    module: str
    permission_count: int


class RolePermissionSummary(BaseModel):
    """Shape returned by GET/PUT /roles/{id}/permissions."""

    role_id: uuid.UUID
    role_slug: str
    implicit_all_permissions: bool = False
    permissions: list[PermissionOut] = []
