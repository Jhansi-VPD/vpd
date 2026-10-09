"""Standalone real-database E2E for the complete Role -> Permission -> User ->
Portal -> API authorization flow (Role & Permission Management spec, section 53).

Mirrors tests/real_db_verification.py: runs OUTSIDE tests/conftest.py (which
unconditionally mocks sqlalchemy's create_async_engine for the whole pytest
session), so every statement below is real SQL against a real database — no
mocked sessions, no faked rows, no shortcut through the handlers.

Postgres usage (the canonical target — same shape as CI's service container):

    ENV=test DB_HOST=localhost DB_PORT=55432 DB_NAME=vpdtechnologies_test \
    DB_USER=test_user DB_PASS=test_pass python tests/real_db_rbac_e2e.py

Local fallback when no Postgres/Docker is available:

    ENV=test python tests/real_db_rbac_e2e.py

(those assume they are run from backend/ with the backend root importable;
the script also inserts its own parent directory into sys.path so the
invocation works regardless of the caller's PYTHONPATH.)

The fallback still executes real SQL with real persistence — SQLite is a real
database, not a mock. Three harness-only translations make the app's Postgres-
only DDL run there, applied at CREATE TABLE time and only on the SQLite
dialect (they are never triggered against Postgres):

  * @compiles(JSONB/'sqlite')   -> JSON (AuditLog.log_metadata; stored/loaded
    as JSON text — the ORM sees identical dict values on both dialects)
  * @compiles(postgresql.UUID/'sqlite') -> CHAR(32), plus a process-local
    sqlite3 uuid.UUID -> str adapter for AuditLog's PG-only UUID columns
  * a create_async_engine wrapper that drops QueuePool-only kwargs
    (pool_size/max_overflow) when the URL is SQLite — the engine itself is
    the real factory's real engine, never a mock

SQLite limits (stated honestly): single-writer semantics, no PG-specific
behavior is exercised (none is used by the RBAC path — plain joins, scalar
subqueries, ilike, server defaults, all portable). Postgres remains the
CI/production gate; this fallback proves the authorization flow end to end on
a developer machine with no containers.

The script DROPs and re-creates only the five tables it owns (users, roles,
permissions, role_permissions, audit_logs) so fixed slugs like `super_admin`
can be reseeded on reruns. Point it at a disposable test database only — the
Postgres usage line above targets exactly that, never a shared or production
database.

Verifies, against real persisted rows:
  1.  401 vs 403: unauthenticated vs authenticated-but-unauthorized.
  2.  Role CRUD through the API (create, duplicate 409, validation 422).
  3.  Permission CRUD through the API (derived names, duplicate 409).
  4.  Transactional role-permission replacement + rollback on invalid ids.
  5.  super_admin implicit-all-permissions representation.
  6.  User-role assignment (user -> role direction) and portal propagation
      to GET /auth/me (role.portal -> UserRead.portal).
  7.  Effective permissions view (role -> role_permissions -> permissions).
  8.  Section 50: permission cache invalidation is immediate (revoked
      permission flips 200 -> 403 on the very next request, no TTL wait;
      re-grant flips back just as fast).
  9.  Privilege-escalation guards (only super_admin grants admin/super_admin;
      unknown/inactive/deleted role slugs rejected; self-change blocked;
      non-super admins cannot manage admin accounts).
  10. Section 47 dependency protection (system roles cannot be deactivated
      or deleted; a role with assigned users cannot be deactivated or
      deleted; super_admin's implicit set is not editable).
  11. Audit trail rows for role mutations (ROLE_CREATED / ROLE_PERMISSION_*)
      with the actor's identity, readable back through the activity endpoint
      and confirmed directly in the audit_logs table.
  12. Full lifecycle: reassign users away -> deactivate -> assignment to an
      inactive role rejected -> reactivate -> soft delete -> assignment to a
      deleted role rejected; list/detail exclude the soft-deleted row.
  13. Query-count bound for the roles list (no N+1) + a small, honestly
      labeled latency measurement.
"""

from __future__ import annotations

import asyncio
import os
import sqlite3
import statistics
import sys
import tempfile
import time
import uuid
from pathlib import Path

# ---------------------------------------------------------------------------
# Environment bootstrap — MUST run before any app import (settings reads env
# at import time and the engine is built from it immediately).
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

os.environ.setdefault("ENV", "test")

