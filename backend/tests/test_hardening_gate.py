"""
Phase B Hardening Gate Regression Tests -- SIH26056
Verifies:
1. Ingestion-level duplicate detection (channel/source separated)
2. YQ surcharge persistence in ParsedAirfareObservation & API schemas
3. Transaction savepoint isolation (Record A, B valid, C invalid, D valid -> A, B, D saved)
4. Booking window relationship (travel_date - collection_date) & 5 valid horizons
5. Data-mode isolation (Synthetic never converted to Live)
6. Cryptographic provenance & deterministic SHA-256
7. Source health state transitions (HEALTHY, DEGRADED, UNAVAILABLE)
"""
import pytest
from datetime import date, time, datetime, timezone
from decimal import Decimal
from unittest.mock import MagicMock

from app.core.enums import DataMode, SourceHealthStatus
from app.models.observation import RawAirfareObservation, ParsedAirfareObservation
from app.models.log import ProvenanceAuditTrail
from app.models.source_health import SourceHealth
from app.scrapers.base import BaseScraperAdapter, RawObservationRecord
from app.scrapers.fixture_adapter import FixtureAdapter
from app.services.ingestion import run_ingestion
from app.services.parser import parse_record, ParseError


class MockBatchAdapter(BaseScraperAdapter):
    """Custom mock adapter for testing exact batch record sequences."""
    def __init__(self, name: str, mode: DataMode, records: list[RawObservationRecord]):
        self._name = name
        self._mode = mode
        self._records = records

    @property
    def name(self) -> str:
        return self._name

    @property
    def mode(self) -> DataMode:
        return self._mode

    def collect(self) -> list[RawObservationRecord]:
        return self._records


def _create_sample_record(
    source_name="fixture_historical",
    mode=DataMode.HISTORICAL,
    origin="DEL",
    dest="BOM",
    airline="6E",
    flight_no="6E101",
    travel_d=date(2026, 1, 15),
    dep_t=time(6, 0),
    bw=1,
    fare=4500.0,
    yq=230.0,
    fare_family="Saver",
    cabin="ECONOMY",
) -> RawObservationRecord:
    rec = RawObservationRecord(
        source_name=source_name,
        source_url=f"fixture://{origin}-{dest}/{airline}/{travel_d}",
        collection_timestamp=datetime(2026, 1, 14, tzinfo=timezone.utc),
        collection_mode=mode,
        origin=origin,
        destination=dest,
        airline_code=airline,
        airline_name="IndiGo",
        flight_number=flight_no,
        travel_date=travel_d,
        departure_time=dep_t,
        arrival_time=time(8, 15),
        booking_window_days=bw,
        raw_total_fare=fare,
        raw_displayed_price_text=f"INR {fare}",
        base_fare=3800.0,
        udf_fee=250.0,
        asf_fee=30.0,
        gst_tax=190.0,
        yq_surcharge=yq,
        convenience_fee=0.0,
        fare_family=fare_family,
        cabin_class=cabin,
    )
    rec.payload_sha256 = rec.compute_sha256()
    return rec


# ==============================================================================
# 1. IDEMPOTENCY & DUPLICATE DETECTION TESTS
# ==============================================================================

def test_duplicate_detection_same_source_same_observation(db_session):
    rec1 = _create_sample_record()
    adapter1 = MockBatchAdapter("source_a", DataMode.HISTORICAL, [rec1])
    res1 = run_ingestion(adapter1, db_session)
    assert res1.raw_ingested == 1
    assert res1.duplicates_skipped == 0

    # Re-run same record on same source -> DUPLICATE
    res2 = run_ingestion(adapter1, db_session)
    assert res2.raw_ingested == 0
    assert res2.duplicates_skipped == 1


def test_duplicate_detection_different_source_same_flight(db_session):
    rec_src1 = _create_sample_record(source_name="direct_indigo")
    rec_src2 = _create_sample_record(source_name="makemytrip_ota")

    adapter1 = MockBatchAdapter("direct_indigo", DataMode.HISTORICAL, [rec_src1])
    adapter2 = MockBatchAdapter("makemytrip_ota", DataMode.HISTORICAL, [rec_src2])

    res1 = run_ingestion(adapter1, db_session)
    assert res1.raw_ingested == 1

    # Different source reporting same flight must NOT be treated as duplicate at Phase B
    res2 = run_ingestion(adapter2, db_session)
    assert res2.raw_ingested == 1
    assert res2.duplicates_skipped == 0
    assert db_session.query(ParsedAirfareObservation).count() == 2


