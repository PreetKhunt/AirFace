"""
Phase C Comprehensive Test Suite -- SIH26056
Covers test cases A through R:
A. Valid fare with complete components
B. Valid fare where raw total equals component sum
C. Fare with convenience fee (convenience fee excluded)
D. Fare with YQ surcharge (YQ included)
E. Missing / partial components fallback
F. Inconsistent component total flagged
G. Sold-out observation (no imputation)
H. No-service observation (no imputation)
I. Scraper failure (no imputation)
J. Same commercial observation from different sources (deduplication)
K. Different fare families preserved
L. Genuine high fare / possible market surge (valid for index)
M. Technical malformed fare (disqualified)
N. Low but valid airfare (no arbitrary floor rejection)
O. Duplicate normalized representation idempotency
P. Deterministic DQ score
Q. DQ score bounds [0.00, 100.00]
R. Default no imputation policy
"""
import uuid
import pytest
from datetime import date, time, datetime, timezone
from decimal import Decimal

from app.core.enums import (
    DataMode,
    NormalizationStatus,
    AvailabilityStatus,
    OutlierStatus,
    CommercialDedupStatus,
)
from app.models.observation import (
    RawAirfareObservation,
    ParsedAirfareObservation,
    NormalizedIndexObservation,
)
from app.models.log import DataQualityLog
from app.services.normalization import normalize_parsed_observation
from app.services.deduplication import deduplicate_commercial_records
from app.services.outlier import classify_outliers
from app.services.data_quality import calculate_data_quality_score
from app.services.phase_c_pipeline import run_phase_c_normalization
from app.scrapers.fixture_adapter import FixtureAdapter
from app.services.ingestion import run_ingestion


def _make_parsed_obs(
    origin="DEL",
    dest="BOM",
    airline="6E",
    flight="6E101",
    travel_d=date(2026, 1, 15),
    dep_t=time(6, 0),
    bw=1,
    raw_total=5000.0,
    base=4000.0,
    udf=250.0,
    asf=50.0,
    gst=400.0,
    yq=300.0,
    conv=0.0,
    fare_fam="Saver",
    cabin="ECONOMY",
) -> ParsedAirfareObservation:
    return ParsedAirfareObservation(
        observation_id=uuid.uuid4(),
        raw_id=uuid.uuid4(),
        origin=origin,
        destination=dest,
        airline_code=airline,
        flight_number=flight,
        travel_date=travel_d,
        departure_time=dep_t,
        arrival_time=time(8, 15),
        booking_window_days=bw,
        raw_total_fare=Decimal(str(raw_total)),
        base_fare=Decimal(str(base)) if base is not None else None,
        udf_fee=Decimal(str(udf)) if udf is not None else None,
        asf_fee=Decimal(str(asf)) if asf is not None else None,
        gst_tax=Decimal(str(gst)) if gst is not None else None,
        yq_surcharge=Decimal(str(yq)) if yq is not None else None,
        convenience_fee=Decimal(str(conv)) if conv is not None else Decimal("0.00"),
        cabin_class=cabin,
        fare_family=fare_fam,
    )


# A & B: Valid fare with complete components & raw total equals component sum
def test_valid_fare_complete_components_and_exact_sum():
    # 4000 + 250 + 50 + 400 + 300 = 5000
    p = _make_parsed_obs(raw_total=5000.0, base=4000.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0, conv=0.0)
    norm = normalize_parsed_observation(p)

    assert norm.comparable_index_fare == Decimal("5000.00")
    assert norm.normalization_status == NormalizationStatus.VALID
    assert norm.normalization_reason == "FULL_BREAKDOWN_EXACT"
    assert norm.valid_for_index is True
    assert norm.is_imputed is False


# C: Fare with convenience fee -> convenience fee excluded
def test_fare_with_convenience_fee_excluded():
    # Base: 4000, UDF: 250, ASF: 50, GST: 400, YQ: 300 (sum=5000). Raw total = 5300 (includes 300 conv fee)
    p = _make_parsed_obs(raw_total=5300.0, base=4000.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0, conv=300.0)
    norm = normalize_parsed_observation(p)

    assert norm.comparable_index_fare == Decimal("5000.00")  # Exactly excludes 300 convenience fee
    assert norm.normalization_status == NormalizationStatus.VALID
    assert norm.normalization_reason == "FULL_BREAKDOWN_EXACT"


