import pytest
from datetime import date, timedelta
from decimal import Decimal
import math

from app.models.observation import NormalizedIndexObservation, ParsedAirfareObservation, RawAirfareObservation
from app.models.route import Route
from app.models.index import ElementaryRouteIndex, NationalAggregateIndex
from app.services.index_engine import IndexEngine
from app.core.enums import DataMode

@pytest.fixture
def setup_routes(db_session):
    r1 = Route(
        route_id="DEL-BOM", origin_iata="DEL", destination_iata="BOM",
        corridor_region="METRO", dgca_volume_weight=Decimal("0.4"), is_active=True
    )
    r2 = Route(
        route_id="BOM-BLR", origin_iata="BOM", destination_iata="BLR",
        corridor_region="METRO", dgca_volume_weight=Decimal("0.6"), is_active=True
    )
    db_session.add_all([r1, r2])
    db_session.commit()
    return {"DEL-BOM": r1, "BOM-BLR": r2}

def _create_obs(db_session, route_id, flight_number, collection_date, index_fare, horizon="T+1", is_valid=True, data_mode=DataMode.LIVE):
    raw = RawAirfareObservation(
        collection_timestamp=collection_date,
        source_name="Fixture", source_url="", raw_displayed_price_text="0",
        collection_mode=data_mode
    )
    db_session.add(raw)
    db_session.commit()
    
    parsed = ParsedAirfareObservation(
        raw_id=raw.raw_id, origin=route_id.split("-")[0], destination=route_id.split("-")[1],
        airline_code=flight_number[:2], flight_number=flight_number, travel_date=collection_date,
        booking_window_days=int(horizon.replace("T+", "")), raw_total_fare=index_fare
    )
    db_session.add(parsed)
    db_session.commit()
    
    norm = NormalizedIndexObservation(
        observation_id=parsed.observation_id, route_id=route_id, booking_horizon=horizon,
        comparable_index_fare=index_fare, valid_for_index=is_valid
    )
    db_session.add(norm)
    db_session.commit()
    return norm

def test_identical_fares_yields_index_100(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("5000"))
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("5000"))
    
    engine = IndexEngine(db_session)
    results = engine.calculate_elementary_route_indices(d_calc, d_base)
    
    assert len(results) == 1
    assert results[0].index_value == Decimal("100.0000")

def test_all_fares_double_yields_index_200(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("5000"))
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("10000"))
    
    engine = IndexEngine(db_session)
    results = engine.calculate_elementary_route_indices(d_calc, d_base)
    
    assert results[0].index_value == Decimal("200.0000")

def test_mixed_price_relatives_geometric_mean(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("1000"))
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("1000")) # relative: 1.0
    
    _create_obs(db_session, "DEL-BOM", "6E-200", d_base, Decimal("1000"))
    _create_obs(db_session, "DEL-BOM", "6E-200", d_calc, Decimal("1100")) # relative: 1.1
    
    _create_obs(db_session, "DEL-BOM", "6E-300", d_base, Decimal("1000"))
    _create_obs(db_session, "DEL-BOM", "6E-300", d_calc, Decimal("1200")) # relative: 1.2
    
    engine = IndexEngine(db_session)
    results = engine.calculate_elementary_route_indices(d_calc, d_base)
    
    expected_jevons = math.exp((math.log(1.0) + math.log(1.1) + math.log(1.2)) / 3) * 100
    assert float(results[0].index_value) == pytest.approx(expected_jevons, 0.001)

def test_invalid_observation_excluded(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("5000"))
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("10000"))
    # Invalid observation
    _create_obs(db_session, "DEL-BOM", "6E-200", d_calc, Decimal("20000"), is_valid=False)
    
    engine = IndexEngine(db_session)
    results = engine.calculate_elementary_route_indices(d_calc, d_base)
    
    assert results[0].index_value == Decimal("200.0000")
    assert results[0].observation_count == 1

