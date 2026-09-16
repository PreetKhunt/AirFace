from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database.session import get_db
from app.services.index_engine import IndexEngine
from app.core.enums import DataMode

router = APIRouter()

@router.post("/calculate")
def calculate_indices(
    calculation_date: date,
    base_date: date,
    data_mode: DataMode = Query(DataMode.LIVE),
    db: Session = Depends(get_db)
):
    """
    Run Phase D Index Engine calculation for a specific date.
    Calculates Tier 1 (Jevons) and Tier 2 (Jevons + Young).
    """
    engine = IndexEngine(db)
    
    # Calculate Tier 1
    elementary = engine.calculate_elementary_route_indices(
        calculation_date=calculation_date,
        base_date=base_date,
        data_mode=data_mode
    )
    
    # Calculate Tier 2
    national_jevons = engine.calculate_national_aggregate_indices(
        calculation_date=calculation_date,
        base_date=base_date,
        methodology="JEVONS",
        data_mode=data_mode
    )
    
    national_young = engine.calculate_national_aggregate_indices(
        calculation_date=calculation_date,
        base_date=base_date,
        methodology="YOUNG_MODIFIED_LASPEYRES",
        data_mode=data_mode
    )
    
    return {
        "status": "success",
        "calculation_date": calculation_date,
        "base_date": base_date,
        "data_mode": data_mode,
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
    if data_mode:
        query = query.filter(ElementaryRouteIndex.data_mode == data_mode)
        
    return query.all()

@router.get("/route/{route_id}")
def get_route_indices(
    route_id: str,
    calculation_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    from app.models.index import ElementaryRouteIndex
    query = db.query(ElementaryRouteIndex).filter(ElementaryRouteIndex.route_id == route_id)
    if calculation_date:
        query = query.filter(ElementaryRouteIndex.calculation_date == calculation_date)
    return query.all()

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
    if data_mode:
        query = query.filter(NationalAggregateIndex.data_mode == data_mode)
    return query.all()

@router.get("/national/{booking_horizon}")
def get_national_indices_by_horizon(
    booking_horizon: str,
    calculation_date: Optional[date] = None,
    methodology: Optional[str] = "JEVONS",
    db: Session = Depends(get_db)
):
    from app.models.index import NationalAggregateIndex
    query = db.query(NationalAggregateIndex).filter(
        NationalAggregateIndex.booking_horizon == booking_horizon,
        NationalAggregateIndex.methodology == methodology
    )
    if calculation_date:
        query = query.filter(NationalAggregateIndex.calculation_date == calculation_date)
    return query.all()
