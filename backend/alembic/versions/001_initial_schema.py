"""Initial Schema Migration for SIH26056 Core Tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-15 19:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. routes
    op.create_table(
        'routes',
        sa.Column('route_id', sa.String(length=7), nullable=False),
        sa.Column('origin_iata', sa.String(length=3), nullable=False),
        sa.Column('destination_iata', sa.String(length=3), nullable=False),
        sa.Column('corridor_region', sa.String(length=32), nullable=False),
        sa.Column('dgca_passenger_volume', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('dgca_volume_weight', sa.Numeric(precision=8, scale=6), nullable=False, server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('route_id')
    )

    # 2. raw_airfare_observations
    op.create_table(
        'raw_airfare_observations',
        sa.Column('raw_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('collection_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('source_name', sa.String(length=64), nullable=False),
        sa.Column('source_url', sa.String(length=2048), nullable=False),
        sa.Column('raw_html_snippet', sa.Text(), nullable=True),
        sa.Column('raw_displayed_price_text', sa.String(length=128), nullable=False),
        sa.Column('collection_mode', sa.Enum('LIVE', 'HISTORICAL', 'SYNTHETIC', name='datamode'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('raw_id')
    )

    # 3. parsed_airfare_observations
    op.create_table(
        'parsed_airfare_observations',
        sa.Column('observation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('raw_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('origin', sa.String(length=3), nullable=False),
        sa.Column('destination', sa.String(length=3), nullable=False),
        sa.Column('airline_code', sa.String(length=2), nullable=False),
        sa.Column('flight_number', sa.String(length=16), nullable=False),
        sa.Column('travel_date', sa.Date(), nullable=False),
        sa.Column('departure_time', sa.Time(), nullable=True),
        sa.Column('arrival_time', sa.Time(), nullable=True),
        sa.Column('booking_window_days', sa.Integer(), nullable=False),
        sa.Column('raw_total_fare', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('base_fare', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('udf_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('asf_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('gst_tax', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('convenience_fee', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=True),
        sa.Column('cabin_class', sa.String(length=16), server_default='ECONOMY', nullable=True),
        sa.Column('fare_family', sa.String(length=64), server_default='Saver', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['raw_id'], ['raw_airfare_observations.raw_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('observation_id')
    )

    # 4. normalized_index_observations
    op.create_table(
        'normalized_index_observations',
        sa.Column('index_obs_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('observation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('route_id', sa.String(length=7), nullable=False),
        sa.Column('booking_horizon', sa.String(length=4), nullable=False),
        sa.Column('comparable_index_fare', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('is_imputed', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('imputation_method', sa.String(length=32), nullable=True),
        sa.Column('is_outlier', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('valid_for_index', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['observation_id'], ['parsed_airfare_observations.observation_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['route_id'], ['routes.route_id']),
        sa.PrimaryKeyConstraint('index_obs_id')
    )

    # 5. elementary_route_indices
    op.create_table(
        'elementary_route_indices',
        sa.Column('elementary_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('calculation_date', sa.Date(), nullable=False),
        sa.Column('route_id', sa.String(length=7), nullable=False),
        sa.Column('booking_horizon', sa.String(length=4), nullable=False),
        sa.Column('jevons_index_value', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('observation_count', sa.Integer(), nullable=False),
        sa.Column('base_date', sa.Date(), server_default='2026-01-01', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['route_id'], ['routes.route_id']),
        sa.PrimaryKeyConstraint('elementary_id'),
        sa.UniqueConstraint('calculation_date', 'route_id', 'booking_horizon', name='unique_route_horizon_date')
    )

    # 6. national_aggregate_indices
    op.create_table(
        'national_aggregate_indices',
        sa.Column('aggregate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('calculation_date', sa.Date(), nullable=False),
        sa.Column('booking_horizon', sa.String(length=4), nullable=False),
        sa.Column('national_index_value', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('daily_change_pct', sa.Numeric(precision=6, scale=4), nullable=True),
        sa.Column('monthly_change_pct', sa.Numeric(precision=6, scale=4), nullable=True),
        sa.Column('dq_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('base_date', sa.Date(), server_default='2026-01-01', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('aggregate_id'),
        sa.UniqueConstraint('calculation_date', 'booking_horizon', name='unique_national_horizon_date')
    )

    # 7. data_quality_logs
    op.create_table(
        'data_quality_logs',
        sa.Column('log_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('calculation_date', sa.Date(), nullable=False),
        sa.Column('dq_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('completeness_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('freshness_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('reliability_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('dedup_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('anomaly_rate', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('imputation_rate', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('provenance_pct', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('synthetic_share', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('log_id')
    )

    # 8. provenance_audit_trail
    op.create_table(
        'provenance_audit_trail',
        sa.Column('audit_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('observation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_portal', sa.String(length=64), nullable=False),
        sa.Column('source_url', sa.String(length=2048), nullable=False),
        sa.Column('collection_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('parser_version', sa.String(length=16), server_default='v1.0.0', nullable=False),
        sa.Column('normalization_version', sa.String(length=16), server_default='v1.0.0', nullable=False),
        sa.Column('payload_sha256_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['observation_id'], ['parsed_airfare_observations.observation_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('audit_id')
    )

def downgrade() -> None:
    op.drop_table('provenance_audit_trail')
    op.drop_table('data_quality_logs')
    op.drop_table('national_aggregate_indices')
    op.drop_table('elementary_route_indices')
    op.drop_table('normalized_index_observations')
    op.drop_table('parsed_airfare_observations')
    op.drop_table('raw_airfare_observations')
    op.drop_table('routes')
    op.execute('DROP TYPE IF EXISTS datamode;')
