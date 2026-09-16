"""
Pydantic v2 Schemas for Observation endpoints -- SIH26056 Phase B
"""
from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.core.enums import DataMode


class RawObservationOut(BaseModel):
    """Response schema for a single raw airfare observation."""
    raw_id: UUID
    collection_timestamp: datetime
    source_name: str
    source_url: str
    raw_displayed_price_text: str
    collection_mode: DataMode
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ParsedObservationOut(BaseModel):
    """Response schema for a single parsed airfare observation."""
    observation_id: UUID
    raw_id: UUID
    origin: str
    destination: str
    airline_code: str
    flight_number: str
    travel_date: date
    departure_time: Optional[time] = None
    arrival_time: Optional[time] = None
    booking_window_days: int
    raw_total_fare: Decimal
    base_fare: Optional[Decimal] = None
    udf_fee: Optional[Decimal] = None
    asf_fee: Optional[Decimal] = None
    gst_tax: Optional[Decimal] = None
    yq_surcharge: Optional[Decimal] = None
    convenience_fee: Optional[Decimal] = None
    cabin_class: Optional[str] = None
    fare_family: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ObservationListResponse(BaseModel):
    """Paginated list of parsed observations."""
    total: int
    page: int
    page_size: int
    results: list[ParsedObservationOut]


class IngestionResult(BaseModel):
    """Result of an ingestion operation."""
    source_name: str
    collection_mode: DataMode
    raw_ingested: int
    parsed_ingested: int
    duplicates_skipped: int
    invalid_rejected: int
    errors: list[str] = Field(default_factory=list)
