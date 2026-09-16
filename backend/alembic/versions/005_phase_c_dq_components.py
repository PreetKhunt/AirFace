"""Alembic migration 005: Add explicit 8 sub-metric columns to data_quality_logs

Revision ID: 005_phase_c_dq_components
Revises: 004_phase_c_normalization
Create Date: 2026-09-15

Phase C: Extend data_quality_logs with validity_pct, consistency_pct,
outlier_cleanliness_pct, and availability_pct columns.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_phase_c_dq_components'
down_revision: Union[str, None] = '004_phase_c_normalization'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'data_quality_logs',
        sa.Column('validity_pct', sa.Numeric(precision=5, scale=2), nullable=False, server_default='100.00')
    )
    op.add_column(
        'data_quality_logs',
        sa.Column('consistency_pct', sa.Numeric(precision=5, scale=2), nullable=False, server_default='100.00')
    )
    op.add_column(
        'data_quality_logs',
        sa.Column('outlier_cleanliness_pct', sa.Numeric(precision=5, scale=2), nullable=False, server_default='100.00')
    )
    op.add_column(
        'data_quality_logs',
        sa.Column('availability_pct', sa.Numeric(precision=5, scale=2), nullable=False, server_default='100.00')
    )


def downgrade() -> None:
    op.drop_column('data_quality_logs', 'availability_pct')
    op.drop_column('data_quality_logs', 'outlier_cleanliness_pct')
    op.drop_column('data_quality_logs', 'consistency_pct')
    op.drop_column('data_quality_logs', 'validity_pct')