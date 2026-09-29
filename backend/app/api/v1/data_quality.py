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


@router.post(
    "/recalculate",
    summary="Recalculate DQ Score Over Full Normalized Dataset",
    description="Recomputes the 8-factor DQ score across all existing normalized observations and persists a new log entry.",
)
def recalculate_dq_score(db: Session = Depends(get_db)):
    from app.models.observation import NormalizedIndexObservation, ParsedAirfareObservation
    from app.services.normalization import NormalizedRecord
    from app.services.data_quality import calculate_data_quality_score
    from app.core.enums import NormalizationStatus, AvailabilityStatus, OutlierStatus, CommercialDedupStatus
    from decimal import Decimal

    norm_rows = db.query(NormalizedIndexObservation).all()
    if not norm_rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No normalized observations found.")

    records = []
    for row in norm_rows:
        rec = NormalizedRecord(
            observation_id=str(row.observation_id),
            route_id=row.route_id,
            booking_horizon=row.booking_horizon,
            comparable_index_fare=Decimal(str(row.comparable_index_fare)),
            raw_displayed_total=Decimal(str(row.raw_displayed_total)),
            component_sum=Decimal(str(row.component_sum)) if row.component_sum else None,
            normalization_status=NormalizationStatus(row.normalization_status),
            normalization_reason=row.normalization_reason or "",
            availability_status=AvailabilityStatus(row.availability_status),
            valid_for_index=row.valid_for_index,
            is_imputed=row.is_imputed,
            imputation_method=row.imputation_method,
        )
        rec.outlier_status = OutlierStatus(row.outlier_status)
        rec.commercial_dedup_status = CommercialDedupStatus(row.commercial_dedup_status)
        records.append(rec)

    log = calculate_data_quality_score(records, db=db)
    db.commit()
    return {
        "status": "recalculated",
        "total_records": len(records),
        "dq_score": str(log.dq_score),
        "completeness_pct": str(log.completeness_pct),
        "synthetic_share": str(log.synthetic_share),
        "calculation_date": str(log.calculation_date),
    }
