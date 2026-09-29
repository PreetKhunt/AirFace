from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel

from app.database.session import get_db
from app.services.backtest_engine import BacktestEngine
from app.core.enums import DataMode
from app.services.index_engine import get_active_data_mode
from app.schemas.backtest import BacktestRunOut

router = APIRouter()

class BacktestRequest(BaseModel):
    start_date: date
    end_date: date
    reference_data: Dict[date, float]
    reference_source: str
    methodology: str = "JEVONS"
    booking_horizon: str
    route_id: Optional[str] = None
    data_mode: Optional[DataMode] = None

@router.post("/run", response_model=BacktestRunOut)
def run_backtest(
    request: BacktestRequest,
    db: Session = Depends(get_db)
):
    mode = request.data_mode or get_active_data_mode(db)
    if mode is None:
        raise HTTPException(status_code=409, detail="Cannot run validation without persisted airfare observations.")
    engine = BacktestEngine(db)
    
    run = engine.run_backtest(
        start_date=request.start_date,
        end_date=request.end_date,
        reference_data=request.reference_data,
        reference_source=request.reference_source,
        methodology=request.methodology,
        booking_horizon=request.booking_horizon,
        route_id=request.route_id,
        data_mode=mode
    )
    
    return run

@router.get("/results", response_model=List[BacktestRunOut])
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
    mode = data_mode or get_active_data_mode(db)
    if mode:
        query = query.filter(BacktestRun.data_mode == mode)
    else:
        query = query.filter(False)
        
    return query.order_by(BacktestRun.created_at.desc()).all()

@router.get("/results/{backtest_id}", response_model=BacktestRunOut)
def get_backtest_by_id(
    backtest_id: str,
    db: Session = Depends(get_db)
):
    from app.models.backtest import BacktestRun
    run = db.query(BacktestRun).filter(BacktestRun.backtest_id == backtest_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Backtest run not found")
    return run
