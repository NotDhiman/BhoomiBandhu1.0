"""Add is_consumed to otp_challenges for single-use replay protection

Revision ID: 002_otp_single_use
Revises: 001_create_auth_tables
Create Date: 2026-11-01 16:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002_otp_single_use"
down_revision: Union[str, None] = "001_create_auth_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "otp_challenges",
        sa.Column(
            "is_consumed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("otp_challenges", "is_consumed")
