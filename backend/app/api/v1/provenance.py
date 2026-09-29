from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.database.session import get_db
from app.models.log import ProvenanceAuditTrail
from app.models.observation import NormalizedIndexObservation, ParsedAirfareObservation, RawAirfareObservation
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["Provenance"])

class ProvenanceOut(BaseModel):
    audit_id: UUID
    observation_id: UUID
    source_portal: str
    source_url: str
    collection_timestamp: datetime
    parser_version: str
    normalization_version: str
    payload_sha256_hash: str
    created_at: datetime
    index_obs_id: Optional[str] = None
    route_id: Optional[str] = None
    booking_horizon: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    airline_code: Optional[str] = None
    fare: Optional[str] = None
    base_fare: Optional[str] = None
    udf_fee: Optional[str] = None
    asf_fee: Optional[str] = None
    gst_tax: Optional[str] = None
    yq_surcharge: Optional[str] = None
    data_mode: Optional[str] = None
    
    model_config = {"from_attributes": True}

@router.get(
    "/provenance/{observation_id}",
    response_model=ProvenanceOut,
    summary="Get Provenance Audit Trail",
    description="Retrieve the cryptographic hash and trace details for a specific observation."
)
def get_provenance(observation_id: UUID, db: Session = Depends(get_db)):
    audit = db.query(ProvenanceAuditTrail).filter(ProvenanceAuditTrail.observation_id == observation_id).first()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provenance audit trail not found for observation {observation_id}"
        )
        
    row = (
        db.query(ProvenanceAuditTrail, NormalizedIndexObservation, ParsedAirfareObservation, RawAirfareObservation)
        .join(ParsedAirfareObservation, ParsedAirfareObservation.observation_id == ProvenanceAuditTrail.observation_id)
        .join(RawAirfareObservation, RawAirfareObservation.raw_id == ParsedAirfareObservation.raw_id)
        .outerjoin(NormalizedIndexObservation, NormalizedIndexObservation.observation_id == ParsedAirfareObservation.observation_id)
        .filter(ProvenanceAuditTrail.audit_id == audit.audit_id)
        .first()
    )
    audit_row, normalized, parsed, raw = row
    result = ProvenanceOut.model_validate(audit_row)
    result.index_obs_id = str(normalized.index_obs_id) if normalized else None
    result.route_id = normalized.route_id if normalized else None
    result.booking_horizon = normalized.booking_horizon if normalized else None
    result.origin = parsed.origin
    result.destination = parsed.destination
    result.airline_code = parsed.airline_code
    result.fare = str(normalized.comparable_index_fare) if normalized else str(parsed.raw_total_fare)
    result.base_fare = str(parsed.base_fare) if parsed.base_fare is not None else None
    result.udf_fee = str(parsed.udf_fee) if parsed.udf_fee is not None else None
    result.asf_fee = str(parsed.asf_fee) if parsed.asf_fee is not None else None
    result.gst_tax = str(parsed.gst_tax) if parsed.gst_tax is not None else None
    result.yq_surcharge = str(parsed.yq_surcharge) if parsed.yq_surcharge is not None else None
    result.data_mode = raw.collection_mode.value
    return result
