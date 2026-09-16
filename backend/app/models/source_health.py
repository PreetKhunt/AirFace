"""
Source Health Model -- SIH26056

Schema deviation note: The frozen DATABASE_SCHEMA.md does not include a
source_health table. This is the smallest architecture-consistent addition
to Phase B's requirement for per-source health tracking.
[DERIVED ENGINEERING REQUIREMENT] -- Phase B source health tracking.
"""
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, func
from app.database.session import Base


class SourceHealth(Base):
    """
    Source Health Table: source_health
    Tracks per-source adapter status, success rate, last collection timestamp.
    Statuses:
        HEALTHY     -- last N collections successful, within SLA
        DEGRADED    -- partial failures or elevated latency
        BLOCKED     -- HTTP 429 / CAPTCHA wall detected
        UNAVAILABLE -- network timeout / connection refused
        DISABLED    -- manually disabled via admin flag
    """
    __tablename__ = "source_health"

    source_name = Column(String(64), primary_key=True)
    status = Column(String(16), nullable=False, default="HEALTHY")
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    last_success_at = Column(DateTime(timezone=True), nullable=True)
    consecutive_failures = Column(Integer, nullable=False, default=0)
    total_attempts = Column(Integer, nullable=False, default=0)
    total_successes = Column(Integer, nullable=False, default=0)
    success_rate_pct = Column(Float, nullable=True)
    avg_latency_ms = Column(Float, nullable=True)
    is_enabled = Column(Boolean, nullable=False, default=True)
    status_detail = Column(Text, nullable=True)
    adapter_type = Column(String(16), nullable=False, default="FIXTURE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
