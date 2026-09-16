from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel

from app.database.session import get_db
from app.services.backtest_engine import BacktestEngine
from app.core.enums import DataMode

router = APIRouter()

class BacktestRequest(BaseModel):
    start_date: date
    end_date: date
    reference_data: Dict[date, float]
    reference_source: str
    methodology: str = "JEVONS"
    booking_horizon: str
    route_id: Optional[str] = None
    data_mode: DataMode = DataMode.LIVE

@router.post("/run")
def run_backtest(
    request: BacktestRequest,
    db: Session = Depends(get_db)
):
    engine = BacktestEngine(db)
    
    run = engine.run_backtest(
        start_date=request.start_date,
        end_date=request.end_date,
        reference_data=request.reference_data,
        reference_source=request.reference_source,
        methodology=request.methodology,
        booking_horizon=request.booking_horizon,
        route_id=request.route_id,
        data_mode=request.data_mode
    )
    
    return run

@router.get("/results")
def get_backtest_results(
    db: Session = Depends(get_db),
    start_date: Optional[date] = None,
    methodology: Optional[str] = None,
    data_mode: Optional[DataMode] = None
):
    from app.models.backtest import BacktestRun
    query = db.query(BacktestRun)
    if start_date:
        query = query.filter(BacktestRun.start_date >= start_date)
    if methodology:
        query = query.filter(BacktestRun.methodology == methodology)
    if data_mode:
        query = query.filter(BacktestRun.data_mode == data_mode)
        
    return query.all()

@router.get("/results/{backtest_id}")
def get_backtest_by_id(
    backtest_id: str,
    db: Session = Depends(get_db)
):
    from app.models.backtest import BacktestRun
    run = db.query(BacktestRun).filter(BacktestRun.backtest_id == backtest_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Backtest run not found")
    return run
