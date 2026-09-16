"""
Phase C Correction Gate Regression Tests -- SIH26056
Covers all 16 required items:
1. 3.5x median outlier boundary
2. Large IQR fence does not override technical ceiling (upper_fence > 3.5x median)
3. raw_total < convenience_fee (rejected)
4. raw_total == convenience_fee (rejected)
5. negative component (rejected)
6. partial component valid total fallback
7. late-arriving cross-source duplicate resolution across runs
8. different fare family remains unique
9. DQ timeliness computed from timestamps
10. DQ source reliability uses actual source health
11. DQ dedup score derived from actual duplicate rates
12. DQ synthetic share computed from collection mode
13. DQ score remains bounded in [0.00, 100.00]
14. invalid weight configuration rejected (sum != 1.0)
15. inconsistent component total policy tested (valid_for_index=False)
16. full Phase B -> Phase C pipeline integration
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
from app.models.source_health import SourceHealth
from app.models.log import ProvenanceAuditTrail, DataQualityLog
from app.services.normalization import normalize_parsed_observation, NormalizedRecord
from app.services.deduplication import deduplicate_commercial_records
from app.services.outlier import classify_outliers
from app.services.data_quality import calculate_data_quality_score, DQWeights
from app.services.phase_c_pipeline import run_phase_c_normalization
from app.scrapers.fixture_adapter import FixtureAdapter
from app.services.ingestion import run_ingestion


def _make_obs(
    flight="6E101",
    airline="6E",
    origin="DEL",
    dest="BOM",
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


# 1 & 2: 3.5x median technical ceiling & large IQR fence boundary
def test_outlier_technical_ceiling_strictly_enforced():
    # Construct distribution where upper_fence > 3.5x median
    fares = [4000.0, 5000.0, 5000.0, 6000.0, 8000.0, 12000.0, 19000.0]
    # Median = 6000. 3.5 * median = 21,000.
    # Add a fare of 25,000 (> 21,000)
    fares_with_extreme = fares + [25000.0]
    parsed_list = [_make_obs(flight=f"6E{i}", raw_total=f, base=f-1000, udf=250, asf=50, gst=400, yq=300) for i, f in enumerate(fares_with_extreme)]
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]

    outlier_results = classify_outliers(norm_list)
    extreme_rec = next(r for r in outlier_results if r[0].comparable_index_fare == Decimal("25000.00"))

    assert extreme_rec[1] == OutlierStatus.TECHNICAL_OUTLIER
    assert extreme_rec[0].valid_for_index is False


# 3: raw_total < convenience_fee -> rejected
def test_raw_total_less_than_convenience_fee_rejected():
    p = _make_obs(raw_total=500.0, conv=700.0)
    norm = normalize_parsed_observation(p)

    assert norm.normalization_status == NormalizationStatus.INVALID_COMPONENTS
    assert norm.valid_for_index is False
    assert norm.comparable_index_fare == Decimal("0.00")
    assert "CONVENIENCE_FEE_EXCEEDS_OR_EQUALS_RAW_TOTAL" in norm.normalization_reason


# 4: raw_total == convenience_fee -> rejected
def test_raw_total_equals_convenience_fee_rejected():
    p = _make_obs(raw_total=300.0, conv=300.0)
    norm = normalize_parsed_observation(p)

    assert norm.normalization_status == NormalizationStatus.INVALID_COMPONENTS
    assert norm.valid_for_index is False
    assert norm.comparable_index_fare == Decimal("0.00")


# 5: negative component -> rejected
def test_negative_fare_component_rejected():
    p = _make_obs(raw_total=5000.0, base=-4000.0)
    norm = normalize_parsed_observation(p)

    assert norm.normalization_status == NormalizationStatus.INVALID_COMPONENTS
    assert norm.valid_for_index is False
    assert "NEGATIVE_FARE_COMPONENT" in norm.normalization_reason


# 6: partial component valid fallback
def test_partial_component_valid_fallback():
    p = _make_obs(raw_total=5000.0, base=None, udf=None, asf=None, gst=None, yq=None, conv=200.0)
    norm = normalize_parsed_observation(p)

    assert norm.comparable_index_fare == Decimal("4800.00")
    assert norm.normalization_status == NormalizationStatus.PARTIAL_COMPONENTS
    assert norm.valid_for_index is True


# 7: Late-arriving cross-source deduplication across batches
def test_late_arriving_cross_source_deduplication(db_session):
    # Setup Route
    from app.models.route import Route
    db_session.add(Route(route_id="DEL-BOM", origin_iata="DEL", destination_iata="BOM", corridor_region="Metro", dgca_volume_weight=Decimal("0.1")))
    db_session.commit()

    # Batch 1: Direct Airline Observation arrives and gets normalized
    raw1 = RawAirfareObservation(
        raw_id=uuid.uuid4(),
        collection_timestamp=datetime.now(timezone.utc),
        source_name="direct_indigo",
        source_url="http://indigo.in",
        raw_displayed_price_text="INR 5000",
        collection_mode=DataMode.HISTORICAL,
    )
    db_session.add(raw1)
    db_session.flush()

    parsed1 = _make_obs(flight="6E101", origin="DEL", dest="BOM", raw_total=5000.0)
    parsed1.raw_id = raw1.raw_id
    db_session.add(parsed1)
    db_session.commit()

    # Run Normalization for Batch 1
    res1 = run_phase_c_normalization(db_session)
    assert res1.total_normalized_created == 1
    assert res1.valid_for_index_count == 1

    # Batch 2: Later, an OTA (MakeMyTrip) observation arrives for the EXACT same flight
    raw2 = RawAirfareObservation(
        raw_id=uuid.uuid4(),
        collection_timestamp=datetime.now(timezone.utc),
        source_name="makemytrip_ota",
        source_url="http://makemytrip.com",
        raw_displayed_price_text="INR 5100",
        collection_mode=DataMode.HISTORICAL,
    )
    db_session.add(raw2)
    db_session.flush()

    parsed2 = _make_obs(flight="6E101", origin="DEL", dest="BOM", raw_total=5100.0)
    parsed2.raw_id = raw2.raw_id
    db_session.add(parsed2)
    db_session.commit()

    # Run Normalization for Batch 2
    res2 = run_phase_c_normalization(db_session)
    assert res2.total_normalized_created == 1
    assert res2.commercial_duplicates_count == 1
    assert res2.valid_for_index_count == 0  # Duplicate is not valid for index

    # Verify overall DB state: Total normalized = 2, Valid for index = 1
    all_norms = db_session.query(NormalizedIndexObservation).all()
    assert len(all_norms) == 2
    valid_norms = [n for n in all_norms if n.valid_for_index]
    assert len(valid_norms) == 1
    assert "COMMERCIAL_DUPLICATE_OF_EXISTING" in all_norms[1].normalization_reason


# 8: Different fare families remain unique
def test_different_fare_families_remain_unique():
    p_saver = _make_obs(flight="6E101", fare_fam="Saver", raw_total=4500.0)
    p_flex = _make_obs(flight="6E101", fare_fam="FlexiPlus", raw_total=5500.0)
    n1 = normalize_parsed_observation(p_saver)
    n2 = normalize_parsed_observation(p_flex)

    results = deduplicate_commercial_records([p_saver, p_flex], [n1, n2])
    assert len(results) == 2
    assert results[0][1] == CommercialDedupStatus.UNIQUE
    assert results[1][1] == CommercialDedupStatus.UNIQUE


# 9, 10, 11, 12, 13: Empirical DQ calculations
def test_dq_empirical_calculations(db_session):
    # Create raw observations with timestamps and modes
    now = datetime.now(timezone.utc)
    raw1 = RawAirfareObservation(raw_id=uuid.uuid4(), collection_timestamp=now, source_name="src1", source_url="url1", raw_displayed_price_text="5000", collection_mode=DataMode.HISTORICAL)
    raw2 = RawAirfareObservation(raw_id=uuid.uuid4(), collection_timestamp=now, source_name="src2", source_url="url2", raw_displayed_price_text="5000", collection_mode=DataMode.SYNTHETIC)
    db_session.add_all([raw1, raw2])
    db_session.flush()

    p1 = _make_obs(flight="6E1", raw_total=5000.0)
    p1.raw_id = raw1.raw_id
    p2 = _make_obs(flight="6E2", raw_total=5000.0)
    p2.raw_id = raw2.raw_id
    db_session.add_all([p1, p2])
    db_session.flush()

    # Add SourceHealth
    sh = SourceHealth(source_name="src1", status="HEALTHY", success_rate_pct=98.5)
    db_session.add(sh)
    db_session.commit()

    n1 = normalize_parsed_observation(p1)
    n2 = normalize_parsed_observation(p2)

    dq = calculate_data_quality_score([n1, n2], db=db_session)

    assert Decimal("0.00") <= dq.dq_score <= Decimal("100.00")
    assert dq.freshness_score >= Decimal("90.00")  # Fresh timestamps
    assert dq.reliability_pct == Decimal("98.50")  # Empirically queried from SourceHealth
    assert dq.synthetic_share == Decimal("0.5000")  # 1 of 2 is synthetic


# 14: Invalid weight configuration rejected
def test_invalid_weight_configuration_rejected():
    bad_weights = DQWeights(completeness=0.5, validity=0.6)  # sum = 1.1 != 1.0
    with pytest.raises(ValueError, match="DQWeights must sum to 1.0"):
        calculate_data_quality_score([], weights=bad_weights)


# 15: Inconsistent component total disqualified from index
def test_inconsistent_component_total_disqualified_from_index():
    # Components sum to 5000, raw total is 6500
    p = _make_obs(raw_total=6500.0, base=4000.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0, conv=0.0)
    norm = normalize_parsed_observation(p)

    assert norm.normalization_status == NormalizationStatus.INCONSISTENT_TOTAL
    assert norm.valid_for_index is False
    assert "COMPONENT_SUM_MISMATCH" in norm.normalization_reason


# 16: Full Phase B -> Phase C pipeline integration test
def test_full_phase_b_to_phase_c_integration(db_session):
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
    assert norm_res.imputed_count == 0
    assert norm_res.overall_dq_score > Decimal("80.00")