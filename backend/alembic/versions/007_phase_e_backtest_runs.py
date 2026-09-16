"""phase_e_backtest_runs

Revision ID: 007_phase_e_backtest_runs
Revises: 006_phase_d_index_engine
Create Date: 2026-09-16 21:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '007_phase_e_backtest_runs'
down_revision: Union[str, None] = '006_phase_d_index_engine'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('backtest_runs',
    sa.Column('backtest_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('end_date', sa.Date(), nullable=False),
    sa.Column('methodology', sa.String(length=32), nullable=False),
    sa.Column('reference_source', sa.String(length=64), nullable=False),
    sa.Column('booking_horizon', sa.String(length=4), nullable=False),
    sa.Column('route_id', sa.String(length=7), nullable=True),
    sa.Column('data_mode', sa.Enum('LIVE', 'HISTORICAL', 'SYNTHETIC', name='datamode'), nullable=False),
    sa.Column('sample_count', sa.Integer(), nullable=False),
    sa.Column('match_count', sa.Integer(), nullable=False),
    sa.Column('coverage_pct', sa.Numeric(precision=5, scale=2), nullable=False),
    sa.Column('mape', sa.Numeric(precision=8, scale=4), nullable=True),
    sa.Column('rmse', sa.Numeric(precision=8, scale=4), nullable=True),
    sa.Column('pearson_r', sa.Numeric(precision=8, scale=4), nullable=True),
    sa.Column('mean_bias_pct', sa.Numeric(precision=8, scale=4), nullable=True),
    sa.Column('directional_accuracy', sa.Numeric(precision=8, scale=4), nullable=True),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('backtest_id')
    )

def downgrade() -> None:
    op.drop_table('backtest_runs')
