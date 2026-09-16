"""Alembic migration 002: Add source_health table

Revision ID: 002_source_health
Revises: 001_initial_schema
Create Date: 2026-09-15

Schema deviation from frozen DATABASE_SCHEMA.md:
  [DERIVED ENGINEERING REQUIREMENT] -- The frozen schema does not include
  a source_health table. This addition is required by Phase B for per-source
  adapter health tracking. It is the smallest possible addition consistent
  with the existing architecture. Deviation is documented in PHASE_B_REPORT.md.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_source_health'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'source_health',
        sa.Column('source_name', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='HEALTHY'),
        sa.Column('last_checked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_success_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('consecutive_failures', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_successes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_rate_pct', sa.Float(), nullable=True),
        sa.Column('avg_latency_ms', sa.Float(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('status_detail', sa.Text(), nullable=True),
        sa.Column('adapter_type', sa.String(length=16), nullable=False, server_default='FIXTURE'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('source_name'),
        sa.CheckConstraint(
            "status IN ('HEALTHY','DEGRADED','BLOCKED','UNAVAILABLE','DISABLED')",
            name='ck_source_health_status'
        ),
    )


def downgrade() -> None:
    op.drop_table('source_health')
