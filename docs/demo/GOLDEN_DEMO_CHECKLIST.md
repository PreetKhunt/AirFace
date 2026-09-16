# Golden Demo Pre-Flight Checklist

Ensure all items are checked before commencing a live demonstration.

## 1. Environment Verification
- [ ] Database is empty (or has been dropped/reset).
- [ ] Port `8000` is free for FastAPI.
- [ ] Port `3000` is free for Next.js.
- [ ] Redis is either running (for live scraping) or gracefully ignored via the `reset_demo_sync.py` script.

## 2. Deterministic Reset
- [ ] Ran `python backend/scripts/reset_demo_sync.py` successfully.
- [ ] Console output indicated "Golden Demo Dataset successfully generated."
- [ ] No Python traceback exceptions occurred during reset.

## 3. Backend Health
- [ ] Started backend (`python -m uvicorn app.main:app`).
- [ ] Navigated to `http://localhost:8000/api/v1/health`.
- [ ] Response is `{"status": "ok"}`.

## 4. Frontend Health
- [ ] Started frontend (`npm run dev`).
- [ ] Navigated to `http://localhost:3000`.
- [ ] **Overview** page loads without infinite spinners.
- [ ] **DataModeBadge** correctly displays `[SYNTHETIC]` or `[HISTORICAL]` and does not say `[LIVE]`.

## 5. Visual Inspections
- [ ] **Route Explorer**: Check that `DEL-BOM` populates data.
- [ ] **Booking Horizon**: Check that the T+1 through T+45 bar chart is visible.
- [ ] **Data Cleaning**: Check that an observation trace renders without error.
- [ ] **Backtest**: Verify that the cards render numeric scores or explicitly display `REFERENCE DATA UNAVAILABLE`.
- [ ] **Provenance**: Verify that the SHA-256 hash appears at the bottom of the trace.

## 6. Failure Preparedness
- [ ] Confirm knowledge of the `FAILURE_RECOVERY.md` procedures in case of a crash.
- [ ] Ensure browser cache is disabled (Network Tab -> Disable Cache) to prevent stale API responses.
