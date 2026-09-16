"""phase_d_index_engine

Revision ID: 006_phase_d_index_engine
Revises: 005_phase_c_dq_components
Create Date: 2026-09-16 21:46:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '006_phase_d_index_engine'
down_revision: Union[str, None] = '005_phase_c_dq_components'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Upgrade elementary_route_indices
    op.add_column('elementary_route_indices', sa.Column('methodology', sa.String(length=32), nullable=False, server_default='JEVONS'))
    op.add_column('elementary_route_indices', sa.Column('data_mode', sa.Enum('LIVE', 'HISTORICAL', 'SYNTHETIC', name='datamode'), nullable=False, server_default='LIVE'))
    op.add_column('elementary_route_indices', sa.Column('index_value', sa.Numeric(precision=10, scale=4), nullable=True))
    op.add_column('elementary_route_indices', sa.Column('coverage_pct', sa.Numeric(precision=5, scale=2), nullable=True))
    
    # Migrate data from jevons_index_value to index_value
    op.execute("UPDATE elementary_route_indices SET index_value = jevons_index_value")
    op.alter_column('elementary_route_indices', 'index_value', nullable=False)
    
    op.drop_constraint('unique_route_horizon_date', 'elementary_route_indices', type_='unique')
    op.create_unique_constraint('unique_route_horizon_date_methodology', 'elementary_route_indices', ['calculation_date', 'route_id', 'booking_horizon', 'methodology', 'data_mode'])
    op.drop_column('elementary_route_indices', 'jevons_index_value')

    # Upgrade national_aggregate_indices
    op.add_column('national_aggregate_indices', sa.Column('methodology', sa.String(length=32), nullable=False, server_default='JEVONS'))
    op.add_column('national_aggregate_indices', sa.Column('data_mode', sa.Enum('LIVE', 'HISTORICAL', 'SYNTHETIC', name='datamode'), nullable=False, server_default='LIVE'))
    op.add_column('national_aggregate_indices', sa.Column('index_value', sa.Numeric(precision=10, scale=4), nullable=True))
    op.add_column('national_aggregate_indices', sa.Column('route_count', sa.Integer(), nullable=True))
    op.add_column('national_aggregate_indices', sa.Column('coverage_pct', sa.Numeric(precision=5, scale=2), nullable=True))
    
    op.execute("UPDATE national_aggregate_indices SET index_value = national_index_value")
    op.alter_column('national_aggregate_indices', 'index_value', nullable=False)
    
    op.drop_constraint('unique_national_horizon_date', 'national_aggregate_indices', type_='unique')
    op.create_unique_constraint('unique_national_horizon_date_methodology', 'national_aggregate_indices', ['calculation_date', 'booking_horizon', 'methodology', 'data_mode'])
    op.drop_column('national_aggregate_indices', 'national_index_value')

def downgrade() -> None:
    # Downgrade national_aggregate_indices
    op.add_column('national_aggregate_indices', sa.Column('national_index_value', sa.Numeric(precision=10, scale=4), nullable=True))
    op.execute("UPDATE national_aggregate_indices SET national_index_value = index_value")
    op.alter_column('national_aggregate_indices', 'national_index_value', nullable=False)
    
    op.drop_constraint('unique_national_horizon_date_methodology', 'national_aggregate_indices', type_='unique')
    op.create_unique_constraint('unique_national_horizon_date', 'national_aggregate_indices', ['calculation_date', 'booking_horizon'])
    
    op.drop_column('national_aggregate_indices', 'coverage_pct')
    op.drop_column('national_aggregate_indices', 'route_count')
    op.drop_column('national_aggregate_indices', 'index_value')
    op.drop_column('national_aggregate_indices', 'data_mode')
    op.drop_column('national_aggregate_indices', 'methodology')

    # Downgrade elementary_route_indices
    op.add_column('elementary_route_indices', sa.Column('jevons_index_value', sa.Numeric(precision=10, scale=4), nullable=True))
    op.execute("UPDATE elementary_route_indices SET jevons_index_value = index_value")
    op.alter_column('elementary_route_indices', 'jevons_index_value', nullable=False)
    
    op.drop_constraint('unique_route_horizon_date_methodology', 'elementary_route_indices', type_='unique')
    op.create_unique_constraint('unique_route_horizon_date', 'elementary_route_indices', ['calculation_date', 'route_id', 'booking_horizon'])
    
    op.drop_column('elementary_route_indices', 'coverage_pct')
    op.drop_column('elementary_route_indices', 'index_value')
    op.drop_column('elementary_route_indices', 'data_mode')
    op.drop_column('elementary_route_indices', 'methodology')
