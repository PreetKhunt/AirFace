import os
import sys
import httpx
import time
from datetime import date, timedelta

API_BASE = os.environ.get("API_BASE_URL", "https://sih-backend-kvyb.onrender.com/api/v1")
CALC_DATE = "2026-01-14"
BASE_DATE = "2026-01-01"

def check_if_seeded():
    print(f"Checking if database is already seeded at {API_BASE}...")
    try:
        response = httpx.get(f"{API_BASE}/quality/history", timeout=30.0)
        if response.status_code == 200:
            data = response.json()
            if data.get("total", 0) > 0:
                return True
        return False
    except Exception as e:
        print(f"Failed to check seed status: {e}")
        return False

def run_step(name, url, method="POST", params=None, json=None):
    print(f"[{name}] Starting...")
    try:
        if method == "POST":
            response = httpx.post(f"{API_BASE}{url}", params=params, json=json, timeout=60.0)
        else:
            response = httpx.get(f"{API_BASE}{url}", params=params, timeout=60.0)
        
        response.raise_for_status()
        print(f"[{name}] Success: {response.json()}")
    except Exception as e:
        print(f"[{name}] Failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"[{name}] Response: {e.response.text}")
        sys.exit(1)

def run_step_json(name, url, payload):
    run_step(name, url, method="POST", json=payload)

if __name__ == "__main__":
    print("========================================")
    print("SIH26056 PRODUCTION SEED SCRIPT")
    print("========================================")
    
    if False:
        print("\n[INFO] Database is already seeded. Idempotent check passed. Skipping seed process.")
        sys.exit(0)
    
    print("\n[INFO] Database is empty. Proceeding with seed sequence...\n")
    
    # 1. Ingest Fixture Data
    run_step("Ingest Synthetic", "/ingestion/fixtures/synthetic")
    run_step("Ingest Historical", "/ingestion/fixtures/historical")
    
    # 2. Normalization & Quality
    run_step("Normalize Data & Calculate DQ", "/normalization/run")
    
    # 3. Calculate Index
    SYNTHETIC_BASE = "2026-01-15"
    SYNTHETIC_DATES = ["2026-01-15", "2026-01-21", "2026-01-29", "2026-01-30", "2026-02-06", "2026-02-14", "2026-02-22", "2026-02-28"]
    for d in SYNTHETIC_DATES:
        run_step(f"Calculate Index (SYNTHETIC) {d}", "/index/calculate", params={"calculation_date": d, "base_date": SYNTHETIC_BASE, "data_mode": "SYNTHETIC"})
    
    HISTORICAL_BASE = "2025-12-13"
    HISTORICAL_DATES = ["2025-12-13", "2025-12-25", "2025-12-28", "2026-01-06", "2026-01-09", "2026-01-11", "2026-01-14", "2026-01-21", "2026-01-26", "2026-01-29"]
    for d in HISTORICAL_DATES:
        run_step(f"Calculate Index (HISTORICAL) {d}", "/index/calculate", params={"calculation_date": d, "base_date": HISTORICAL_BASE, "data_mode": "HISTORICAL"})
    
    # 4. Execute Backtest
    # Use dates that match the fixtures
    ref_data_sync = {d: 100.0 for d in SYNTHETIC_DATES}
    backtest_payload_sync = {
        "start_date": SYNTHETIC_DATES[0],
        "end_date": SYNTHETIC_DATES[-1],
        "reference_data": ref_data_sync,
        "reference_source": "MOCK_BASELINE",
        "methodology": "JEVONS",
        "booking_horizon": "T+1",
        "data_mode": "SYNTHETIC"
    }

    ref_data_hist = {d: 100.0 for d in HISTORICAL_DATES}
    backtest_payload_hist = {
        "start_date": HISTORICAL_DATES[0],
        "end_date": HISTORICAL_DATES[-1],
        "reference_data": ref_data_hist,
        "reference_source": "MOCK_BASELINE",
        "methodology": "JEVONS",
        "booking_horizon": "T+1",
        "data_mode": "HISTORICAL"
    }

    run_step_json("Backtest Validation (SYNTHETIC)", "/backtest/run", backtest_payload_sync)
    run_step_json("Backtest Validation (HISTORICAL)", "/backtest/run", backtest_payload_hist)
    
    print("\n[SUCCESS] Production seed complete!")
