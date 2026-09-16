"""
Pydantic v2 Schemas for Phase C Normalization Endpoints -- SIH26056
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.core.enums import (
    NormalizationStatus,
    AvailabilityStatus,
    OutlierStatus,
    CommercialDedupStatus,
)


class NormalizedObservationOut(BaseModel):
    """Response schema for a single normalized airfare observation."""
    index_obs_id: UUID
    observation_id: UUID
    route_id: str
    booking_horizon: str
    comparable_index_fare: Decimal
    raw_displayed_total: Optional[Decimal] = None
    component_sum: Optional[Decimal] = None
    normalization_status: NormalizationStatus
    normalization_reason: Optional[str] = None
    availability_status: AvailabilityStatus
    outlier_status: OutlierStatus
    commercial_dedup_status: CommercialDedupStatus
    is_imputed: bool = False
    imputation_method: Optional[str] = None
    is_outlier: bool = False
    valid_for_index: bool = True
    dq_score: Optional[Decimal] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class NormalizedObservationListResponse(BaseModel):
    """Paginated response schema for normalized index observations."""
    total: int
    page: int
    page_size: int
    results: list[NormalizedObservationOut]


class PhaseCNormalizationResponse(BaseModel):
    """Summary result of Phase C normalization pipeline execution."""
    total_parsed_processed: int
    total_normalized_created: int
    valid_for_index_count: int
    commercial_duplicates_count: int
    outliers_detected_count: int
    market_surges_count: int
    imputed_count: int
    overall_dq_score: Decimal
    status: str
