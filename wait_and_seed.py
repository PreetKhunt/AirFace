import time
import httpx
import subprocess

API_URL = "https://sih-backend-kvyb.onrender.com/api/v1/ingestion/fixtures/synthetic"

print("Waiting for deployment to fix FK violation...")
while True:
    try:
        r = httpx.post(API_URL, timeout=10.0)
        data = r.json()
        if data.get("raw_ingested", 0) > 0:
            print(f"Success! Ingested {data['raw_ingested']} records. The API is fixed.")
            break
        elif data.get("invalid_rejected", 0) > 0:
            # We got the old broken FK violation or another error
            print(f"Still returning errors: {data.get('errors')}")
        else:
            print("Zero records. Waiting...")
    except Exception as e:
        print(f"Waiting... ({e})")
    time.sleep(15)

print("\nRunning seed sequence...")
subprocess.run(["python", "backend/scripts/seed_production_demo.py"], check=True)
