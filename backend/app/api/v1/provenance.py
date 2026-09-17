from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.database.session import get_db
from app.models.log import ProvenanceAuditTrail
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
    
    model_config = {"from_attributes": True}

@router.get(
    "/provenance/{observation_id}",
    response_model=ProvenanceOut,
    summary="Get Provenance Audit Trail",
    description="Retrieve the cryptographic hash and trace details for a specific observation."
)
def get_provenance(observation_id: UUID, db: Session = Depends(get_db)):
    audit = db.query(ProvenanceAuditTrail).filter(
        ProvenanceAuditTrail.observation_id == observation_id
    ).first()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provenance audit trail not found for observation {observation_id}"
        )
        
    return audit