_SQLITE_FILE: Path | None = None
if not os.environ.get("DATABASE_URL") and not os.environ.get("DB_HOST"):
    _SQLITE_FILE = Path(tempfile.gettempdir()) / f"vpd_rbac_e2e_{uuid.uuid4().hex[:8]}.db"
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_SQLITE_FILE.as_posix()}"
    # AuditLog.user_id / entity_id use postgresql.UUID, whose bind processor
    # only exists on the pg dialect — the raw uuid.UUID object would reach
    # sqlite3, which cannot adapt it. Adapt explicitly (harness-local).
    sqlite3.register_adapter(uuid.UUID, str)

    # app/core/database.py builds its engine at import time and always passes
    # QueuePool kwargs (pool_size/max_overflow). SQLite's default NullPool
    # rejects them, so wrap the REAL factory — the engine is fully real, this
    # only strips QueuePool-only arguments when the URL is SQLite, in the same
    # spirit as the @compiles dialect hooks below. Never triggers on Postgres.
    import sqlalchemy.ext.asyncio as _sa_asyncio

    _real_create_async_engine = _sa_asyncio.create_async_engine

    def _create_async_engine_compat(url, *args, **kwargs):
        if str(url).startswith("sqlite"):
            kwargs.pop("pool_size", None)
            kwargs.pop("max_overflow", None)
        return _real_create_async_engine(url, *args, **kwargs)

    _sa_asyncio.create_async_engine = _create_async_engine_compat

from sqlalchemy.dialects.postgresql import JSONB  # noqa: E402
from sqlalchemy.dialects.postgresql import UUID as PG_UUID  # noqa: E402
from sqlalchemy.ext.compiler import compiles  # noqa: E402


@compiles(JSONB, "sqlite")
def _jsonb_on_sqlite(element, compiler, **kw):  # pragma: no cover - harness hook
    return compiler.visit_JSON(element, **kw)


@compiles(PG_UUID, "sqlite")
def _pg_uuid_on_sqlite(element, compiler, **kw):  # pragma: no cover - harness hook
    return "CHAR(32)"


from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import delete, event, func, select  # noqa: E402

from app.core.database import AsyncSessionLocal, Base, engine  # noqa: E402
from app.core.dependencies import get_current_user  # noqa: E402
from app.core.password import hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models.associations import role_permissions  # noqa: E402
from app.models.audit_log import AuditLog  # noqa: E402
from app.models.permission import Permission  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402

API = "/api/v1"
RESULTS: list[tuple[str, bool, str]] = []


def check(name: str, passed: bool, detail: str = "") -> None:
    RESULTS.append((name, passed, detail))
    print(f"{'PASS' if passed else 'FAIL'} — {name}{': ' + detail if detail else ''}")


