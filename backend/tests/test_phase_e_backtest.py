import pytest
from datetime import date, timedelta
from decimal import Decimal
import math

from app.models.index import ElementaryRouteIndex, NationalAggregateIndex
from app.services.backtest_engine import BacktestEngine
from app.core.enums import DataMode

def _create_index(db_session, d, val, route_id=None, methodology="JEVONS", horizon="T+1", data_mode=DataMode.LIVE):
    if route_id:
        idx = ElementaryRouteIndex(
            calculation_date=d, route_id=route_id, booking_horizon=horizon,
            methodology=methodology, data_mode=data_mode, base_date=d,
            index_value=Decimal(str(val)), observation_count=10, coverage_pct=Decimal("100")
        )
    else:
        idx = NationalAggregateIndex(
            calculation_date=d, booking_horizon=horizon,
            methodology=methodology, data_mode=data_mode, base_date=d,
            index_value=Decimal(str(val)), dq_score=Decimal("100"), route_count=5, coverage_pct=Decimal("100")
        )
    db_session.add(idx)
    db_session.commit()

def test_perfect_reference_match(db_session):
    start = date(2026, 1, 1)
    end = date(2026, 1, 30)
    
    ref_data = {}
    for i in range(30):
        d = start + timedelta(days=i)
        val = 100.0 + i
        _create_index(db_session, d, val, route_id="DEL-BOM")
        ref_data[d] = val
        
    engine = BacktestEngine(db_session)
    run = engine.run_backtest(start, end, ref_data, "TestRef", "JEVONS", "T+1", route_id="DEL-BOM")
    
    assert run.mape == Decimal("0.0000")
    assert run.rmse == Decimal("0.0000")
    assert run.mean_bias_pct == Decimal("0.0000")
    assert run.pearson_r == Decimal("1.0000")
    assert run.status == "VALIDATED"

def test_zero_reference_protection(db_session):
    start = date(2026, 1, 1)
    end = date(2026, 1, 2)
    
    _create_index(db_session, start, 100.0, route_id="DEL-BOM")
    _create_index(db_session, end, 100.0, route_id="DEL-BOM")
    
    ref_data = {
        start: 0.0, # Zero ref, should be skipped
        end: 100.0  # Valid
    }
    
    engine = BacktestEngine(db_session)
    run = engine.run_backtest(start, end, ref_data, "TestRef", "JEVONS", "T+1", route_id="DEL-BOM")
    
    assert run.match_count == 1 # Only one valid observation matched
    assert run.sample_count == 2
    assert run.coverage_pct == Decimal("50.00")
    assert run.status == "INSUFFICIENT_DATA" # since n < 3

def test_insufficient_correlation_sample(db_session):
    start = date(2026, 1, 1)
    
    _create_index(db_session, start, 100.0)
    ref_data = {start: 100.0}
    
    engine = BacktestEngine(db_session)
    run = engine.run_backtest(start, start, ref_data, "TestRef", "JEVONS", "T+1")
    
    assert run.pearson_r is None
    assert run.status == "INSUFFICIENT_DATA"

def test_constant_percentage_difference(db_session):
    start = date(2026, 1, 1)
    end = date(2026, 1, 10)
    
    ref_data = {}
    for i in range(10):
        d = start + timedelta(days=i)
        _create_index(db_session, d, 110.0)
        ref_data[d] = 100.0
        
    engine = BacktestEngine(db_session)
    run = engine.run_backtest(start, end, ref_data, "TestRef", "JEVONS", "T+1")
    
    # We are consistently 10% above reference (110 vs 100)
    assert run.mape == Decimal("10.0000")
    assert run.rmse == Decimal("10.0000") # sqrt(100)
    assert run.mean_bias_pct == Decimal("10.0000")
    # Directional accuracy cannot be calculated because delta = 0 for both (constant values)
    assert run.pearson_r is None # Variance is zero

def test_directional_accuracy(db_session):
    start = date(2026, 1, 1)
    end = date(2026, 1, 4)
    
    # Trend: up, down, up
    scraped_vals = [100.0, 110.0, 105.0, 115.0]
    # Trend: up, up (wrong), up
    ref_vals = [100.0, 105.0, 110.0, 120.0]
    
    ref_data = {}
    for i in range(4):
        d = start + timedelta(days=i)
        _create_index(db_session, d, scraped_vals[i])
        ref_data[d] = ref_vals[i]
        
    engine = BacktestEngine(db_session)
    run = engine.run_backtest(start, end, ref_data, "TestRef", "JEVONS", "T+1")
    
    # 3 comparisons.
    # 1: S up, R up -> MATCH
    # 2: S down, R up -> MISMATCH
    # 3: S up, R up -> MATCH
    # DA = 2/3 = 66.666...
    assert float(run.directional_accuracy) == pytest.approx(66.6667, 0.001)

def test_data_mode_isolation(db_session):
    start = date(2026, 1, 1)
    end = date(2026, 1, 5)
    
    ref_data = {}
    for i in range(5):
        d = start + timedelta(days=i)
        _create_index(db_session, d, 100.0, data_mode=DataMode.LIVE)
        _create_index(db_session, d, 200.0, data_mode=DataMode.SYNTHETIC)
        ref_data[d] = 100.0
        
    engine = BacktestEngine(db_session)
    run_live = engine.run_backtest(start, end, ref_data, "Ref", "JEVONS", "T+1", data_mode=DataMode.LIVE)
    run_syn = engine.run_backtest(start, end, ref_data, "Ref", "JEVONS", "T+1", data_mode=DataMode.SYNTHETIC)
    
    assert run_live.mape == Decimal("0.0000")
    assert run_syn.mape == Decimal("100.0000")
