import os
import sys
from datetime import date
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.demo_reference import load_demo_reference_baseline, REFERENCE_SOURCE

API_BASE = os.environ.get("API_BASE_URL", "https://sih-backend-kvyb.onrender.com/api/v1")
EXPECTED_HORIZONS = {"T+1", "T+7", "T+15", "T+30", "T+45"}

def historical_indexes_complete():
    try:
        response = httpx.get(f"{API_BASE}/index/horizons", timeout=30.0)
        response.raise_for_status()
        data = response.json()
        horizons = {item["horizon"]: item for item in data.get("horizons", [])}
        return (
            data.get("data_mode") == "HISTORICAL"
            and EXPECTED_HORIZONS.issubset(horizons)
            and all(
                horizons[horizon].get("availability_state") == "AVAILABLE"
                and horizons[horizon].get("index_observation_count", 0) >= 18
                for horizon in EXPECTED_HORIZONS
            )
        )
    except Exception:
        return False

def synthetic_validation_exists():
    try:
        response = httpx.get(
            f"{API_BASE}/backtest/results",
            params={"data_mode": "SYNTHETIC"},
            timeout=30.0,
        )
        response.raise_for_status()
        return any(run.get("reference_source") == REFERENCE_SOURCE for run in response.json())
    except Exception:
        return False

def run_step(name, url, params=None, payload=None):
    print(f"[{name}] Starting...")
    try:
        response = httpx.post(
            f"{API_BASE}{url}", params=params, json=payload, timeout=300.0
        )
        response.raise_for_status()
        result = response.json()
        print(f"[{name}] Success: {result}")
        return result
    except Exception as e:
        print(f"[{name}] Failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"[{name}] Response: {e.response.text}")
        sys.exit(1)

if __name__ == "__main__":
    print("========================================")
    print("SIH26056 HISTORICAL DEMO + SYNTHETIC VALIDATION SEED")
    print("========================================")

    if not historical_indexes_complete():
        print("\n[INFO] Completing historical indexes for all five horizons...\n")
        run_step("Historical pipeline", "/pipeline/run")
    else:
        print("\n[INFO] Historical indexes are complete for all five horizons.")

    if not synthetic_validation_exists():
        print("\n[INFO] Preparing the separate 31-day synthetic validation benchmark...\n")
        run_step("Ingest synthetic validation fixture", "/ingestion/fixtures/synthetic-validation")
        run_step("Normalize validation observations", "/normalization/run")

        reference_values = load_demo_reference_baseline()
        base_date = date(2026, 1, 14)
        for calculation_date in sorted(reference_values):
            run_step(
                f"Calculate synthetic validation index {calculation_date}",
                "/index/calculate",
                params={
                    "calculation_date": calculation_date.isoformat(),
                    "base_date": base_date.isoformat(),
                    "data_mode": "SYNTHETIC",
                },
            )

        reference_data = {key.isoformat(): value for key, value in reference_values.items()}
        run_step(
            "Run synthetic benchmark validation",
            "/backtest/run",
            payload={
                "start_date": min(reference_values).isoformat(),
                "end_date": max(reference_values).isoformat(),
                "reference_data": reference_data,
                "reference_source": REFERENCE_SOURCE,
                "methodology": "JEVONS",
                "booking_horizon": "T+1",
                "data_mode": "SYNTHETIC",
            },
        )
    else:
        print("\n[INFO] Synthetic benchmark validation is already available.")

    run_step(
        "Refresh historical-only data quality score",
        "/quality/recalculate",
        params={"data_mode": "HISTORICAL"},
    )

    if not historical_indexes_complete() or not synthetic_validation_exists():
        print("\n[ERROR] Historical coverage or synthetic validation is still incomplete.")
        sys.exit(1)

    print("\n[SUCCESS] Historical demo and separate synthetic validation are ready!")