async def _mk_user(db, role: str, name: str, email: str) -> User:
    user = User(
        id=uuid.uuid4(),
        name=name,
        email=email,
        password_hash=hash_password(uuid.uuid4().hex),  # unused — auth is dependency-overridden
        role=role,
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


class Harness:
    """One ASGI client + auth-override flipping, mirroring real_db_verification.py."""

    def __init__(self) -> None:
        self.transport = ASGITransport(app=app)
        self.client: AsyncClient | None = None

    async def __aenter__(self) -> "Harness":
        self.client = AsyncClient(transport=self.transport, base_url="http://test")
        return self

    async def __aexit__(self, *exc) -> None:
        if self.client is not None:
            await self.client.aclose()
        app.dependency_overrides.pop(get_current_user, None)

    async def call(self, method: str, path: str, user: User | None = None, **kw):
        """user=None means 'no override' -> the real get_current_user runs (401 checks)."""
        if user is None:
            app.dependency_overrides.pop(get_current_user, None)
        else:
            app.dependency_overrides[get_current_user] = lambda: user
        assert self.client is not None
        return await self.client.request(method, path, **kw)


async def seed() -> dict[str, User | uuid.UUID]:
    """Fixed-slug seed: the two system roles plus five users covering every
    actor the flow needs. Roles/permissions for the flow itself are created
    THROUGH the API below (that is part of what is being verified)."""
    async with AsyncSessionLocal() as db:
        super_role = Role(
            name="Super Admin",
            slug="super_admin",
            description="Implicit all-permissions system role",
            is_system=True,
            is_active=True,
            portal="admin",
        )
        admin_role = Role(
            name="Admin",
            slug="admin",
            description="Platform administration",
            is_system=True,
            is_active=True,
            portal="admin",
        )
        db.add_all([super_role, admin_role])
        await db.flush()
        mia = await _mk_user(db, "super_admin", "Mia Admin", f"mia-{uuid.uuid4().hex[:8]}@example.com")
        oliver = await _mk_user(db, "admin", "Oliver Admin", f"oliver-{uuid.uuid4().hex[:8]}@example.com")
        sam = await _mk_user(db, "employee", "Sam Sales", f"sam-{uuid.uuid4().hex[:8]}@example.com")
        nina = await _mk_user(db, "employee", " Nina Emp", f"nina-{uuid.uuid4().hex[:8]}@example.com")
        paul = await _mk_user(db, "employee", "Paul Emp", f"paul-{uuid.uuid4().hex[:8]}@example.com")
        await db.commit()
        return {
            "super_role_id": super_role.id,
            "admin_role_id": admin_role.id,
            "mia": mia,
            "oliver": oliver,
            "sam": sam,
            "nina": nina,
            "paul": paul,
        }


def data(resp) -> dict | list:
    return resp.json().get("data")  # type: ignore[union-attr]


def message(resp) -> str:
    return resp.json().get("message", "")  # type: ignore[union-attr]


async def main() -> None:
    tables = [User.__table__, Role.__table__, Permission.__table__, role_permissions, AuditLog.__table__]
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all, tables=tables)
        await conn.run_sync(Base.metadata.create_all, tables=tables)

    seed_ids = await seed()
    mia: User = seed_ids["mia"]  # type: ignore[assignment]
    oliver: User = seed_ids["oliver"]  # type: ignore[assignment]
    sam: User = seed_ids["sam"]  # type: ignore[assignment]
    nina: User = seed_ids["nina"]  # type: ignore[assignment]
    paul: User = seed_ids["paul"]  # type: ignore[assignment]
    super_role_id: uuid.UUID = seed_ids["super_role_id"]  # type: ignore[assignment]
    admin_role_id: uuid.UUID = seed_ids["admin_role_id"]  # type: ignore[assignment]

    async with Harness() as h:
        # ------------------------------------------------------------------
        # 1. 401 vs 403 — authentication and authorization are distinct gates
        # ------------------------------------------------------------------
        r = await h.call("GET", f"{API}/access-control/roles")
        check("unauthenticated roles list -> 401 (real DB)", r.status_code == 401, f"got {r.status_code}")

        r = await h.call("GET", f"{API}/access-control/roles", user=sam)
        check(
            "employee with no permissions -> 403 naming roles:read (real DB)",
            r.status_code == 403 and "roles:read" in message(r),
            f"got {r.status_code} message={message(r)!r}",
        )

        r = await h.call("GET", f"{API}/access-control/roles", user=oliver)
        check(
            "admin with NO mapped permissions -> 403 (admin is not super_admin) (real DB)",
            r.status_code == 403,
            f"got {r.status_code}",
        )

        # ------------------------------------------------------------------
        # 2. Role CRUD through the API as super_admin
        # ------------------------------------------------------------------
        r = await h.call("GET", f"{API}/access-control/roles", user=mia)
        slugs = {row["slug"] for row in data(r)} if r.status_code == 200 else set()
        check(
            "super_admin lists seeded system roles (real DB)",
            r.status_code == 200 and {"super_admin", "admin"} <= slugs,
            f"got {r.status_code} slugs={sorted(slugs)}",
        )

        r = await h.call(
            "POST",
            f"{API}/access-control/roles",
            user=mia,
            json={"name": "Sales Lead", "slug": "sales_lead", "portal": "sales"},
        )
        sales_lead = data(r) if r.status_code == 201 else {}
        check(
            "create custom role via API -> 201 (real DB)",
            r.status_code == 201 and sales_lead.get("slug") == "sales_lead" and sales_lead.get("portal") == "sales",
            f"got {r.status_code} data={sales_lead}",
        )
        sales_lead_id = uuid.UUID(sales_lead["id"])

        r = await h.call(
            "POST",
            f"{API}/access-control/roles",
            user=mia,
            json={"name": "Sales Lead", "slug": "sales_lead", "portal": "sales"},
        )
        check("duplicate role name/slug -> 409 (real DB)", r.status_code == 409, f"got {r.status_code}")

        r = await h.call(
            "POST",
            f"{API}/access-control/roles",
            user=mia,
            json={"name": "Nonsense", "slug": "nonsense", "portal": "not-a-portal"},
        )
        check("invalid portal value rejected -> 422 (real DB)", r.status_code == 422, f"got {r.status_code}")

        # ------------------------------------------------------------------
        # 3. Permission CRUD through the API (names derived as module:action)
        # ------------------------------------------------------------------
        perm_ids: dict[str, uuid.UUID] = {}
        created_ok = True
        for module, action in [("leads", "view"), ("leads", "create"), ("reports", "export"), ("roles", "read")]:
            r = await h.call(
                "POST",
                f"{API}/access-control/permissions",
                user=mia,
                json={"module": module, "action": action},
            )
            if r.status_code != 201 or data(r).get("name") != f"{module}:{action}":
                created_ok = False
                check(f"create permission {module}:{action} -> 201 (real DB)", False, f"got {r.status_code}")
            else:
                perm_ids[f"{module}:{action}"] = uuid.UUID(data(r)["id"])
        check(
            "create four permissions via API -> 201, name = module:action (real DB)",
            created_ok and len(perm_ids) == 4,
            f"created={sorted(perm_ids)}",
        )

        r = await h.call(
            "POST",
            f"{API}/access-control/permissions",
            user=mia,
            json={"module": "leads", "action": "view"},
        )
        check("duplicate permission -> 409 (real DB)", r.status_code == 409, f"got {r.status_code}")

        # ------------------------------------------------------------------
        # 4. Role -> permission mapping: transactional full replacement
        # ------------------------------------------------------------------
        r = await h.call(
            "PUT",
            f"{API}/access-control/roles/{sales_lead_id}/permissions",
            user=mia,
            json={"permission_ids": [str(perm_ids["leads:view"])]},
        )
        check("map leads:view onto sales_lead -> 200 (real DB)", r.status_code == 200, f"got {r.status_code}")

        r = await h.call("GET", f"{API}/access-control/roles/{sales_lead_id}/permissions", user=mia)
        names = {p["name"] for p in data(r)["permissions"]} if r.status_code == 200 else set()
        check(
            "role permission summary shows exactly leads:view (real DB)",
            r.status_code == 200 and names == {"leads:view"} and data(r)["implicit_all_permissions"] is False,
            f"got {r.status_code} names={sorted(names)}",
        )

        r = await h.call("GET", f"{API}/access-control/roles/{super_role_id}/permissions", user=mia)
        super_names = {p["name"] for p in data(r)["permissions"]} if r.status_code == 200 else set()
        check(
            "super_admin role reports implicit_all_permissions=true with every active permission (real DB)",
            r.status_code == 200 and data(r)["implicit_all_permissions"] is True and len(super_names) == 4,
            f"got {r.status_code} count={len(super_names)}",
        )

        r = await h.call(
            "PUT",
            f"{API}/access-control/roles/{admin_role_id}/permissions",
            user=oliver,
            json={"permission_ids": [str(perm_ids["leads:view"])]},
        )
        check(
            "non-super admin editing a SYSTEM role's permissions -> 403 (real DB)",
            r.status_code == 403,
            f"got {r.status_code}",
        )

        r = await h.call(
            "PUT",
            f"{API}/access-control/roles/{super_role_id}/permissions",
            user=mia,
            json={"permission_ids": []},
        )
        check(
            "super_admin's implicit permission set is not editable -> 409 (real DB)",
            r.status_code == 409,
            f"got {r.status_code}",
        )

        r = await h.call(
            "PUT",
            f"{API}/access-control/roles/{sales_lead_id}/permissions",
            user=mia,
            json={"permission_ids": [str(perm_ids["leads:view"]), str(uuid.uuid4())]},
        )
        rejected = r.status_code == 400
        r2 = await h.call("GET", f"{API}/access-control/roles/{sales_lead_id}/permissions", user=mia)
        after_names = {p["name"] for p in data(r2)["permissions"]} if r2.status_code == 200 else set()
        check(
            "invalid permission id in bulk PUT -> 400 and mapping UNCHANGED (transactional rollback, real DB)",
            rejected and after_names == {"leads:view"},
            f"reject={rejected} after={sorted(after_names)}",
        )

        # ------------------------------------------------------------------
        # 5. User -> role assignment and portal propagation
        # ------------------------------------------------------------------
        r = await h.call("PUT", f"{API}/users/{sam.id}/roles", user=mia, json={"roles": ["sales_lead"]})
        check(
            "assign custom role to user via API -> 200 (real DB)",
            r.status_code == 200 and data(r).get("role") == "sales_lead",
            f"got {r.status_code} data={data(r)}",
        )
        # The override hands handlers a User object directly, bypassing
        # get_current_user's per-request DB fetch — mirror that freshness so
        # calls below observe the committed role like a real request would.
        sam.role = "sales_lead"

        r = await h.call("GET", f"{API}/users/{sam.id}/roles", user=mia)
        check(
            "user roles endpoint reflects the new role (real DB)",
            r.status_code == 200 and data(r).get("current") == "sales_lead",
            f"got {r.status_code} current={data(r).get('current') if r.status_code == 200 else 'N/A'}",
        )

        r = await h.call("GET", f"{API}/auth/me", user=sam)
        check(
            "GET /auth/me carries role.portal through to UserRead.portal (portal chain, real DB)",
            r.status_code == 200 and data(r).get("role") == "sales_lead" and data(r).get("portal") == "sales",
            f"got {r.status_code} role={data(r).get('role') if r.status_code == 200 else 'N/A'} "
            f"portal={data(r).get('portal') if r.status_code == 200 else 'N/A'}",
        )

        r = await h.call("GET", f"{API}/users/{sam.id}/permissions", user=oliver)
        sam_names = {p["name"] for p in data(r)["permissions"]} if r.status_code == 200 else set()
        check(
            "effective permissions = role's mapped set (leads:view) (real DB)",
            r.status_code == 200 and data(r).get("source") == "role" and sam_names == {"leads:view"},
            f"got {r.status_code} names={sorted(sam_names)}",
        )

        # ------------------------------------------------------------------
        # 6. Section 50 — cache invalidation is immediate, not TTL-bound
        # ------------------------------------------------------------------
        await h.call(
            "PUT",
            f"{API}/access-control/roles/{sales_lead_id}/permissions",
            user=mia,
            json={"permission_ids": [str(perm_ids["leads:view"]), str(perm_ids["roles:read"])]},
        )
        r = await h.call("GET", f"{API}/access-control/roles", user=sam)
        granted_ok = r.status_code == 200

        await h.call(
            "PUT",
            f"{API}/access-control/roles/{sales_lead_id}/permissions",
            user=mia,
            json={"permission_ids": [str(perm_ids["leads:view"])]},
        )
        r = await h.call("GET", f"{API}/access-control/roles", user=sam)
        revoked_ok = r.status_code == 403

        await h.call(
            "PUT",
            f"{API}/access-control/roles/{sales_lead_id}/permissions",
            user=mia,
            json={"permission_ids": [str(perm_ids["leads:view"]), str(perm_ids["roles:read"])]},
        )
        r = await h.call("GET", f"{API}/access-control/roles", user=sam)
        regranted_ok = r.status_code == 200
        check(
            "revoking roles:read flips the user's NEXT request to 403 and re-granting flips it back (real DB, §50)",
            granted_ok and revoked_ok and regranted_ok,
            f"granted={granted_ok} revoked={revoked_ok} regranted={regranted_ok}",
        )

        # ------------------------------------------------------------------
        # 7. Privilege-escalation and input-trust guards
        # ------------------------------------------------------------------
        r = await h.call(
            "POST",
            f"{API}/access-control/roles",
            user=sam,
            json={"name": "Sneaky", "slug": "sneaky", "portal": "sales"},
        )
        check(
            "user holding only roles:read cannot create roles -> 403 (real DB)",
            r.status_code == 403 and "roles:create" in message(r),
            f"got {r.status_code} message={message(r)!r}",
        )

        r = await h.call("PUT", f"{API}/users/{nina.id}/roles", user=oliver, json={"roles": ["super_admin"]})
        check(
            "non-super admin cannot grant super_admin -> 403 (real DB)",
            r.status_code == 403,
            f"got {r.status_code}",
        )

        r = await h.call("PUT", f"{API}/users/{mia.id}/roles", user=mia, json={"roles": ["admin"]})
        check(
            "super admin cannot change their OWN role -> 400 (real DB)",
            r.status_code == 400 and "own account" in message(r),
            f"got {r.status_code} message={message(r)!r}",
        )

        r = await h.call("PUT", f"{API}/users/{mia.id}/roles", user=oliver, json={"roles": ["employee"]})
        check(
            "non-super admin cannot manage a super_admin account -> 403 (real DB)",
            r.status_code == 403,
            f"got {r.status_code}",
        )

        r = await h.call("PUT", f"{API}/users/{nina.id}/roles", user=oliver, json={"roles": ["ghost_role"]})
        check(
            "unknown custom slug rejected -> 400 (request body never trusted, real DB)",
            r.status_code == 400 and "Unknown or inactive role" in message(r),
            f"got {r.status_code} message={message(r)!r}",
        )

        # ------------------------------------------------------------------
        # 8. Section 47 — dependency protection
        # ------------------------------------------------------------------
        r = await h.call("PATCH", f"{API}/access-control/roles/{super_role_id}/status", user=mia, json={"is_active": False})
        check("deactivate super_admin role -> 409 (real DB)", r.status_code == 409, f"got {r.status_code}")

        r = await h.call("DELETE", f"{API}/access-control/roles/{super_role_id}", user=mia)
        check("delete super_admin role -> 409 (real DB)", r.status_code == 409, f"got {r.status_code}")

        r = await h.call("PATCH", f"{API}/access-control/roles/{admin_role_id}/status", user=mia, json={"is_active": False})
        check("deactivate admin role -> 409 (real DB)", r.status_code == 409, f"got {r.status_code}")

        r = await h.call("PATCH", f"{API}/access-control/roles/{sales_lead_id}/status", user=mia, json={"is_active": False})
        check(
            "deactivate custom role WITH users assigned -> 409 (real DB)",
            r.status_code == 409 and "Reassign them first" in message(r),
            f"got {r.status_code} message={message(r)!r}",
        )

        r = await h.call("DELETE", f"{API}/access-control/roles/{sales_lead_id}", user=mia)
        check(
            "delete custom role WITH users assigned -> 409 (real DB)",
            r.status_code == 409,
            f"got {r.status_code}",
        )

        r = await h.call("GET", f"{API}/access-control/roles/{sales_lead_id}/users", user=mia)
        user_ids = {row["id"] for row in data(r)} if r.status_code == 200 else set()
        check(
            "role -> users direction lists sam (real DB)",
            r.status_code == 200 and str(sam.id) in user_ids,
            f"got {r.status_code} count={len(user_ids)}",
        )

        # ------------------------------------------------------------------
        # 9. Audit trail
        # ------------------------------------------------------------------
        r = await h.call("GET", f"{API}/access-control/roles/{sales_lead_id}/activity", user=mia)
        entries = data(r) if r.status_code == 200 else []
        actions = {e["action"] for e in entries}
        created_entry = next((e for e in entries if e["action"] == "ROLE_CREATED"), None)
        check(
            "role activity endpoint returns ROLE_CREATED/ROLE_PERMISSION_* with actor identity (real DB)",
            r.status_code == 200
            and {"ROLE_CREATED", "ROLE_PERMISSION_ASSIGNED", "ROLE_PERMISSION_REMOVED"} <= actions
            and created_entry is not None
            and created_entry["actor_name"] == "Mia Admin"
            and created_entry["actor_id"] == str(mia.id),
            f"got {r.status_code} actions={sorted(actions)}",
        )

        async with AsyncSessionLocal() as db:
            rows = (
                await db.execute(
                    select(AuditLog.action, AuditLog.user_id).where(
                        # Bind the UUID object itself — the column's PG UUID
                        # type (and its sqlite CHAR(32) stand-in) both expect
                        # uuid.UUID, not str.
                        AuditLog.entity_type == "role",
                        AuditLog.entity_id == sales_lead_id,
                    )
                )
            ).all()
        db_actions = {a for a, _ in rows}
        created_actor = next((uid for a, uid in rows if a == "ROLE_CREATED"), None)
        # uuid.UUID normalizes both storage shapes: Postgres returns a real
        # uuid, the sqlite CHAR(32) stand-in returns undashed hex — both must
        # compare equal to the seeded actor's id.
        created_actor_id = str(uuid.UUID(str(created_actor))) if created_actor else None
        check(
            "audit_logs rows persisted for every role mutation with the super_admin actor (real DB)",
            {"ROLE_CREATED", "ROLE_PERMISSION_ASSIGNED", "ROLE_PERMISSION_REMOVED"} <= db_actions
            and created_actor_id == str(mia.id),
            f"actions={sorted(db_actions)}",
        )

        # ------------------------------------------------------------------
        # 10. Full lifecycle: reassign -> deactivate -> delete (soft)
        # ------------------------------------------------------------------
        r = await h.call("PUT", f"{API}/users/{sam.id}/roles", user=mia, json={"roles": ["employee"]})
        check("reassign user back to employee -> 200 (real DB)", r.status_code == 200, f"got {r.status_code}")
        sam.role = "employee"

        r = await h.call("PATCH", f"{API}/access-control/roles/{sales_lead_id}/status", user=mia, json={"is_active": False})
        check("deactivate now-unassigned custom role -> 200 (real DB)", r.status_code == 200, f"got {r.status_code}")

        r = await h.call("PUT", f"{API}/users/{paul.id}/roles", user=mia, json={"roles": ["sales_lead"]})
        check(
            "assignment to an INACTIVE role rejected -> 400 (real DB)",
            r.status_code == 400 and "Unknown or inactive role" in message(r),
            f"got {r.status_code}",
        )

        r = await h.call("PATCH", f"{API}/access-control/roles/{sales_lead_id}/status", user=mia, json={"is_active": True})
        check("reactivate custom role -> 200 (real DB)", r.status_code == 200, f"got {r.status_code}")

        r = await h.call("DELETE", f"{API}/access-control/roles/{sales_lead_id}", user=mia)
        check("soft-delete unassigned custom role -> 200 (real DB)", r.status_code == 200, f"got {r.status_code}")

        r = await h.call("GET", f"{API}/access-control/roles", user=mia)
        slugs_after = {row["slug"] for row in data(r)} if r.status_code == 200 else set()
        check(
            "roles list excludes the soft-deleted role (real DB)",
            r.status_code == 200 and "sales_lead" not in slugs_after,
            f"slugs={sorted(slugs_after)}",
        )

        r = await h.call("PUT", f"{API}/users/{paul.id}/roles", user=mia, json={"roles": ["sales_lead"]})
        check(
            "assignment to a DELETED role rejected -> 400 (real DB)",
            r.status_code == 400 and "Unknown or inactive role" in message(r),
            f"got {r.status_code}",
        )

        r = await h.call("GET", f"{API}/access-control/roles/{sales_lead_id}", user=mia)
        check("soft-deleted role detail -> 404 (real DB)", r.status_code == 404, f"got {r.status_code}")

        # ------------------------------------------------------------------
        # 11. Query-count bound (no N+1) + honest latency measurement
        # ------------------------------------------------------------------
        query_count = {"n": 0}

        def _count(*_a, **_kw):
            query_count["n"] += 1

        event.listen(engine.sync_engine, "before_cursor_execute", _count)
        try:
            r = await h.call("GET", f"{API}/access-control/roles?limit=100", user=mia)
        finally:
            event.remove(engine.sync_engine, "before_cursor_execute", _count)
        n = query_count["n"]
        check(
            "roles list runs a bounded number of queries (list + count, no N+1) (real DB)",
            r.status_code == 200 and n <= 4,
            f"status={r.status_code} query_count={n}",
        )

        timings: list[float] = []
        status = None
        for _ in range(10):
            t0 = time.perf_counter()
            r = await h.call("GET", f"{API}/access-control/roles?limit=100", user=mia)
            timings.append((time.perf_counter() - t0) * 1000)
            status = r.status_code
        timings.sort()
        p50 = statistics.median(timings)
        p95 = timings[int(len(timings) * 0.95) - 1]
        print(
            "\n--- Latency (n=10, sequential, in-process ASGI, local DB, warm pool, "
            "3-role dataset) — not a load test, not over-the-network ---"
        )
        print(f"GET /access-control/roles: status={status} p50={p50:.1f}ms p95={p95:.1f}ms max={max(timings):.1f}ms")
        check(
            "GET /access-control/roles p95 < 200ms (n=10, local, in-process, small dataset)",
            status == 200 and p95 < 200,
            f"p95={p95:.1f}ms max={max(timings):.1f}ms",
        )

    await engine.dispose()

    if _SQLITE_FILE is not None:
        for suffix in ("", "-wal", "-shm"):
            try:
                os.remove(str(_SQLITE_FILE) + suffix)
            except OSError:
                pass

    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} real-DB RBAC E2E checks passed")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