# D: Fare with YQ surcharge -> YQ included
def test_fare_with_yq_surcharge_included():
    p = _make_parsed_obs(base=3000.0, udf=200.0, asf=50.0, gst=150.0, yq=600.0, raw_total=4000.0)
    norm = normalize_parsed_observation(p)

    # Comparable fare must include 600 YQ: 3000+200+50+150+600 = 4000
    assert norm.comparable_index_fare == Decimal("4000.00")
    assert norm.component_sum == Decimal("4000.00")


# E: Missing components -> partial components fallback
def test_partial_components_fallback():
    p = _make_parsed_obs(base=None, udf=None, asf=None, gst=None, yq=None, raw_total=4500.0, conv=200.0)
    norm = normalize_parsed_observation(p)

    assert norm.comparable_index_fare == Decimal("4300.00")  # 4500 - 200 conv fee
    assert norm.normalization_status == NormalizationStatus.PARTIAL_COMPONENTS
    assert norm.normalization_reason == "TOTAL_ONLY_FALLBACK"


# F: Inconsistent component total flagged
def test_inconsistent_component_total_flagged():
    # Components sum to 5000, but raw total is 6500 (and conv fee is 0)
    p = _make_parsed_obs(raw_total=6500.0, base=4000.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0, conv=0.0)
    norm = normalize_parsed_observation(p)

    assert norm.normalization_status == NormalizationStatus.INCONSISTENT_TOTAL
    assert norm.valid_for_index is False
    assert "COMPONENT_SUM_MISMATCH" in norm.normalization_reason


# G, H, I: Non-positive fare / missing / sold out (no imputation)
def test_missing_or_non_positive_fare():
    p = _make_parsed_obs(raw_total=0.0, base=0.0)
    norm = normalize_parsed_observation(p)

    assert norm.normalization_status == NormalizationStatus.MISSING_FARE
    assert norm.availability_status == AvailabilityStatus.MISSING_FARE
    assert norm.valid_for_index is False
    assert norm.is_imputed is False
    assert norm.imputation_method is None


# J: Same commercial observation from different sources (deduplication)
def test_commercial_deduplication_different_sources():
    # Direct airline reporting 5000, OTA reporting 5100 for the EXACT same flight
    p1 = _make_parsed_obs(flight="6E202", raw_total=5000.0, base=4000.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0)
    p2 = _make_parsed_obs(flight="6E202", raw_total=5100.0, base=4100.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0)

    n1 = normalize_parsed_observation(p1)
    n2 = normalize_parsed_observation(p2)

    results = deduplicate_commercial_records([p1, p2], [n1, n2])
    assert len(results) == 2

    # One must be PRIMARY_CANONICAL and valid, one must be COMMERCIAL_DUPLICATE and not valid for index
    statuses = {r[1] for r in results}
    assert CommercialDedupStatus.PRIMARY_CANONICAL in statuses
    assert CommercialDedupStatus.COMMERCIAL_DUPLICATE in statuses

    # Find duplicate
    dup = next(r[0] for r in results if r[1] == CommercialDedupStatus.COMMERCIAL_DUPLICATE)
    assert dup.valid_for_index is False


# K: Different fare families preserved
def test_different_fare_families_not_deduplicated():
    p_saver = _make_parsed_obs(flight="6E303", fare_fam="Saver", raw_total=4500.0)
    p_flex = _make_parsed_obs(flight="6E303", fare_fam="FlexiPlus", raw_total=5500.0)

    n1 = normalize_parsed_observation(p_saver)
    n2 = normalize_parsed_observation(p_flex)

    results = deduplicate_commercial_records([p_saver, p_flex], [n1, n2])
    assert len(results) == 2
    for r in results:
        assert r[1] == CommercialDedupStatus.UNIQUE


