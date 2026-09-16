"""Alembic migration 003: Add yq_surcharge to parsed_airfare_observations

Revision ID: 003_add_yq_surcharge
Revises: 002_source_health
Create Date: 2026-09-15

Phase B Hardening: Persist fuel surcharge (YQ) extracted from fare breakdown.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_add_yq_surcharge'
down_revision: Union[str, None] = '002_source_health'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'parsed_airfare_observations',
        sa.Column('yq_surcharge', sa.Numeric(precision=10, scale=2), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('parsed_airfare_observations', 'yq_surcharge')
