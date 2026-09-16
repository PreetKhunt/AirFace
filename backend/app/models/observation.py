import uuid
from sqlalchemy import Column, String, Integer, Numeric, Boolean, Date, Time, DateTime, Text, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base
from app.core.enums import DataMode

class RawAirfareObservation(Base):
    """
    Raw Airfare Observations Table: raw_airfare_observations
    Stores unparsed DOM payloads, source URLs, timestamps, and collection mode.
    """
    __tablename__ = "raw_airfare_observations"

    raw_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_timestamp = Column(DateTime(timezone=True), nullable=False)
    source_name = Column(String(64), nullable=False)
    source_url = Column(String(2048), nullable=False)
    raw_html_snippet = Column(Text, nullable=True)
    raw_displayed_price_text = Column(String(128), nullable=False)
    collection_mode = Column(SQLEnum(DataMode), nullable=False, default=DataMode.LIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ParsedAirfareObservation(Base):
    """
    Parsed Airfare Observations Table: parsed_airfare_observations
    Stores structured ticket attributes, base fare, and tax/surcharge component breakdowns.
    Phase B preserves raw and parsed components; Phase C performs index fare normalization.
    """
    __tablename__ = "parsed_airfare_observations"

    observation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    raw_id = Column(UUID(as_uuid=True), ForeignKey("raw_airfare_observations.raw_id", ondelete="CASCADE"), nullable=False)
    origin = Column(String(3), nullable=False)
    destination = Column(String(3), nullable=False)
    airline_code = Column(String(2), nullable=False)
    flight_number = Column(String(16), nullable=False)
    travel_date = Column(Date, nullable=False)
    departure_time = Column(Time, nullable=True)
    arrival_time = Column(Time, nullable=True)
    booking_window_days = Column(Integer, nullable=False)  # 1, 7, 15, 30, 45
    raw_total_fare = Column(Numeric(10, 2), nullable=False)
    base_fare = Column(Numeric(10, 2), nullable=True)
    udf_fee = Column(Numeric(10, 2), nullable=True)
    asf_fee = Column(Numeric(10, 2), nullable=True)
    gst_tax = Column(Numeric(10, 2), nullable=True)
    yq_surcharge = Column(Numeric(10, 2), nullable=True)
    convenience_fee = Column(Numeric(10, 2), default=0.0)
    cabin_class = Column(String(16), default="ECONOMY")
    fare_family = Column(String(64), default="Saver")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NormalizedIndexObservation(Base):
    """
    Normalized Index Observations Table: normalized_index_observations
    Stores cleaned comparable fares (P_comparable) ready for Tier 1 Jevons calculations.
    Owned and populated by Phase C.
    """
    __tablename__ = "normalized_index_observations"

    index_obs_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(UUID(as_uuid=True), ForeignKey("parsed_airfare_observations.observation_id", ondelete="CASCADE"), nullable=False)
    route_id = Column(String(7), ForeignKey("routes.route_id"), nullable=False)
    booking_horizon = Column(String(4), nullable=False)  # 'T+1', 'T+7', etc.
    comparable_index_fare = Column(Numeric(10, 2), nullable=False)
    
    # Components & breakdown auditing
    raw_displayed_total = Column(Numeric(10, 2), nullable=True)
    component_sum = Column(Numeric(10, 2), nullable=True)
    
    # Status & classification
    normalization_status = Column(String(32), nullable=False, default="VALID")
    normalization_reason = Column(String(256), nullable=True)
    availability_status = Column(String(32), nullable=False, default="VALID")
    outlier_status = Column(String(32), nullable=False, default="VALID_OBSERVATION")
    commercial_dedup_status = Column(String(32), nullable=False, default="UNIQUE")
    
    # Imputation flags (Default: False, None)
    is_imputed = Column(Boolean, default=False)
    imputation_method = Column(String(32), nullable=True)
    
    # Validation & index inclusion
    is_outlier = Column(Boolean, default=False)
    valid_for_index = Column(Boolean, default=True)
    
    dq_score = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
