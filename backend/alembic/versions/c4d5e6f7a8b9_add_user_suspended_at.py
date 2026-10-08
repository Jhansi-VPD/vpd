"""Add users.suspended_at for the admin suspension status

Revision ID: c4d5e6f7a8b9
Revises: a2b3c4d5e6f7
Create Date: 2026-10-08 00:00:00.000000

User Management module: the spec requires an explicit "Suspended" status
distinct from "Inactive" (deactivated). Deactivation keeps using the
existing boolean `is_active`; suspension gets its own nullable timestamp —
set to now() on suspend, NULLed on restore/activate. Display status is
derived (see User.status property); no separate status column is added so
the model does not conflict with existing schema semantics.

Additive + nullable: safe on a populated table, no backfill needed.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'suspended_at')
