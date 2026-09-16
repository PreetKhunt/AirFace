"""Alembic migration 004: Add Phase C normalization and classification fields

Revision ID: 004_phase_c_normalization
Revises: 003_add_yq_surcharge
Create Date: 2026-09-15

Phase C: Extend normalized_index_observations with breakdown auditing,
availability status, outlier classification, commercial dedup status, and DQ score.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_phase_c_normalization'
down_revision: Union[str, None] = '003_add_yq_surcharge'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'normalized_index_observations',
        sa.Column('raw_displayed_total', sa.Numeric(precision=10, scale=2), nullable=True)
    )
    op.add_column(
        'normalized_index_observations',
        sa.Column('component_sum', sa.Numeric(precision=10, scale=2), nullable=True)
    )
    op.add_column(
        'normalized_index_observations',
        sa.Column('normalization_status', sa.String(length=32), nullable=False, server_default='VALID')
    )
    op.add_column(
        'normalized_index_observations',
        sa.Column('normalization_reason', sa.String(length=256), nullable=True)
    )
    op.add_column(
        'normalized_index_observations',
        sa.Column('availability_status', sa.String(length=32), nullable=False, server_default='VALID')
    )
    op.add_column(
        'normalized_index_observations',
        sa.Column('outlier_status', sa.String(length=32), nullable=False, server_default='VALID_OBSERVATION')
    )
    op.add_column(
        'normalized_index_observations',
        sa.Column('commercial_dedup_status', sa.String(length=32), nullable=False, server_default='UNIQUE')
    )
    op.add_column(
        'normalized_index_observations',
        sa.Column('dq_score', sa.Numeric(precision=5, scale=2), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('normalized_index_observations', 'dq_score')
    op.drop_column('normalized_index_observations', 'commercial_dedup_status')
    op.drop_column('normalized_index_observations', 'outlier_status')
    op.drop_column('normalized_index_observations', 'availability_status')
    op.drop_column('normalized_index_observations', 'normalization_reason')
    op.drop_column('normalized_index_observations', 'normalization_status')
    op.drop_column('normalized_index_observations', 'component_sum')
    op.drop_column('normalized_index_observations', 'raw_displayed_total')
