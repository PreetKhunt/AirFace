import uuid
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base

class DataQualityLog(Base):
    """
    Data Quality Logs Table: `data_quality_logs`
    Stores daily Data Quality Score (DQ) breakdowns across 8 operational sub-metrics.
    """
    __tablename__ = "data_quality_logs"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(Date, nullable=False)
    dq_score = Column(Numeric(5, 2), nullable=False)
    
    # 8 Sub-metric components
    completeness_pct = Column(Numeric(5, 2), nullable=False)
    validity_pct = Column(Numeric(5, 2), nullable=False, default=100.0)
    consistency_pct = Column(Numeric(5, 2), nullable=False, default=100.0)
    freshness_score = Column(Numeric(5, 2), nullable=False)
    reliability_pct = Column(Numeric(5, 2), nullable=False)
    dedup_pct = Column(Numeric(5, 2), nullable=False)
    outlier_cleanliness_pct = Column(Numeric(5, 2), nullable=False, default=100.0)
    availability_pct = Column(Numeric(5, 2), nullable=False, default=100.0)
    
    # Secondary tracking rates
    anomaly_rate = Column(Numeric(5, 4), nullable=False)
    imputation_rate = Column(Numeric(5, 4), nullable=False)
    provenance_pct = Column(Numeric(5, 2), nullable=False)
    synthetic_share = Column(Numeric(5, 4), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProvenanceAuditTrail(Base):
    """
    Cryptographic Provenance Audit Trail Table: `provenance_audit_trail`
    Stores target URL, timestamp, parser version, and SHA-256 payload hash for auditability.
    """
    __tablename__ = "provenance_audit_trail"

    audit_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(UUID(as_uuid=True), ForeignKey("parsed_airfare_observations.observation_id", ondelete="CASCADE"), nullable=False)
    source_portal = Column(String(64), nullable=False)
    source_url = Column(String(2048), nullable=False)
    collection_timestamp = Column(DateTime(timezone=True), nullable=False)
    parser_version = Column(String(16), nullable=False, default="v1.0.0")
    normalization_version = Column(String(16), nullable=False, default="v1.0.0")
    payload_sha256_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
