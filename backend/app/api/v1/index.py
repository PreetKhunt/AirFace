from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from app.database.session import get_db
from app.services.index_engine import IndexEngine
from app.core.enums import DataMode, BOOKING_WINDOW_TO_HORIZON
from app.models.observation import NormalizedIndexObservation, ParsedAirfareObservation, RawAirfareObservation
from app.models.route import Route
from app.services.index_engine import get_active_data_mode

router = APIRouter()

@router.post("/calculate")
def calculate_indices(
    calculation_date: date,
    base_date: date,
    data_mode: Optional[DataMode] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Run Phase D Index Engine calculation for a specific date.
    Calculates Tier 1 (Jevons) and Tier 2 (Jevons + Young).
    """
    mode = data_mode or get_active_data_mode(db)
    if mode is None:
        raise HTTPException(status_code=409, detail="Cannot calculate indices without persisted airfare observations.")
    engine = IndexEngine(db)
    
    # Calculate Tier 1
    elementary = engine.calculate_elementary_route_indices(
        calculation_date=calculation_date,
        base_date=base_date,
        data_mode=mode
    )
    
    # Calculate Tier 2
    national_jevons = engine.calculate_national_aggregate_indices(
        calculation_date=calculation_date,
        base_date=base_date,
        methodology="JEVONS",
        data_mode=mode
    )
    
    national_young = engine.calculate_national_aggregate_indices(
        calculation_date=calculation_date,
        base_date=base_date,
        methodology="YOUNG_MODIFIED_LASPEYRES",
        data_mode=mode
    )
    
    return {
        "status": "success",
        "calculation_date": calculation_date,
        "base_date": base_date,
        "data_mode": mode,
        "elementary_indices_calculated": len(elementary),
        "national_indices_calculated": len(national_jevons) + len(national_young)
    }

@router.get("/route")
def get_elementary_indices(
    calculation_date: Optional[date] = None,
    booking_horizon: Optional[str] = None,
    data_mode: Optional[DataMode] = None,
    db: Session = Depends(get_db)
):
    from app.models.index import ElementaryRouteIndex
    query = db.query(ElementaryRouteIndex)
    if calculation_date:
        query = query.filter(ElementaryRouteIndex.calculation_date == calculation_date)
    if booking_horizon:
        query = query.filter(ElementaryRouteIndex.booking_horizon == booking_horizon)
    mode = data_mode or get_active_data_mode(db)
    if mode:
        query = query.filter(ElementaryRouteIndex.data_mode == mode)
    else:
        query = query.filter(False)
        
    return query.order_by(ElementaryRouteIndex.calculation_date.asc()).all()

@router.get("/route/{route_id}")
def get_route_indices(
    route_id: str,
    calculation_date: Optional[date] = None,
    data_mode: Optional[DataMode] = None,
    db: Session = Depends(get_db)
):
    from app.models.index import ElementaryRouteIndex
    query = db.query(ElementaryRouteIndex).filter(ElementaryRouteIndex.route_id == route_id)
    if calculation_date:
        query = query.filter(ElementaryRouteIndex.calculation_date == calculation_date)
    mode = data_mode or get_active_data_mode(db)
    if mode:
        query = query.filter(ElementaryRouteIndex.data_mode == mode)
    else:
        query = query.filter(False)
    return query.order_by(ElementaryRouteIndex.calculation_date.asc()).all()

@router.get("/national")
def get_national_indices(
    calculation_date: Optional[date] = None,
    methodology: Optional[str] = "JEVONS",
    data_mode: Optional[DataMode] = None,
    db: Session = Depends(get_db)
):
    from app.models.index import NationalAggregateIndex
    query = db.query(NationalAggregateIndex).filter(NationalAggregateIndex.methodology == methodology)
    if calculation_date:
        query = query.filter(NationalAggregateIndex.calculation_date == calculation_date)
    mode = data_mode or get_active_data_mode(db)
    if mode:
        query = query.filter(NationalAggregateIndex.data_mode == mode)
    else:
        query = query.filter(False)
    return query.order_by(NationalAggregateIndex.calculation_date.asc()).all()

@router.get("/national/{booking_horizon}")
def get_national_indices_by_horizon(
    booking_horizon: str,
    calculation_date: Optional[date] = None,
    methodology: Optional[str] = "JEVONS",
    data_mode: Optional[DataMode] = None,
    db: Session = Depends(get_db)
):
    from app.models.index import NationalAggregateIndex
    query = db.query(NationalAggregateIndex).filter(
        NationalAggregateIndex.booking_horizon == booking_horizon,
        NationalAggregateIndex.methodology == methodology
    )
    if calculation_date:
        query = query.filter(NationalAggregateIndex.calculation_date == calculation_date)
    mode = data_mode or get_active_data_mode(db)
    if mode:
        query = query.filter(NationalAggregateIndex.data_mode == mode)
    else:
        query = query.filter(False)
    return query.order_by(NationalAggregateIndex.calculation_date.asc()).all()


@router.get("/horizons")
def get_horizon_summary(db: Session = Depends(get_db)):
    from app.models.index import ElementaryRouteIndex, NationalAggregateIndex

    mode = get_active_data_mode(db)
    summary = []
    for _, horizon in sorted(BOOKING_WINDOW_TO_HORIZON.items()):
        observations = (
            db.query(func.count(NormalizedIndexObservation.index_obs_id))
            .join(ParsedAirfareObservation, ParsedAirfareObservation.observation_id == NormalizedIndexObservation.observation_id)
            .join(RawAirfareObservation, RawAirfareObservation.raw_id == ParsedAirfareObservation.raw_id)
            .filter(NormalizedIndexObservation.booking_horizon == horizon)
        )
        elementary = db.query(ElementaryRouteIndex).filter(ElementaryRouteIndex.booking_horizon == horizon)
        national = db.query(NationalAggregateIndex).filter(
            NationalAggregateIndex.booking_horizon == horizon,
            NationalAggregateIndex.methodology == "JEVONS",
        )
        if mode:
            observations = observations.filter(RawAirfareObservation.collection_mode == mode)
            elementary = elementary.filter(ElementaryRouteIndex.data_mode == mode)
            national = national.filter(NationalAggregateIndex.data_mode == mode)
        else:
            observations = observations.filter(False)
            elementary = elementary.filter(False)
            national = national.filter(False)

        observation_count = observations.scalar() or 0
        index_observation_count = elementary.count()
        latest_national = national.order_by(NationalAggregateIndex.calculation_date.desc()).first()
        latest_elementary = elementary.order_by(ElementaryRouteIndex.calculation_date.desc()).first()
        latest_date = latest_national.calculation_date if latest_national else (
            latest_elementary.calculation_date if latest_elementary else None
        )
        route_query = db.query(func.count(func.distinct(ElementaryRouteIndex.route_id))).filter(
            ElementaryRouteIndex.booking_horizon == horizon,
            ElementaryRouteIndex.calculation_date == latest_date,
        ) if latest_date else None
        if route_query is not None and mode:
            route_query = route_query.filter(ElementaryRouteIndex.data_mode == mode)
        route_count = route_query.scalar() if route_query is not None else 0

        date_bounds = elementary.with_entities(
            func.min(ElementaryRouteIndex.calculation_date),
            func.max(ElementaryRouteIndex.calculation_date),
        ).first()
        if latest_national:
            availability_state = "AVAILABLE"
            reason = None
        elif not observation_count:
            availability_state = "DATA_NOT_AVAILABLE"
            reason = f"No normalized observations exist for {horizon} in the active dataset."
        elif not index_observation_count:
            availability_state = "DATA_NOT_AVAILABLE"
            reason = f"No elementary index observations exist for {horizon} in the active dataset."
        else:
            availability_state = "DATA_NOT_AVAILABLE"
            reason = f"No national aggregate exists for {horizon} in the active dataset."

        summary.append({
            "horizon": horizon,
            "data_mode": mode.value if mode else None,
            "observation_count": observation_count,
            "route_count": route_count or 0,
            "index_observation_count": index_observation_count,
            "coverage_pct": str(latest_national.coverage_pct) if latest_national else None,
            "date_range": {
                "start": date_bounds[0].isoformat() if date_bounds and date_bounds[0] else None,
                "end": date_bounds[1].isoformat() if date_bounds and date_bounds[1] else None,
            },
            "availability_state": availability_state,
            "reason": reason,
        })
    return {"data_mode": mode.value if mode else None, "horizons": summary}


@router.get("/weights")
def get_route_weights(db: Session = Depends(get_db)):
    routes = db.query(Route).filter(Route.is_active == True).order_by(Route.route_id.asc()).all()
    total_weight = sum(float(route.dgca_volume_weight) for route in routes)
    return {
        "total_weight": total_weight,
        "routes": [
            {
                "route_id": route.route_id,
                "corridor_region": route.corridor_region,
                "passenger_volume": route.dgca_passenger_volume,
                "reference_weight": str(route.dgca_volume_weight),
                "normalized_weight_pct": (
                    str(float(route.dgca_volume_weight) / total_weight * 100) if total_weight else None
                ),
            }
            for route in routes
        ],
    }
