"""add rbac management support

Revision ID: e6f7a8b9c0d1
Revises: c4d5e6f7a8b9
Create Date: 2026-10-08

Upgrades the role/permission tables for the Role & Permission Management
module:

- `roles.is_active` + `roles.portal` — roles can now be activated/
  deactivated and are mapped to exactly one portal (matching the frontend
  ROLE_HOME map in src/auth/role-route.tsx).
- `permissions.is_system` + `permissions.is_active` — permissions get the
  same system-protection and activation lifecycle roles already had.
- `users.role` is migrated from the PostgreSQL `user_role` enum to
  VARCHAR(100) so custom roles (which are rows in `roles`, not enum
  members) can be assigned to users. The `user_role` type itself is left
  in place (harmless) so the downgrade is a pure cast back; there is no
  server_default to drop since the enum default was Python-side only.
- Indexes for the new access paths (`users.role`, `permissions.module`,
  `role_permissions.permission_id` — the reverse side of the join).
- Data backfill REQUIRED for production: Render's buildCommand runs ONLY
  `alembic upgrade head` (never seeds.py), so this migration must carry
  the baseline RBAC data or a freshly deployed admin would have zero
  permissions. All statements are idempotent (`ON CONFLICT DO NOTHING` /
  `WHERE ... IS NULL`) so re-running against an already-seeded dev
  database is a no-op.

Custom role slugs are intentionally NOT constrained beyond the app-level
`^[a-z][a-z0-9_]{1,63}$` validation; role name/slug uniqueness keeps
PG's default (non-partial) unique constraints, which means a soft-deleted
role's slug stays reserved. That is deliberate — slug reuse after delete
would make audit history ambiguous — and it keeps this migration free of
constraint rewrites on existing data.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The 14 built-in roles (13 enum members + partner, which exists as a role
# row/seed but has no users.role enum member in the wild).
BUILT_IN_ROLES = [
    "super_admin",
    "admin",
    "hr",
    "sales",
    "marketing",
    "project_manager",
    "developer",
    "qa",
    "support",
    "finance",
    "client",
    "partner",
    "employee",
    "guest",
]

# Portal mapping mirrors src/auth/role-route.tsx ROLE_HOME + docs/portal-map.md.
ROLE_PORTALS = {
    "super_admin": "admin",
    "admin": "admin",
    "finance": "admin",
    "hr": "hr",
    "sales": "sales",
    "marketing": "sales",
    "project_manager": "delivery",
    "developer": "employee",
    "qa": "employee",
    "employee": "employee",
    "client": "client",
    "support": "employee",
    "partner": "partner",
}

# Existing 12 baseline permissions (created by seeds.py) + the 9 new
# access-control permissions this module introduces.
ACCESS_CONTROL_PERMISSIONS = [
    ("roles:read", "roles", "read", "View roles and their permissions"),
    ("roles:create", "roles", "create", "Create custom roles"),
    ("roles:update", "roles", "update", "Update roles and their status"),
    ("roles:delete", "roles", "delete", "Delete custom roles"),
    ("roles:manage_permissions", "roles", "manage_permissions", "Assign and remove permissions from roles"),
    ("permissions:read", "permissions", "read", "View permissions"),
    ("permissions:create", "permissions", "create", "Create permissions"),
    ("permissions:update", "permissions", "update", "Update permissions and their status"),
    ("permissions:delete", "permissions", "delete", "Delete custom permissions"),
]

# Baseline role -> permission mappings. `admin` gets everything (the module's
# whole point is that authorization is DB-driven, not hardcoded — super_admin
# still bypasses checks in code by design). Other built-in roles get the
# baseline permissions matching their existing `require_roles` grants so
# nothing regresses when admins start configuring permissions.
BASELINE_MAPPINGS = {
    "admin": [
        "users:read", "users:write",
        "projects:read", "projects:write",
        "tasks:read", "tasks:write",
        "invoices:read", "invoices:write",
        "tickets:read", "tickets:write",
        "reports:read", "settings:manage",
        "roles:read", "roles:create", "roles:update", "roles:delete",
        "roles:manage_permissions",
        "permissions:read", "permissions:create", "permissions:update", "permissions:delete",
    ],
    "hr": [
        "users:read", "users:write",
        "tickets:read", "tickets:write",
    ],
    "sales": [
        "projects:read",
        "invoices:read", "invoices:write",
    ],
    "marketing": [
        "projects:read",
        "reports:read",
    ],
    "project_manager": [
        "projects:read", "projects:write",
        "tasks:read", "tasks:write",
        "reports:read",
    ],
    "finance": [
        "invoices:read", "invoices:write",
        "reports:read",
    ],
    "support": [
        "tickets:read", "tickets:write",
    ],
}


def upgrade() -> None:
    # --- schema -----------------------------------------------------------------
    op.add_column(
        "roles",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column("roles", sa.Column("portal", sa.String(length=50), nullable=True))

    op.add_column(
        "permissions",
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "permissions",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    # users.role enum -> varchar(100) so custom role slugs can be assigned.
    # The `user_role` PG type is intentionally left in place so the downgrade
    # is a pure cast back; no server_default exists to drop.
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(100) USING role::text")

    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_permissions_module", "permissions", ["module"])
    op.create_index("ix_role_permissions_permission_id", "role_permissions", ["permission_id"])

    # --- data (idempotent; production runs migrations only, never seeds) --------
    for slug in BUILT_IN_ROLES:
        op.execute(
            sa.text("UPDATE roles SET is_system = true, is_active = true WHERE slug = :slug").bindparams(
                slug=slug
            )
        )

    for slug, portal in ROLE_PORTALS.items():
        op.execute(
            sa.text(
                "UPDATE roles SET portal = :portal WHERE slug = :slug AND portal IS NULL"
            ).bindparams(portal=portal, slug=slug)
        )

    for name, module, action, description in ACCESS_CONTROL_PERMISSIONS:
        op.execute(
            sa.text(
                """
                INSERT INTO permissions (id, name, module, action, description, is_system, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), :name, :module, :action, :description, true, true, now(), now())
                ON CONFLICT (name) DO NOTHING
                """
            ).bindparams(name=name, module=module, action=action, description=description)
        )

    for role_slug, permission_names in BASELINE_MAPPINGS.items():
        for permission_name in permission_names:
            op.execute(
                sa.text(
                    """
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT r.id, p.id FROM roles r, permissions p
                    WHERE r.slug = :role_slug AND p.name = :permission_name
                    ON CONFLICT DO NOTHING
                    """
                ).bindparams(role_slug=role_slug, permission_name=permission_name)
            )


def downgrade() -> None:
    op.drop_index("ix_role_permissions_permission_id", table_name="role_permissions")
    op.drop_index("ix_permissions_module", table_name="permissions")
    op.drop_index("ix_users_role", table_name="users")

    # NOTE: data-lossy for custom roles — any users.role value that is not a
    # built-in enum member cannot survive the cast back to the enum. Custom
    # role assignments are reset to 'employee' first so the cast cannot fail.
    op.execute(
        """
        UPDATE users SET role = 'employee'
        WHERE role NOT IN (
            'super_admin','admin','hr','sales','marketing','project_manager',
            'developer','qa','support','finance','client','employee','guest'
        )
        """
    )
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role")

    op.drop_column("permissions", "is_active")
    op.drop_column("permissions", "is_system")
    op.drop_column("roles", "portal")
    op.drop_column("roles", "is_active")