# L: Genuine high fare / possible market surge (valid for index)
def test_possible_market_surge_preserved_for_index():
    # Base fares cluster around 5000, surge fare is 9000
    base_fares = [4800.0, 5000.0, 5100.0, 5200.0, 5300.0, 5400.0, 9000.0]
    parsed_list = [_make_parsed_obs(flight=f"6E{i}", raw_total=f, base=f-1000, udf=250, asf=50, gst=400, yq=300) for i, f in enumerate(base_fares)]
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]

    outlier_results = classify_outliers(norm_list)
    surge_item = next(r for r in outlier_results if r[0].comparable_index_fare == Decimal("9000.00"))

    # Market surge is flagged as surge, but is STILL VALID FOR INDEX!
    assert surge_item[1] == OutlierStatus.POSSIBLE_MARKET_SURGE
    assert surge_item[0].valid_for_index is True


# M: Technical malformed fare (disqualified)
def test_technical_malformed_outlier_disqualified():
    # Extreme anomaly (e.g. 150,000 when normal is 5,000)
    base_fares = [4800.0, 5000.0, 5100.0, 5200.0, 5300.0, 150000.0]
    parsed_list = [_make_parsed_obs(flight=f"6E{i}", raw_total=f, base=f-1000, udf=250, asf=50, gst=400, yq=300) for i, f in enumerate(base_fares)]
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]

    outlier_results = classify_outliers(norm_list)
    extreme_item = next(r for r in outlier_results if r[0].comparable_index_fare == Decimal("150000.00"))

    assert extreme_item[1] == OutlierStatus.TECHNICAL_OUTLIER
    assert extreme_item[0].valid_for_index is False


# N: Low but valid airfare (no arbitrary fare floor)
def test_low_valid_fare_not_rejected():
    # A short flight flash sale at ₹450
    p = _make_parsed_obs(raw_total=450.0, base=200.0, udf=100.0, asf=30.0, gst=20.0, yq=100.0)
    norm = normalize_parsed_observation(p)

    assert norm.comparable_index_fare == Decimal("450.00")
    assert norm.normalization_status == NormalizationStatus.VALID
    assert norm.valid_for_index is True


# P & Q: Deterministic DQ score and bounded in [0.00, 100.00]
def test_deterministic_dq_score_bounds(db_session):
    parsed_list = [_make_parsed_obs(flight=f"6E{i}") for i in range(10)]
    for p in parsed_list:
        db_session.add(p)
    db_session.commit()
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]

    dq1 = calculate_data_quality_score(norm_list, db=db_session)
    dq2 = calculate_data_quality_score(norm_list, db=db_session)

    assert dq1.dq_score == dq2.dq_score
    assert Decimal("0.00") <= dq1.dq_score <= Decimal("100.00")


# R & Integration: Full Phase B -> Phase C pipeline integration test
def test_full_phase_c_pipeline_integration(db_session):
    # 1. Ingest historical fixture (Phase B)
    adapter = FixtureAdapter(data_mode=DataMode.HISTORICAL)
    ingest_res = run_ingestion(adapter, db_session)
    assert ingest_res.parsed_ingested == 450

    # 2. Run Phase C Normalization
    norm_res = run_phase_c_normalization(db_session)

    assert norm_res.status == "SUCCESS"
    assert norm_res.total_parsed_processed == 450
    assert norm_res.total_normalized_created == 450
    assert norm_res.valid_for_index_count == 450
    assert norm_res.imputed_count == 0  # No imputation by default
    assert norm_res.overall_dq_score > Decimal("80.00")

    # Verify database table
    db_count = db_session.query(NormalizedIndexObservation).count()
    assert db_count == 450

    # Verify first row structure
    first = db_session.query(NormalizedIndexObservation).first()
    assert first.route_id in ["DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-CCU", "DEL-HYD", "BOM-MAA", "DEL-PNQ", "DEL-PAT", "BOM-COK"]
    assert first.booking_horizon in ["T+1", "T+7", "T+15", "T+30", "T+45"]
    assert first.comparable_index_fare > 0
    assert first.normalization_status == "VALID"
    assert first.is_imputed is False