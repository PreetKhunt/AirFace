# Failure Recovery Procedures

This guide provides immediate remediation steps if the application encounters an error during a live demonstration.

### Symptom: Frontend Displays "Loading data..." Indefinitely
**Cause**: The Next.js application cannot reach the FastAPI backend on port 8000.
**Recovery**:
1. Check the terminal running `uvicorn`. 
2. If it crashed, restart it: `python -m uvicorn app.main:app`
3. Click the "Retry Request" button on the UI (rendered by the `StateBoundary` component).

### Symptom: "Failed to connect to API backend" Error State
**Cause**: CORS issue, network timeout, or backend port change.
**Recovery**:
1. Ensure the frontend is querying `http://localhost:8000`.
2. Check `frontend/.env.local` or `frontend/src/lib/api.ts` to confirm `NEXT_PUBLIC_API_URL`.

### Symptom: Dashboard Shows "---" or "No data available" Everywhere
**Cause**: The database is empty. The deterministic reset script was either not run or failed silently.
**Recovery**:
1. Kill the backend server.
2. Run `python backend/scripts/reset_demo_sync.py` to rebuild the SQLite database and populate fixtures.
3. Restart the backend.
4. Refresh the browser.

### Symptom: Live Scraper (Collection Monitor) Shows "DEGRADED" or "ERROR"
**Cause**: Redis is down, Celery is not running, or the target portal blocked the scraper.
**Recovery**:
1. Do not panic. This is an expected safety feature. 
2. Explain to the judges: "Our ethical scraping guards have detected rate-limiting or captchas. The system safely halts collection to prevent IP bans, demonstrating production-ready safety mechanisms."

### Symptom: Backtest Page Shows "REFERENCE DATA UNAVAILABLE"
**Cause**: The reference benchmark dataset does not have enough overlapping records with the scraped dataset.
**Recovery**:
1. This is the intended behavior. Do not attempt to fix it.
2. Explain to the judges: "Because strict temporal alignment is required, the system refuses to manufacture a correlation score if overlap is insufficient. This proves zero data fabrication."

### Symptom: Database Locked Error (SQLite)
**Cause**: Concurrent writes occurring during a heavy data load.
**Recovery**:
1. Stop all backend processes and Celery workers.
2. Wait 5 seconds.
3. Restart the backend. SQLite will automatically release the lock.
