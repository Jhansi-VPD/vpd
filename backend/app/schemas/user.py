import re
import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import UserRole
from app.schemas.auth import _validate_password_complexity
from app.schemas.common import ORMBase, TimestampedRead
from app.schemas.role import SLUG_PATTERN


class UserCreate(BaseModel):
    """Admin/HR user provisioning (POST /users).

    `password` is intentionally optional: when omitted, the account is
    created with an unusable random password and the invitee receives a
    password-setup link by email (is_email_verified stays False until they
    use it) — never a plaintext password sent to or returned to anyone.
    When provided inline, it must pass the same complexity policy as
    registration.
    """

    name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str | None = None
    role: UserRole = UserRole.employee
    phone: str | None = Field(default=None, max_length=30)
    designation: str | None = Field(default=None, max_length=150)
    department_id: uuid.UUID | None = None

    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not 6 <= len(value) <= 128:
            raise ValueError("Password must be between 6 and 128 characters")
        return _validate_password_complexity(value)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    avatar: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserOut(TimestampedRead):
    name: str
    email: EmailStr
    phone: str | None = None
    avatar: str | None = None
    # Built-in enum slug or a custom role slug (a row in the `roles` table) —
    # `str`, not UserRole, because custom roles are DB data, not enum members.
    role: str
    is_active: bool
    is_email_verified: bool
    last_login_at: datetime | None = None
    # Derived (User.status property) — one of active/inactive/suspended/
    # locked/pending. Computed, never stored.
    status: str


class UserListOut(UserOut):
    """List-row shape: user fields + the joined employee summary columns.

    Built manually in the router (not straight model_validate) because the
    employee fields arrive from an outer join, not from the User ORM object.
    """

    employee_code: str | None = None
    department_name: str | None = None
    designation: str | None = None


class UserEmployeeSummary(ORMBase):
    employee_code: str
    designation: str | None = None
    date_of_joining: date | None = None
    department_id: uuid.UUID | None = None
    department_name: str | None = None


class UserDetailOut(UserOut):
    is_locked: bool
    locked_until: datetime | None = None
    failed_login_attempts: int
    suspended_at: datetime | None = None
    email_verified_at: datetime | None = None
    password_changed_at: datetime | None = None
    mfa_enabled: bool
    employee_profile: UserEmployeeSummary | None = None


class UserSessionOut(BaseModel):
    """Admin-facing session view. Token hashes are NEVER serialized."""

    id: uuid.UUID
    created_at: datetime
    last_used_at: datetime | None = None
    expires_at: datetime
    revoked_at: datetime | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    is_current: bool = False


class LoginHistoryEntry(BaseModel):
    """Merged view of successful logins (UserSession rows) and failed
    attempts (LOGIN_FAILED audit rows) for one account."""

    id: uuid.UUID | None = None
    event: Literal["login", "login_failed"]
    timestamp: datetime
    status: str  # active | revoked | expired | failed
    success: bool
    ip_address: str | None = None
    user_agent: str | None = None


class UserActivityEntry(BaseModel):
    id: uuid.UUID
    action: str
    timestamp: datetime
    actor_id: uuid.UUID | None = None
    actor_name: str | None = None
    ip_address: str | None = None
    metadata: dict = {}


class UserRoleAssignment(BaseModel):
    """Single-role architecture: users hold exactly one role (the `users.role`
    column is the authorization source of truth). The list shape keeps the
    API future-proof, but length is pinned to exactly 1 so a caller cannot
    silently assume multi-role support. Values may be built-in role slugs or
    custom role slugs — the endpoint existence-checks custom slugs against
    the `roles` table; the request body is never trusted on its own."""

    roles: list[str] = Field(min_length=1, max_length=1)

    @field_validator("roles")
    @classmethod
    def _validate_slugs(cls, value: list[str]) -> list[str]:
        checked: list[str] = []
        for slug in value:
            text = str(slug)
            if not re.match(SLUG_PATTERN, text):
                raise ValueError(f"Invalid role slug: {text}")
            checked.append(text)
        return checked


class BulkUserActionRequest(BaseModel):
    """Safe bulk operations only — deliberately no bulk delete."""

    action: Literal["activate", "deactivate", "suspend", "restore"]
    user_ids: list[uuid.UUID] = Field(min_length=1, max_length=100)
