import os
import sys
import httpx
import time
from datetime import date
from app.database.session import SessionLocal, engine, Base
import app.models.observation
import app.models.route
import app.models.index
import app.models.source_health
import app.models.log
import app.models.backtest

API_BASE = "http://127.0.0.1:8000/api/v1"
CALC_DATE = "2026-01-14"
BASE_DATE = "2026-01-01"

def run_step(name, url, method="POST", params=None):
    print(f"[{name}] Starting...")
    try:
        if method == "POST":
            response = httpx.post(f"{API_BASE}{url}", params=params, timeout=30.0)
        else:
            response = httpx.get(f"{API_BASE}{url}", params=params, timeout=30.0)
        
        response.raise_for_status()
        print(f"[{name}] Success: {response.json()}")
    except Exception as e:
        print(f"[{name}] Failed: {e}")
        sys.exit(1)

def reset_db():
    print("[Database] Resetting SQLite DB schema via SQLAlchemy metadata...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[Database] Reset complete.")

if __name__ == "__main__":
    print("========================================")
    print("SIH26056 GOLDEN DEMO RESET SCRIPT")
    print("========================================")
    
    # 1. Database migration
    reset_db()
    
    time.sleep(2) # Give it a moment
    
    # 2. Ingest Fixture Data
    run_step("Ingest Synthetic", "/ingestion/fixtures/synthetic")
    run_step("Ingest Historical", "/ingestion/fixtures/historical")
    
    # 3. Normalization
    run_step("Normalize Data", "/normalization/run")
    
    # 4. Calculate Index
    run_step("Calculate Index (SYNTHETIC)", "/index/calculate", params={"calculation_date": CALC_DATE, "base_date": BASE_DATE, "data_mode": "SYNTHETIC"})
    run_step("Calculate Index (HISTORICAL)", "/index/calculate", params={"calculation_date": CALC_DATE, "base_date": BASE_DATE, "data_mode": "HISTORICAL"})
    
    # 5. Execute Backtest
    # Provide a tiny synthetic reference dataset for the backtest to run against
    import datetime
    start_dt = date.today() - datetime.timedelta(days=30)
    ref_data = {str(date.today() - datetime.timedelta(days=i)): 100.0 for i in range(30)}
    
    backtest_payload_sync = {
        "start_date": str(start_dt),
        "end_date": CALC_DATE,
        "reference_data": ref_data,
        "reference_source": "MOCK_BASELINE",
        "methodology": "JEVONS",
        "booking_horizon": "T+1",
        "data_mode": "SYNTHETIC"
    }
    backtest_payload_hist = {**backtest_payload_sync, "data_mode": "HISTORICAL"}

    def run_step_json(name, url, payload):
        print(f"[{name}] Starting...")
        try:
            import httpx
            response = httpx.post(f"{API_BASE}{url}", json=payload, timeout=30.0)
            response.raise_for_status()
            print(f"[{name}] Success: {response.json()}")
        except Exception as e:
            print(f"[{name}] Failed: {e}")

    run_step_json("Backtest Validation (SYNTHETIC)", "/backtest/run", backtest_payload_sync)
    run_step_json("Backtest Validation (HISTORICAL)", "/backtest/run", backtest_payload_hist)
    
    print("\n[SUCCESS] Demo environment reset is complete!")
