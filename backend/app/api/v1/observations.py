"""
Observation API Endpoints -- SIH26056 Phase B
"""
from datetime import date
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.observation import ParsedAirfareObservation
from app.schemas.observation import ParsedObservationOut, ObservationListResponse

router = APIRouter(prefix="/observations", tags=["Observations"])


@router.get(
    "",
    response_model=ObservationListResponse,
    summary="List Parsed Airfare Observations",
    description="Retrieve paginated list of parsed airfare observations with optional filters.",
)
def list_observations(
    origin: Optional[str] = Query(None, min_length=3, max_length=3, description="Origin IATA (e.g. DEL)"),
    destination: Optional[str] = Query(None, min_length=3, max_length=3, description="Destination IATA (e.g. BOM)"),
    airline_code: Optional[str] = Query(None, min_length=2, max_length=2, description="Airline IATA (e.g. 6E)"),
    travel_date: Optional[date] = Query(None, description="Flight travel date (YYYY-MM-DD)"),
    booking_window_days: Optional[int] = Query(None, description="Booking horizon advance days (1, 7, 15, 30, 45)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Page size limit"),
    db: Session = Depends(get_db),
):
    query = db.query(ParsedAirfareObservation)

    if origin:
        query = query.filter(ParsedAirfareObservation.origin == origin.upper())
    if destination:
        query = query.filter(ParsedAirfareObservation.destination == destination.upper())
    if airline_code:
        query = query.filter(ParsedAirfareObservation.airline_code == airline_code.upper())
    if travel_date:
        query = query.filter(ParsedAirfareObservation.travel_date == travel_date)
    if booking_window_days:
        query = query.filter(ParsedAirfareObservation.booking_window_days == booking_window_days)

    total = query.count()
    offset = (page - 1) * page_size
    results = query.order_by(ParsedAirfareObservation.created_at.desc()).offset(offset).limit(page_size).all()

    return ObservationListResponse(
        total=total,
        page=page,
        page_size=page_size,
        results=results
    )


@router.get(
    "/{observation_id}",
    response_model=ParsedObservationOut,
    summary="Get Specific Observation by ID",
    description="Retrieve full details of a parsed airfare observation by UUID.",
)
def get_observation(observation_id: UUID, db: Session = Depends(get_db)):
    obs = db.get(ParsedAirfareObservation, observation_id)
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation with ID {observation_id} not found."
        )
    return obs
