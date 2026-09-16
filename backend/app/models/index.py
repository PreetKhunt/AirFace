import uuid
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base
from app.core.enums import DataMode

class ElementaryRouteIndex(Base):
    """
    Tier 1 Elementary Route Indices Table: `elementary_route_indices`
    Stores Route x Horizon x Date Index.
    """
    __tablename__ = "elementary_route_indices"

    elementary_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(Date, nullable=False)
    route_id = Column(String(7), ForeignKey("routes.route_id"), nullable=False)
    booking_horizon = Column(String(4), nullable=False)
    methodology = Column(String(32), nullable=False, default="JEVONS")
    data_mode = Column(SQLEnum(DataMode), nullable=False, default=DataMode.LIVE)
    index_value = Column(Numeric(10, 4), nullable=False)
    observation_count = Column(Integer, nullable=False)
    coverage_pct = Column(Numeric(5, 2), nullable=True)
    base_date = Column(Date, nullable=False, default="2026-01-01")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("calculation_date", "route_id", "booking_horizon", "methodology", "data_mode", name="unique_route_horizon_date_methodology"),
    )

class NationalAggregateIndex(Base):
    """
    Tier 2 National Aggregate Indices Table: `national_aggregate_indices`
    Stores National Price Index.
    """
    __tablename__ = "national_aggregate_indices"

    aggregate_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(Date, nullable=False)
    booking_horizon = Column(String(4), nullable=False)
    methodology = Column(String(32), nullable=False, default="JEVONS")
    data_mode = Column(SQLEnum(DataMode), nullable=False, default=DataMode.LIVE)
    index_value = Column(Numeric(10, 4), nullable=False)
    route_count = Column(Integer, nullable=True)
    coverage_pct = Column(Numeric(5, 2), nullable=True)
    daily_change_pct = Column(Numeric(6, 4), nullable=True)
    monthly_change_pct = Column(Numeric(6, 4), nullable=True)
    dq_score = Column(Numeric(5, 2), nullable=False)
    base_date = Column(Date, nullable=False, default="2026-01-01")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("calculation_date", "booking_horizon", "methodology", "data_mode", name="unique_national_horizon_date_methodology"),
    )