def test_duplicate_detection_different_fare_family(db_session):
    rec_saver = _create_sample_record(fare_family="Saver")
    rec_flex = _create_sample_record(fare_family="FlexiPlus", fare=5200.0)

    adapter = MockBatchAdapter("source_a", DataMode.HISTORICAL, [rec_saver, rec_flex])
    res = run_ingestion(adapter, db_session)
    assert res.raw_ingested == 2
    assert res.duplicates_skipped == 0
    assert db_session.query(ParsedAirfareObservation).count() == 2


def test_duplicate_detection_different_booking_horizon(db_session):
    rec_t1 = _create_sample_record(bw=1)
    rec_t7 = _create_sample_record(bw=7)

    adapter = MockBatchAdapter("source_a", DataMode.HISTORICAL, [rec_t1, rec_t7])
    res = run_ingestion(adapter, db_session)
    assert res.raw_ingested == 2
    assert res.duplicates_skipped == 0


def test_duplicate_detection_different_collection_mode(db_session):
    rec_hist = _create_sample_record(mode=DataMode.HISTORICAL)
    rec_synth = _create_sample_record(mode=DataMode.SYNTHETIC)

    adapter_hist = MockBatchAdapter("src_test", DataMode.HISTORICAL, [rec_hist])
    adapter_synth = MockBatchAdapter("src_test", DataMode.SYNTHETIC, [rec_synth])

    res1 = run_ingestion(adapter_hist, db_session)
    res2 = run_ingestion(adapter_synth, db_session)

    assert res1.raw_ingested == 1
    assert res2.raw_ingested == 1
    assert res2.duplicates_skipped == 0


# ==============================================================================
# 2. YQ / FUEL SURCHARGE PERSISTENCE TESTS
# ==============================================================================

def test_yq_surcharge_persisted_in_database(db_session):
    rec = _create_sample_record(yq=350.50)
    raw_obs, parsed_obs = parse_record(rec, db_session)
    db_session.flush()

    assert parsed_obs.yq_surcharge is not None
    assert parsed_obs.yq_surcharge == Decimal("350.50")


def test_yq_surcharge_api_serialization(client):
    res = client.post("/api/v1/ingestion/fixtures/synthetic")
    assert res.status_code == 200

    obs_res = client.get("/api/v1/observations?page=1&page_size=1")
    assert obs_res.status_code == 200
    first_item = obs_res.json()["results"][0]
    assert "yq_surcharge" in first_item
    assert float(first_item["yq_surcharge"]) > 0


# ==============================================================================
# 3. TRANSACTION SAVEPOINT HARDENING TESTS (A, B valid, C invalid, D valid)
# ==============================================================================

def test_transaction_savepoint_preserves_valid_records_around_failures(db_session):
    rec_a = _create_sample_record(flight_no="6E101", bw=1)
    rec_b = _create_sample_record(flight_no="6E102", bw=7)
    # rec_c is invalid: booking_window_days=99 violates schema
    rec_c = _create_sample_record(flight_no="6E103", bw=99)
    rec_d = _create_sample_record(flight_no="6E104", bw=15)

    adapter = MockBatchAdapter("partial_source", DataMode.HISTORICAL, [rec_a, rec_b, rec_c, rec_d])
    result = run_ingestion(adapter, db_session)

    assert result.raw_ingested == 3
    assert result.parsed_ingested == 3
    assert result.invalid_rejected == 1
    assert result.duplicates_skipped == 0
    assert len(result.errors) == 1

    # Verify that A, B, and D were committed in the database, and C was not
    flights = [r.flight_number for r in db_session.query(ParsedAirfareObservation).all()]
    assert "6E101" in flights
    assert "6E102" in flights
    assert "6E104" in flights
    assert "6E103" not in flights


# ==============================================================================
# 4. BOOKING WINDOW & HORIZON TESTS
# ==============================================================================

@pytest.mark.parametrize("valid_horizon", [1, 7, 15, 30, 45])
def test_all_five_booking_horizons_accepted(valid_horizon, db_session):
    rec = _create_sample_record(flight_no=f"6E{valid_horizon}", bw=valid_horizon)
    raw_obs, parsed_obs = parse_record(rec, db_session)
    assert parsed_obs.booking_window_days == valid_horizon


