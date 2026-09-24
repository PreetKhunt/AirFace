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
from app.services.demo_reference import load_demo_reference_baseline, REFERENCE_SOURCE

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
    run_step("Ingest Synthetic Validation", "/ingestion/fixtures/synthetic-validation")
    
    # 3. Normalization
    run_step("Normalize Data", "/normalization/run")
    
    # 4. Calculate Index
    run_step("Calculate Index (SYNTHETIC)", "/index/calculate", params={"calculation_date": CALC_DATE, "base_date": BASE_DATE, "data_mode": "SYNTHETIC"})
    for validation_date in sorted(load_demo_reference_baseline()):
        run_step(
            f"Calculate Validation Index (SYNTHETIC) {validation_date}",
            "/index/calculate",
            params={"calculation_date": validation_date, "base_date": "2026-01-14", "data_mode": "SYNTHETIC"},
        )
    
    # 5. Execute Backtest
    ref_data = {str(observation_date): value for observation_date, value in load_demo_reference_baseline().items()}
    
    backtest_payload_hist = {
        "start_date": "2026-01-15",
        "end_date": "2026-02-13",
        "reference_data": ref_data,
        "reference_source": REFERENCE_SOURCE,
        "methodology": "JEVONS",
        "booking_horizon": "T+1",
        "data_mode": "SYNTHETIC"
    }

    def run_step_json(name, url, payload):
        print(f"[{name}] Starting...")
        try:
            import httpx
            response = httpx.post(f"{API_BASE}{url}", json=payload, timeout=30.0)
            response.raise_for_status()
            print(f"[{name}] Success: {response.json()}")
        except Exception as e:
            print(f"[{name}] Failed: {e}")

    run_step_json("Backtest Validation (SYNTHETIC)", "/backtest/run", backtest_payload_hist)
    
    print("\n[SUCCESS] Demo environment reset is complete!")
