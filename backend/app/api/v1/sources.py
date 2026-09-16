"""
Sources and Health Monitoring API Endpoints -- SIH26056 Phase B
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.source_health import SourceHealth
from app.schemas.source import SourceHealthOut, SourceListResponse

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.get(
    "",
    response_model=SourceListResponse,
    summary="List All Data Sources and Health Status",
    description="Retrieve operational health status and collection metrics for all configured adapters.",
)
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(SourceHealth).order_by(SourceHealth.source_name.asc()).all()
    return SourceListResponse(
        total=len(sources),
        results=sources
    )


@router.get(
    "/{source_name}/health",
    response_model=SourceHealthOut,
    summary="Get Specific Source Health Status",
    description="Retrieve operational health breakdown, latency, and success metrics for a named adapter.",
)
def get_source_health(source_name: str, db: Session = Depends(get_db)):
    source = db.get(SourceHealth, source_name)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source adapter '{source_name}' not found or has not reported yet."
        )
    return source
