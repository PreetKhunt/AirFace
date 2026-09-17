"""
Normalization API Endpoints -- SIH26056 Phase C
"""
from typing import Optional, Union
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.observation import NormalizedIndexObservation, ParsedAirfareObservation
from app.schemas.normalization import (
    NormalizedObservationOut,
    NormalizedObservationListResponse,
    NormalizedObservationWithParsedOut,
    NormalizedObservationWithParsedListResponse,
    ParsedObservationEmbedded,
    PhaseCNormalizationResponse,
)
from app.services.phase_c_pipeline import run_phase_c_normalization

router = APIRouter(tags=["Normalization"])


@router.post(
    "/normalization/run",
    response_model=PhaseCNormalizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Phase C Normalization Pipeline",
    description="Transforms parsed observations into cleaned, deduplicated, and outlier-classified normalized index observations.",
)
def execute_normalization(db: Session = Depends(get_db)):
    try:
        result = run_phase_c_normalization(db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Normalization pipeline failed: {str(e)}"
        )


@router.get(
    "/normalized-observations",
    summary="List Normalized Index Observations",
    description="Retrieve paginated list of index-ready normalized observations. Use include_parsed=true to embed the parsed fare breakdown.",
)
def list_normalized_observations(
    route_id: Optional[str] = Query(None, description="Route identifier (e.g. DEL-BOM)"),
    booking_horizon: Optional[str] = Query(None, description="Advance booking horizon (T+1, T+7, T+15, T+30, T+45)"),
    valid_for_index: Optional[bool] = Query(None, description="Filter by index eligibility"),
    is_outlier: Optional[bool] = Query(None, description="Filter by outlier flag"),
    normalization_status: Optional[str] = Query(None, description="Filter by normalization status"),
    include_parsed: bool = Query(False, description="Embed parsed fare breakdown in each result"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Page size limit"),
    db: Session = Depends(get_db),
):
    query = db.query(NormalizedIndexObservation)

    if route_id:
        query = query.filter(NormalizedIndexObservation.route_id == route_id.upper())
    if booking_horizon:
        # Normalize horizon query (handles T 1 when + is decoded as space in URL)
        bh_clean = booking_horizon.replace(" ", "+").upper()
        query = query.filter(NormalizedIndexObservation.booking_horizon == bh_clean)
    if valid_for_index is not None:
        query = query.filter(NormalizedIndexObservation.valid_for_index == valid_for_index)
    if is_outlier is not None:
        query = query.filter(NormalizedIndexObservation.is_outlier == is_outlier)
    if normalization_status:
        query = query.filter(NormalizedIndexObservation.normalization_status == normalization_status.upper())

    total = query.count()
    offset = (page - 1) * page_size
    norm_rows = query.order_by(NormalizedIndexObservation.created_at.desc()).offset(offset).limit(page_size).all()

    if include_parsed:
        # Batch-fetch all parsed observations by observation_id to avoid N+1
        obs_ids = [row.observation_id for row in norm_rows]
        parsed_map: dict = {}
        if obs_ids:
            parsed_rows = db.query(ParsedAirfareObservation).filter(
                ParsedAirfareObservation.observation_id.in_(obs_ids)
            ).all()
            parsed_map = {str(p.observation_id): p for p in parsed_rows}

        results_with_parsed = []
        for norm in norm_rows:
            parsed_row = parsed_map.get(str(norm.observation_id))
            parsed_embedded = ParsedObservationEmbedded.model_validate(parsed_row) if parsed_row else None
            item = NormalizedObservationWithParsedOut.model_validate(norm)
            item.parsed = parsed_embedded
            results_with_parsed.append(item)

        return NormalizedObservationWithParsedListResponse(
            total=total,
            page=page,
            page_size=page_size,
            results=results_with_parsed
        )

    return NormalizedObservationListResponse(
        total=total,
        page=page,
        page_size=page_size,
        results=norm_rows
    )


@router.get(
    "/normalized-observations/{index_obs_id}",
    response_model=NormalizedObservationOut,
    summary="Get Specific Normalized Observation by ID",
    description="Retrieve full details and breakdown for a normalized index observation.",
)
def get_normalized_observation(index_obs_id: UUID, db: Session = Depends(get_db)):
    obs = db.get(NormalizedIndexObservation, index_obs_id)
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Normalized observation with ID {index_obs_id} not found."
        )
    return obs