def test_missing_reference_fare(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("5000"))
    # No base observation for 6E-100
    
    engine = IndexEngine(db_session)
    results = engine.calculate_elementary_route_indices(d_calc, d_base)
    
    # Empty result or observation skipped
    assert len(results) == 0

def test_separate_booking_horizons(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("5000"), horizon="T+1")
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("5500"), horizon="T+1")
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("4000"), horizon="T+7")
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("4800"), horizon="T+7")
    
    engine = IndexEngine(db_session)
    results = engine.calculate_elementary_route_indices(d_calc, d_base)
    
    assert len(results) == 2
    r_t1 = next(r for r in results if r.booking_horizon == "T+1")
    r_t7 = next(r for r in results if r.booking_horizon == "T+7")
    
    assert r_t1.index_value == Decimal("110.0000")
    assert r_t7.index_value == Decimal("120.0000")

def test_national_aggregation_young_and_jevons(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    # Route A = 110
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("1000"))
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("1100"))
    
    # Route B = 120
    _create_obs(db_session, "BOM-BLR", "AI-100", d_base, Decimal("1000"))
    _create_obs(db_session, "BOM-BLR", "AI-100", d_calc, Decimal("1200"))
    
    engine = IndexEngine(db_session)
    engine.calculate_elementary_route_indices(d_calc, d_base)
    
    young_results = engine.calculate_national_aggregate_indices(d_calc, d_base, methodology="YOUNG_MODIFIED_LASPEYRES")
    jevons_results = engine.calculate_national_aggregate_indices(d_calc, d_base, methodology="JEVONS")
    
    # Young: 0.4 * 110 + 0.6 * 120 = 44 + 72 = 116
    assert young_results[0].index_value == Decimal("116.0000")
    
    # Jevons: exp(0.4*log(110) + 0.6*log(120))
    expected_jevons = math.exp(0.4 * math.log(110) + 0.6 * math.log(120))
    assert float(jevons_results[0].index_value) == pytest.approx(expected_jevons, 0.001)

def test_data_mode_isolation(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    # Live data
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("1000"), data_mode=DataMode.LIVE)
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("1100"), data_mode=DataMode.LIVE)
    
    # Synthetic data
    _create_obs(db_session, "DEL-BOM", "6E-200", d_base, Decimal("1000"), data_mode=DataMode.SYNTHETIC)
    _create_obs(db_session, "DEL-BOM", "6E-200", d_calc, Decimal("2000"), data_mode=DataMode.SYNTHETIC)
    
    engine = IndexEngine(db_session)
    live_results = engine.calculate_elementary_route_indices(d_calc, d_base, data_mode=DataMode.LIVE)
    syn_results = engine.calculate_elementary_route_indices(d_calc, d_base, data_mode=DataMode.SYNTHETIC)
    
    assert live_results[0].index_value == Decimal("110.0000")
    assert syn_results[0].index_value == Decimal("200.0000")

def test_zero_negative_fare_protection(db_session, setup_routes):
    d_base = date(2026, 1, 1)
    d_calc = date(2026, 1, 2)
    
    _create_obs(db_session, "DEL-BOM", "6E-100", d_base, Decimal("1000"))
    _create_obs(db_session, "DEL-BOM", "6E-100", d_calc, Decimal("0")) # Zero fare, should be skipped
    
    _create_obs(db_session, "DEL-BOM", "6E-200", d_base, Decimal("1000"))
    _create_obs(db_session, "DEL-BOM", "6E-200", d_calc, Decimal("-500")) # Negative fare, should be skipped
    
    _create_obs(db_session, "DEL-BOM", "6E-300", d_base, Decimal("1000"))
    _create_obs(db_session, "DEL-BOM", "6E-300", d_calc, Decimal("1500")) # Valid
    
    engine = IndexEngine(db_session)
    results = engine.calculate_elementary_route_indices(d_calc, d_base)
    
    assert len(results) == 1
    assert results[0].index_value == Decimal("150.0000")
    assert results[0].observation_count == 1

