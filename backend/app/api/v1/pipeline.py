from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.observation import RawAirfareObservation
from app.models.observation import ParsedAirfareObservation, NormalizedIndexObservation
from app.scrapers.fixture_adapter import FixtureAdapter
from app.services.ingestion import run_ingestion
from app.services.phase_c_pipeline import run_phase_c_normalization
from app.services.index_engine import IndexEngine, get_active_data_mode
from app.core.enums import DataMode
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(tags=["Pipeline"])


@router.get("/pipeline/status")
def get_pipeline_status(db: Session = Depends(get_db)):
    mode = get_active_data_mode(db)
    if not mode:
        return {
            "data_mode": None,
            "counts": {"raw": 0, "parsed": 0, "normalized": 0, "dq": 0, "index_ready": 0, "airlines": 0, "routes": 0},
        }

    parsed = db.query(func.count(ParsedAirfareObservation.observation_id)).join(
        RawAirfareObservation, RawAirfareObservation.raw_id == ParsedAirfareObservation.raw_id
    ).filter(RawAirfareObservation.collection_mode == mode)
    normalized = db.query(NormalizedIndexObservation).join(
        ParsedAirfareObservation, ParsedAirfareObservation.observation_id == NormalizedIndexObservation.observation_id
    ).join(
        RawAirfareObservation, RawAirfareObservation.raw_id == ParsedAirfareObservation.raw_id
    ).filter(RawAirfareObservation.collection_mode == mode)

    return {
        "data_mode": mode.value,
        "counts": {
            "raw": db.query(func.count(RawAirfareObservation.raw_id)).filter(RawAirfareObservation.collection_mode == mode).scalar() or 0,
            "parsed": parsed.scalar() or 0,
            "normalized": normalized.count(),
            "dq": normalized.filter(NormalizedIndexObservation.dq_score.is_not(None)).count(),
            "index_ready": normalized.filter(NormalizedIndexObservation.valid_for_index == True).count(),
            "airlines": parsed.with_entities(func.count(func.distinct(ParsedAirfareObservation.airline_code))).scalar() or 0,
            "routes": normalized.with_entities(func.count(func.distinct(NormalizedIndexObservation.route_id))).scalar() or 0,
        },
    }

class PipelineRunResponse(BaseModel):
    status: str
    ingestion: Dict[str, Any]
    normalization: Dict[str, Any]
    index: Dict[str, Any]

@router.post(
    "/pipeline/run",
    response_model=PipelineRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Full Sequential Pipeline",
    description="Runs Ingestion -> Normalization -> Indexing sequentially."
)
def execute_pipeline(db: Session = Depends(get_db)):
    try:
        results = {"ingestion": {}, "normalization": {}, "index": {}}

        # Phase B: Ingestion
        # We will use FixtureAdapter with historical data for the demo
        adapter = FixtureAdapter(data_mode=DataMode.HISTORICAL)
        ingest_result = run_ingestion(adapter, db)
        results["ingestion"] = ingest_result.model_dump()

        # Phase C: Normalization
        norm_result = run_phase_c_normalization(db)
        results["normalization"] = norm_result.model_dump()

        # Phase D: Indexing
        # We need to run indexing for all target dates that have valid observations
        # Let's find distinct collection dates
        dates_query = db.query(func.date(RawAirfareObservation.collection_timestamp)).distinct().all()
        target_dates = [d[0] for d in dates_query if d[0]]

        if not target_dates:
            return PipelineRunResponse(
                status="SUCCESS",
                ingestion=results["ingestion"],
                normalization=results["normalization"],
                index={"status": "NO_DATES_TO_INDEX"}
            )
        
        target_dates.sort()
        base_date = target_dates[0]  # Oldest date is base date

        engine = IndexEngine(db)
        elementary_count = 0
        national_count = 0

        for calc_date in target_dates:
            # Tier 1 Jevons
            elem_indices = engine.calculate_elementary_route_indices(
                calculation_date=calc_date,
                base_date=base_date,
                methodology="JEVONS",
                data_mode=DataMode.HISTORICAL
            )
            elementary_count += len(elem_indices)

            # Tier 2 Young/Modified Laspeyres
            nat_indices = engine.calculate_national_aggregate_indices(
                calculation_date=calc_date,
                base_date=base_date,
                methodology="YOUNG_MODIFIED_LASPEYRES",
                data_mode=DataMode.HISTORICAL
            )
            national_count += len(nat_indices)

        results["index"] = {
            "status": "SUCCESS",
            "base_date": str(base_date),
            "dates_processed": len(target_dates),
            "elementary_indices_generated": elementary_count,
            "national_indices_generated": national_count
        }

        return PipelineRunResponse(
            status="SUCCESS",
            ingestion=results["ingestion"],
            normalization=results["normalization"],
            index=results["index"]
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution failed: {str(e)}"
        )
