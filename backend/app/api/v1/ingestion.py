"""
Ingestion API Endpoints -- SIH26056 Phase B
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.enums import DataMode
from app.scrapers.fixture_adapter import FixtureAdapter, ValidationFixtureAdapter
from app.services.ingestion import run_ingestion
from app.schemas.observation import IngestionResult

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])


@router.post(
    "/fixtures/historical",
    response_model=IngestionResult,
    status_code=status.HTTP_200_OK,
    summary="Ingest Historical Fixture Dataset",
    description="Loads 450 historical baseline observations from data/fixtures/historical/airfare_historical.csv",
)
def ingest_historical_fixture(db: Session = Depends(get_db)):
    try:
        adapter = FixtureAdapter(data_mode=DataMode.HISTORICAL)
        result = run_ingestion(adapter, db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Historical fixture ingestion failed: {str(e)}"
        )


@router.post(
    "/fixtures/synthetic",
    response_model=IngestionResult,
    status_code=status.HTTP_200_OK,
    summary="Ingest Synthetic Fixture Dataset",
    description="Loads the synthetic demo observations and base-period rows from the version-controlled fixture.",
)
def ingest_synthetic_fixture(db: Session = Depends(get_db)):
    try:
        adapter = FixtureAdapter(data_mode=DataMode.SYNTHETIC, include_synthetic_base_period=True)
        result = run_ingestion(adapter, db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synthetic fixture ingestion failed: {str(e)}"
        )


@router.post(
    "/fixtures/synthetic-validation",
    response_model=IngestionResult,
    status_code=status.HTTP_200_OK,
    summary="Ingest Deterministic Historical Validation Fixture",
    description="Loads the reproducible DEMO SYNTHETIC BENCHMARK validation observations.",
)
def ingest_historical_validation_fixture(db: Session = Depends(get_db)):
    try:
        result = run_ingestion(ValidationFixtureAdapter(), db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synthetic validation fixture ingestion failed: {str(e)}"
        )
