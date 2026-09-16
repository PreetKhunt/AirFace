"""
Data Quality API Endpoints -- SIH26056 Phase C
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.log import DataQualityLog
from app.schemas.data_quality import DataQualityLogOut, DataQualityLogListResponse

router = APIRouter(prefix="/quality", tags=["Data Quality"])


@router.get(
    "/score",
    response_model=DataQualityLogOut,
    summary="Get Latest Data Quality Score & Breakdown",
    description="Retrieve the latest multi-dimensional Data Quality score across all 8 sub-metrics.",
)
def get_latest_dq_score(db: Session = Depends(get_db)):
    log = db.query(DataQualityLog).order_by(DataQualityLog.created_at.desc()).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Data Quality logs found. Run Phase C normalization first."
        )
    return log


@router.get(
    "/history",
    response_model=DataQualityLogListResponse,
    summary="Get Historical Data Quality Logs",
    description="Retrieve time-series history of Data Quality logs.",
)
def get_dq_history(db: Session = Depends(get_db)):
    logs = db.query(DataQualityLog).order_by(DataQualityLog.calculation_date.desc()).all()
    return DataQualityLogListResponse(
        total=len(logs),
        results=logs
    )
