import os
import sys
import httpx

API_BASE = os.environ.get("API_BASE_URL", "https://sih-backend-kvyb.onrender.com/api/v1")
EXPECTED_HORIZONS = {"T+1", "T+7", "T+15", "T+30", "T+45"}

def check_if_seeded():
    try:
        response = httpx.get(f"{API_BASE}/index/horizons", timeout=30.0)
        response.raise_for_status()
        data = response.json()
        available_horizons = {
            item["horizon"]
            for item in data.get("horizons", [])
            if item.get("availability_state") == "AVAILABLE"
        }
        return data.get("data_mode") == "HISTORICAL" and available_horizons == EXPECTED_HORIZONS
    except Exception:
        return False

def run_step(name, url):
    print(f"[{name}] Starting...")
    try:
        response = httpx.post(f"{API_BASE}{url}", timeout=300.0)
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
    print("SIH26056 HISTORICAL DEMO SEED")
    print("========================================")
    
    if check_if_seeded():
        print("\n[INFO] Historical indexes are available for all five horizons. Nothing to seed.")
        sys.exit(0)
    
    print("\n[INFO] Running the historical ingestion, normalization, and indexing pipeline...\n")
    pipeline_result = run_step("Historical pipeline", "/pipeline/run")
    if pipeline_result.get("normalization", {}).get("status") != "SUCCESS":
        run_step("Recalculate historical data quality", "/quality/recalculate")
    if not check_if_seeded():
        print("\n[ERROR] Historical indexes are still incomplete after the pipeline run.")
        sys.exit(1)

    print("\n[INFO] No verified official reference series is configured; synthetic benchmark validation remains separate.")
    print("\n[SUCCESS] Historical demo pipeline complete!")
