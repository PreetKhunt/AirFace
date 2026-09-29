import pytest
from pathlib import Path
from app.core.enums import DataMode
from app.scrapers.base import BaseScraperAdapter, RawObservationRecord
from app.scrapers.fixture_adapter import FixtureAdapter
from app.scrapers.indigo_adapter import IndiGoAdapter


def test_fixture_adapter_historical_loading():
    adapter = FixtureAdapter(data_mode=DataMode.HISTORICAL)
    assert adapter.name == "fixture_historical"
    assert adapter.mode == DataMode.HISTORICAL
    assert adapter.is_enabled() is True

    records = adapter.collect()
    assert len(records) == 450
    
    first = records[0]
    assert isinstance(first, RawObservationRecord)
    assert first.origin in ["DEL", "BOM"]
    assert first.booking_window_days in [1, 7, 15, 30, 45]
    assert first.raw_total_fare > 0
    assert first.collection_mode == DataMode.HISTORICAL
    assert first.payload_sha256 is not None
    assert len(first.payload_sha256) == 64


def test_fixture_adapter_synthetic_loading():
    adapter = FixtureAdapter(data_mode=DataMode.SYNTHETIC)
    assert adapter.name == "fixture_synthetic"
    assert adapter.mode == DataMode.SYNTHETIC

    records = adapter.collect()
    assert len(records) == 90
    for r in records:
        assert r.collection_mode == DataMode.SYNTHETIC
        assert r.payload_sha256 is not None


def test_synthetic_seed_adapter_adds_base_period_observations():
    adapter = FixtureAdapter(data_mode=DataMode.SYNTHETIC, include_synthetic_base_period=True)
    records = adapter.collect()
    base_records = [record for record in records if "synthetic-base" in record.source_url]

    assert len(records) == 162
    assert len(base_records) == 72
    assert all(record.collection_mode == DataMode.SYNTHETIC for record in base_records)
    assert all((record.travel_date - record.collection_timestamp.date()).days == record.booking_window_days for record in base_records)


def test_fixture_adapter_rejects_live_mode():
    with pytest.raises(ValueError, match="FixtureAdapter cannot operate in LIVE mode"):
        FixtureAdapter(data_mode=DataMode.LIVE)


def test_indigo_adapter_shell_safety():
    adapter = IndiGoAdapter(rate_limit_seconds=3.0, scraper_enabled=False)
    assert adapter.name == "indigo_live"
    assert adapter.mode == DataMode.LIVE
    assert adapter.is_enabled() is False

    # Shell returns empty list safely without network requests
    records = adapter.collect()
    assert records == []


def test_indigo_adapter_enforces_rate_limit_minimum():
    with pytest.raises(ValueError, match="rate_limit_seconds must be >= 2.0"):
        IndiGoAdapter(rate_limit_seconds=1.0)