def test_fixture_adapter_validates_travel_collection_date_relationship(tmp_path):
    import csv
    csv_file = tmp_path / "test_bw.csv"
    headers = [
        "origin", "destination", "airline_code", "airline_name", "flight_number",
        "travel_date", "departure_time", "arrival_time", "booking_window_days",
        "collection_date", "collection_mode", "source_name", "source_url",
        "raw_displayed_price_text", "raw_total_fare", "base_fare", "udf_fee",
        "asf_fee", "gst_tax", "yq_surcharge", "convenience_fee", "comparable_fare",
        "cabin_class", "fare_family"
    ]
    # Inconsistent row: travel_date 2026-01-15, collection_date 2026-01-14 (diff=1 day), but booking_window_days=7
    inconsistent_row = {
        "origin": "DEL", "destination": "BOM", "airline_code": "6E", "airline_name": "IndiGo",
        "flight_number": "6E101", "travel_date": "2026-01-15", "departure_time": "06:00:00",
        "arrival_time": "08:15:00", "booking_window_days": "7", "collection_date": "2026-01-14",
        "collection_mode": "HISTORICAL", "source_name": "fixture_historical",
        "source_url": "fixture://DEL-BOM/6E", "raw_displayed_price_text": "INR 4500",
        "raw_total_fare": "4500.0", "base_fare": "3800.0", "udf_fee": "250.0",
        "asf_fee": "30.0", "gst_tax": "190.0", "yq_surcharge": "230.0",
        "convenience_fee": "0.0", "comparable_fare": "4500.0",
        "cabin_class": "ECONOMY", "fare_family": "Saver"
    }
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        w.writerow(inconsistent_row)

    adapter = FixtureAdapter(data_mode=DataMode.HISTORICAL, fixture_path=csv_file)
    records = adapter.collect()
    assert len(records) == 0  # Inconsistent row rejected


# ==============================================================================
# 5. DATA-MODE ISOLATION TESTS
# ==============================================================================

def test_synthetic_data_never_silently_converted_to_live(db_session):
    adapter = FixtureAdapter(data_mode=DataMode.SYNTHETIC)
    result = run_ingestion(adapter, db_session)
    assert result.collection_mode == DataMode.SYNTHETIC

    raw_modes = {r.collection_mode for r in db_session.query(RawAirfareObservation).all()}
    assert DataMode.LIVE not in raw_modes
    assert DataMode.SYNTHETIC in raw_modes


# ==============================================================================
# 6. PROVENANCE & DETERMINISTIC SHA-256 TESTS
# ==============================================================================

def test_provenance_sha256_is_strictly_deterministic():
    rec1 = _create_sample_record()
    rec2 = _create_sample_record()

    hash1 = rec1.compute_sha256()
    hash2 = rec2.compute_sha256()

    assert hash1 == hash2
    assert len(hash1) == 64
    # Modifying one key field must alter hash
    rec2.raw_total_fare = 4501.0
    hash3 = rec2.compute_sha256()
    assert hash1 != hash3


def test_provenance_audit_trail_fields(db_session):
    rec = _create_sample_record()
    raw_obs, parsed_obs = parse_record(rec, db_session)
    db_session.flush()

    audit = db_session.query(ProvenanceAuditTrail).filter_by(observation_id=parsed_obs.observation_id).first()
    assert audit is not None
    assert audit.source_portal == "fixture_historical"
    assert audit.parser_version == "v1.0.0"
    assert audit.normalization_version == "pending_phase_c"
    assert audit.payload_sha256_hash == rec.compute_sha256()


# ==============================================================================
# 7. SOURCE HEALTH TRANSITIONS TESTS
# ==============================================================================

def test_source_health_transitions_healthy_degraded_unavailable(db_session):
    # 1. Healthy run
    rec1 = _create_sample_record(flight_no="6E111")
    adapter_ok = MockBatchAdapter("health_src", DataMode.HISTORICAL, [rec1])
    run_ingestion(adapter_ok, db_session)

    sh = db_session.get(SourceHealth, "health_src")
    assert sh.status == "HEALTHY"
    assert sh.consecutive_failures == 0

    # 2. Degraded run (1 valid, 1 invalid)
    rec2 = _create_sample_record(flight_no="6E112")
    rec3_bad = _create_sample_record(flight_no="6E113", bw=88)  # Invalid bw
    adapter_part = MockBatchAdapter("health_src", DataMode.HISTORICAL, [rec2, rec3_bad])
    run_ingestion(adapter_part, db_session)

    sh = db_session.get(SourceHealth, "health_src")
    assert sh.status == "DEGRADED"

    # 3. Unavailable run (exception in collect)
    adapter_broken = MockBatchAdapter("health_src", DataMode.HISTORICAL, [])
    adapter_broken.collect = MagicMock(side_effect=RuntimeError("Network timeout"))
    run_ingestion(adapter_broken, db_session)

    sh = db_session.get(SourceHealth, "health_src")
    assert sh.status == "UNAVAILABLE"
    assert sh.consecutive_failures >= 1
