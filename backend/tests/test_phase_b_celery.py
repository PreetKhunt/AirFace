from unittest.mock import patch, MagicMock
from app.tasks.ingestion_tasks import ingest_fixture_task, collect_live_source_task
from app.schemas.observation import IngestionResult
from app.core.enums import DataMode


@patch("app.tasks.ingestion_tasks.run_ingestion")
def test_ingest_fixture_celery_task(mock_run_ingestion):
    mock_run_ingestion.return_value = IngestionResult(
        source_name="fixture_historical",
        collection_mode=DataMode.HISTORICAL,
        raw_ingested=450,
        parsed_ingested=450,
        duplicates_skipped=0,
        invalid_rejected=0,
        errors=[],
    )
    result = ingest_fixture_task("historical")
    assert result["source_name"] == "fixture_historical"
    assert result["raw_ingested"] == 450


@patch("app.tasks.ingestion_tasks.run_ingestion")
def test_collect_live_source_celery_task(mock_run_ingestion):
    mock_run_ingestion.return_value = IngestionResult(
        source_name="indigo_live",
        collection_mode=DataMode.LIVE,
        raw_ingested=0,
        parsed_ingested=0,
        duplicates_skipped=0,
        invalid_rejected=0,
        errors=[],
    )
    result = collect_live_source_task("indigo_live")
    assert result["source_name"] == "indigo_live"
    assert result["raw_ingested"] == 0
