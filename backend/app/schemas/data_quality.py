"""
Pydantic v2 Schemas for Phase C Data Quality Endpoints -- SIH26056
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class DQScoreBreakdown(BaseModel):
    """Breakdown of individual Data Quality sub-metrics (0.00 to 100.00)."""
    calculation_date: date
    dq_score: Decimal
    completeness_pct: Decimal
    validity_pct: Decimal
    consistency_pct: Decimal
    freshness_score: Decimal
    reliability_pct: Decimal
    dedup_pct: Decimal
    outlier_cleanliness_pct: Decimal
    availability_pct: Decimal
    anomaly_rate: Decimal
    imputation_rate: Decimal
    provenance_pct: Decimal
    synthetic_share: Decimal


class DataQualityLogOut(BaseModel):
    """Response schema for a single data quality log entry."""
    log_id: UUID
    calculation_date: date
    dq_score: Decimal
    completeness_pct: Decimal
    validity_pct: Decimal
    consistency_pct: Decimal
    freshness_score: Decimal
    reliability_pct: Decimal
    dedup_pct: Decimal
    outlier_cleanliness_pct: Decimal
    availability_pct: Decimal
    anomaly_rate: Decimal
    imputation_rate: Decimal
    provenance_pct: Decimal
    synthetic_share: Decimal
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DataQualityLogListResponse(BaseModel):
    """Paginated list of data quality log records."""
    total: int
    results: list[DataQualityLogOut]
