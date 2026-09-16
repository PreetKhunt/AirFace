"""
Phase C Final Gate Regression Tests -- SIH26056
Verifies all four corrections required before Phase D approval:

1. Lower-tail positive fare preservation (fare < lower_fence but > 0)
2. Zero / non-positive fare still classified TECHNICAL_OUTLIER
3. Dynamic completeness target (len(active_routes) * len(booking_windows))
4. Explicit DQ sub-metric persistence (validity_pct, consistency_pct, etc.)
5. Source-priority canonical selection: direct airline preferred over OTA
6. Source-priority policy documented in normalization_reason
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
    VALID_BOOKING_WINDOW_DAYS,
)
from app.models.observation import (
    RawAirfareObservation,
    ParsedAirfareObservation,
    NormalizedIndexObservation,
)
from app.models.log import DataQualityLog
from app.models.route import Route
from app.services.normalization import normalize_parsed_observation
from app.services.deduplication import (
    deduplicate_commercial_records,
    SOURCE_PRIORITY,
    _source_priority_key,
)
from app.services.outlier import classify_outliers
from app.services.data_quality import calculate_data_quality_score, DQWeights


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
    source_name="direct_indigo",
) -> ParsedAirfareObservation:
    obs = ParsedAirfareObservation(
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
    # Attach source_name as attribute for deduplication policy
    obs.source_name = source_name
    return obs


# ============================================================================
# CORRECTION 1: Lower-tail positive fare preservation
# ============================================================================

def test_lower_tail_positive_fare_preserved_for_index():
    """
    Regression: A low but genuine promotional fare (below IQR lower fence, but > 0)
    must NOT become TECHNICAL_OUTLIER. It must remain VALID_OBSERVATION with
    valid_for_index=True.
    """
    # Build a distribution with cluster around 8000, so lower fence > 1000
    # median ~8000, IQR ~500, lower_fence = Q1 - 1.5*IQR ~ 7000
    fares = [7500.0, 8000.0, 8000.0, 8200.0, 8400.0, 8500.0]
    # Add a genuine low flash-sale fare of 1500 (well below lower_fence, but > 0)
    all_fares = fares + [1500.0]
    parsed_list = [
        _make_obs(flight=f"6E{i}", bw=1, raw_total=f, base=f-1000, udf=250, asf=50, gst=400, yq=300)
        for i, f in enumerate(all_fares)
    ]
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]
    outlier_results = classify_outliers(norm_list)

    low_fare_result = next(r for r in outlier_results if r[0].comparable_index_fare == Decimal("1500.00"))
    assert low_fare_result[1] == OutlierStatus.VALID_OBSERVATION, (
        f"Lower-tail positive fare should be VALID_OBSERVATION, got {low_fare_result[1]}"
    )
    assert low_fare_result[0].valid_for_index is True, "Lower-tail positive fare must be valid_for_index=True"


def test_zero_fare_is_technical_outlier():
    """
    Regression: A fare of 0 or negative must always be TECHNICAL_OUTLIER.
    This does NOT change with the lower-tail fix.
    """
    # Build enough fares for the distribution
    fares = [5000.0, 5200.0, 5100.0, 5300.0, 5050.0, 5150.0]
    parsed_list = [
        _make_obs(flight=f"6E{i}", bw=1, raw_total=f, base=f-1000, udf=250, asf=50, gst=400, yq=300)
        for i, f in enumerate(fares)
    ]
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]

    # Manually craft a zero-fare normalized record
    from app.services.normalization import NormalizedRecord
    zero_rec = NormalizedRecord(
        observation_id=str(uuid.uuid4()),
        route_id="DEL-BOM",
        booking_horizon="T+1",
        comparable_index_fare=Decimal("0.00"),
        raw_displayed_total=Decimal("0.00"),
        component_sum=None,
        normalization_status=NormalizationStatus.MISSING_FARE,
        normalization_reason="NON_POSITIVE_RAW_FARE",
        availability_status=AvailabilityStatus.MISSING_FARE,
        valid_for_index=False,
    )
    all_norms = norm_list + [zero_rec]
    outlier_results = classify_outliers(all_norms)

    zero_result = next(r for r in outlier_results if r[0].comparable_index_fare == Decimal("0.00"))
    assert zero_result[1] == OutlierStatus.TECHNICAL_OUTLIER, "Zero fare must remain TECHNICAL_OUTLIER"
    assert zero_result[0].valid_for_index is False


def test_technical_ceiling_still_applied_above_35x():
    """
    Regression: A fare > 3.5 * median must still be TECHNICAL_OUTLIER even
    after the lower-tail fix.
    """
    fares = [5000.0, 5200.0, 5100.0, 5300.0, 5050.0, 5150.0]
    # median ~5125, 3.5x = ~17,937
    extreme = 50000.0
    all_fares = fares + [extreme]
    parsed_list = [
        _make_obs(flight=f"6E{i}", bw=1, raw_total=f, base=f-1000, udf=250, asf=50, gst=400, yq=300)
        for i, f in enumerate(all_fares)
    ]
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]
    outlier_results = classify_outliers(norm_list)

    extreme_result = next(r for r in outlier_results if r[0].comparable_index_fare == Decimal("50000.00"))
    assert extreme_result[1] == OutlierStatus.TECHNICAL_OUTLIER
    assert extreme_result[0].valid_for_index is False


# ============================================================================
# CORRECTION 2: Dynamic completeness target
# ============================================================================

def test_dynamic_completeness_uses_active_routes(db_session):
    """
    Regression: completeness_pct must be computed against active routes in DB,
    not a hardcoded constant of 45.
    """
    # Seed exactly 3 active routes
    for rid, orig, dest in [("DEL-BOM", "DEL", "BOM"), ("DEL-BLR", "DEL", "BLR"), ("BOM-BLR", "BOM", "BLR")]:
        db_session.merge(Route(
            route_id=rid, origin_iata=orig, destination_iata=dest,
            corridor_region="Metro-Metro", dgca_volume_weight=Decimal("0.333333")
        ))
    db_session.commit()

    # target_cells = 3 routes * 5 booking horizons = 15
    # Feed records covering exactly 1 cell
    p = _make_obs(flight="6E999", bw=1, raw_total=5000.0)
    db_session.add(p)
    db_session.commit()
    norm = normalize_parsed_observation(p)

    dq = calculate_data_quality_score([norm], db=db_session)

    unique_cells = 1  # one (route_id, horizon) combination
    target_cells = 3 * len(VALID_BOOKING_WINDOW_DAYS)  # 3 * 5 = 15
    expected_completeness = round((unique_cells / target_cells) * 100.0, 2)

    assert float(dq.completeness_pct) == pytest.approx(expected_completeness, abs=0.1), (
        f"Expected completeness {expected_completeness:.2f} for 1/15 cells, got {dq.completeness_pct}"
    )


# ============================================================================
# CORRECTION 3: Explicit DQ sub-metric persistence
# ============================================================================

def test_dq_log_persists_all_8_sub_metrics(db_session):
    """
    Regression: DataQualityLog must have explicit validity_pct, consistency_pct,
    outlier_cleanliness_pct, and availability_pct columns populated.
    """
    parsed_list = [
        _make_obs(flight=f"6E{i}", bw=1, raw_total=5000.0)
        for i in range(6)
    ]
    for p in parsed_list:
        db_session.add(p)
    db_session.commit()
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]

    dq = calculate_data_quality_score(norm_list, db=db_session)

    # All 8 explicit sub-metrics must be populated and in valid range
    assert hasattr(dq, "validity_pct"), "DataQualityLog must have validity_pct"
    assert hasattr(dq, "consistency_pct"), "DataQualityLog must have consistency_pct"
    assert hasattr(dq, "outlier_cleanliness_pct"), "DataQualityLog must have outlier_cleanliness_pct"
    assert hasattr(dq, "availability_pct"), "DataQualityLog must have availability_pct"

    for attr in ["completeness_pct", "validity_pct", "consistency_pct",
                 "freshness_score", "reliability_pct", "dedup_pct",
                 "outlier_cleanliness_pct", "availability_pct"]:
        val = getattr(dq, attr)
        assert val is not None, f"{attr} must not be None"
        assert Decimal("0.00") <= Decimal(str(val)) <= Decimal("100.00"), (
            f"{attr}={val} out of range [0,100]"
        )


def test_source_reliability_not_proxied_from_valid_count(db_session):
    """
    Regression: When SourceHealth table is empty, reliability_pct must default to 100.0
    (neutral/unmeasured), not use valid_count/total as a fake proxy.
    """
    from app.models.source_health import SourceHealth
    # Ensure SourceHealth is empty
    db_session.query(SourceHealth).delete()
    db_session.commit()

    parsed_list = [
        _make_obs(flight=f"6E{i}", bw=1, raw_total=5000.0)
        for i in range(5)
    ]
    for p in parsed_list:
        db_session.add(p)
    db_session.commit()
    norm_list = [normalize_parsed_observation(p) for p in parsed_list]

    dq = calculate_data_quality_score(norm_list, db=db_session)

    assert float(dq.reliability_pct) == pytest.approx(100.0, abs=0.01), (
        f"reliability_pct must be 100.0 (neutral) when SourceHealth is empty, got {dq.reliability_pct}"
    )


# ============================================================================
# CORRECTION 4: Source-priority canonical selection
# ============================================================================

def test_source_priority_key_direct_over_ota():
    """Source priority: 'direct' sources must rank higher (lower int) than 'ota'."""
    assert _source_priority_key("direct_indigo") < _source_priority_key("makemytrip_ota")
    assert _source_priority_key("direct_airindia") < _source_priority_key("easemytrip_ota")
    assert _source_priority_key("unknown_source") == 99


def test_direct_source_preferred_over_ota_as_canonical():
    """
    When a direct airline and an OTA both observe the same flight,
    the DIRECT source must be selected as PRIMARY_CANONICAL regardless of fare.
    """
    # OTA has LOWER fare (5000) but is OTA; direct has HIGHER fare (5100) but is direct airline
    p_direct = _make_obs(flight="6E200", raw_total=5100.0, base=4100.0, udf=250, asf=50, gst=400, yq=300, source_name="direct_indigo")
    p_ota = _make_obs(flight="6E200", raw_total=5000.0, base=4000.0, udf=250, asf=50, gst=400, yq=300, source_name="makemytrip_ota")

    n_direct = normalize_parsed_observation(p_direct)
    n_ota = normalize_parsed_observation(p_ota)

    results = deduplicate_commercial_records([p_direct, p_ota], [n_direct, n_ota])
    assert len(results) == 2

    primary = next(r for r in results if r[1] == CommercialDedupStatus.PRIMARY_CANONICAL)
    dup = next(r for r in results if r[1] == CommercialDedupStatus.COMMERCIAL_DUPLICATE)

    # Primary must be the direct source record
    assert primary[0].observation_id == str(p_direct.observation_id), (
        "Direct airline source must be PRIMARY_CANONICAL over OTA source"
    )
    assert dup[0].observation_id == str(p_ota.observation_id)
    assert dup[0].valid_for_index is False

    # Policy must be documented in normalization_reason
    assert "DIRECT_PREFERRED_THEN_LOWEST_FARE" in primary[2], (
        "Canonical selection policy must be documented in normalization_reason"
    )
    assert "selected_source=direct_indigo" in primary[2]


def test_ota_preferred_over_unknown_source():
    """When no direct source is present, OTA ranks above unknown sources."""
    p_ota = _make_obs(flight="6E300", raw_total=5000.0, source_name="makemytrip_ota")
    p_unknown = _make_obs(flight="6E300", raw_total=4900.0, source_name="some_aggregator")

    n_ota = normalize_parsed_observation(p_ota)
    n_unknown = normalize_parsed_observation(p_unknown)

    results = deduplicate_commercial_records([p_ota, p_unknown], [n_ota, n_unknown])
    primary = next(r for r in results if r[1] == CommercialDedupStatus.PRIMARY_CANONICAL)

    # OTA (tier 1) should win over unknown (tier 99), even though unknown has lower fare
    assert primary[0].observation_id == str(p_ota.observation_id)


def test_same_tier_lowest_fare_wins():
    """Within the same source tier, the lowest comparable fare is selected."""
    # Both direct sources. Use exact component sums to ensure valid_for_index=True.
    # p1: base=4200+udf=250+asf=50+gst=400+yq=300 = 5200 (matches raw_total=5200)
    p1 = _make_obs(flight="6E400", raw_total=5200.0, base=4200.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0, source_name="direct_indigo")
    # p2: base=3800+udf=250+asf=50+gst=400+yq=300 = 4800 (matches raw_total=4800)
    p2 = _make_obs(flight="6E400", raw_total=4800.0, base=3800.0, udf=250.0, asf=50.0, gst=400.0, yq=300.0, source_name="direct_airindia")

    n1 = normalize_parsed_observation(p1)
    n2 = normalize_parsed_observation(p2)

    # Both should be valid_for_index=True (FULL_BREAKDOWN_EXACT)
    assert n1.valid_for_index is True, f"n1 must be valid_for_index=True, got reason: {n1.normalization_reason}"
    assert n2.valid_for_index is True, f"n2 must be valid_for_index=True, got reason: {n2.normalization_reason}"

    results = deduplicate_commercial_records([p1, p2], [n1, n2])
    primary = next(r for r in results if r[1] == CommercialDedupStatus.PRIMARY_CANONICAL)

    # Both direct, so lowest fare (4800) wins
    assert primary[0].comparable_index_fare == Decimal("4800.00"), (
        "Within same source tier, lowest comparable fare should be selected as canonical"
    )