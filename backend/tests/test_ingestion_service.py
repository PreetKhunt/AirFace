import pytest
from app.core.enums import DataMode
from app.models.observation import RawAirfareObservation, ParsedAirfareObservation
from app.models.source_health import SourceHealth
from app.scrapers.fixture_adapter import FixtureAdapter
from app.services.ingestion import run_ingestion


def test_full_historical_ingestion_flow(db_session):
    adapter = FixtureAdapter(data_mode=DataMode.HISTORICAL)
    result = run_ingestion(adapter, db_session)

    assert result.source_name == "fixture_historical"
    assert result.collection_mode == DataMode.HISTORICAL
    assert result.raw_ingested == 450
    assert result.parsed_ingested == 450
    assert result.duplicates_skipped == 0
    assert result.invalid_rejected == 0
    assert len(result.errors) == 0

    # Verify database counts
    raw_count = db_session.query(RawAirfareObservation).count()
    parsed_count = db_session.query(ParsedAirfareObservation).count()
    assert raw_count == 450
    assert parsed_count == 450

    # Verify source health was updated
    sh = db_session.get(SourceHealth, "fixture_historical")
    assert sh is not None
    assert sh.status == "HEALTHY"
    assert sh.total_attempts == 1
    assert sh.total_successes == 1
    assert sh.success_rate_pct == 100.0


def test_idempotency_duplicate_skipping(db_session):
    adapter = FixtureAdapter(data_mode=DataMode.HISTORICAL)
    
    # First run
    res1 = run_ingestion(adapter, db_session)
    assert res1.raw_ingested == 450
    assert res1.duplicates_skipped == 0

    # Second run (idempotency check)
    res2 = run_ingestion(adapter, db_session)
    assert res2.raw_ingested == 0
    assert res2.parsed_ingested == 0
    assert res2.duplicates_skipped == 450
    assert res2.invalid_rejected == 0

    # Database count must still be exactly 450
    assert db_session.query(ParsedAirfareObservation).count() == 450


def test_synthetic_ingestion_data_mode_isolation(db_session):
    adapter = FixtureAdapter(data_mode=DataMode.SYNTHETIC)
    result = run_ingestion(adapter, db_session)

    assert result.raw_ingested == 90
    assert result.collection_mode == DataMode.SYNTHETIC

    # Verify collection_mode is preserved in DB
    raws = db_session.query(RawAirfareObservation).all()
    assert len(raws) == 90
    for r in raws:
        assert r.collection_mode == DataMode.SYNTHETIC
