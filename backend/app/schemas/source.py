"""
Pydantic v2 Schemas for Source Health endpoints -- SIH26056 Phase B
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.core.enums import SourceHealthStatus, AdapterType


class SourceHealthOut(BaseModel):
    """Response schema for source health status."""
    source_name: str
    status: SourceHealthStatus
    adapter_type: AdapterType
    last_checked_at: Optional[datetime] = None
    last_success_at: Optional[datetime] = None
    consecutive_failures: int
    total_attempts: int
    total_successes: int
    success_rate_pct: Optional[float] = None
    avg_latency_ms: Optional[float] = None
    is_enabled: bool
    status_detail: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SourceListResponse(BaseModel):
    """List of all tracked sources."""
    total: int
    results: list[SourceHealthOut]
