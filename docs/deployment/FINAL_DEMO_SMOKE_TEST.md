# AIRFACE — FINAL DEMO SMOKE TEST REPORT

**Date:** 2026-09-17
**Status:** READY FOR DEMO (with minor latency warning during cold starts)
**Commit:** 8b8ac17

---

### A. Deployment URLs
- **Frontend (Vercel):** https://air-face-rho.vercel.app/
- **Backend (Render):** https://sih-backend-kvyb.onrender.com
- **API Base:** https://sih-backend-kvyb.onrender.com/api/v1

---

### B. Backend Endpoint Verification

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/health` | GET | PASS | Returns OK |
| `/health/system` | GET | PASS | Includes data mode (FIXTURE) |
| `/sources` | GET | PASS | Returns 2 sources |
| `/index/national` | GET | PASS | Returns aggregate indices |
| `/index/route` | GET | PASS | Returns route-level indices |
| `/quality/score` | GET | PASS | Returns 100% composite score |
| `/quality/history` | GET | PASS | Returns history array |
| `/backtest/results` | GET | PASS | Returns latest run |
| `/normalized-observations?include_parsed=true` | GET | PASS | Fixed Pydantic serialization crash |

*(Note: Fixed a 500 Internal Server Error in `/normalized-observations` caused by Pydantic expecting a strict string instead of a `datetime.date` object).*

---

### C. Seven-Workspace UI Verification

1. **Control Room**: PASS. Renders index area chart from `GET /index/national`.
2. **Route Intelligence**: PASS. Split-pane layout queries `GET /index/route`.
3. **Booking Horizon**: PASS. Timeline and escalation charts map to `booking_horizon` grouping.
4. **Collection Engine**: PASS. Displays real scraper status, latency, and counts.
5. **Data Quality**: PASS. 8-factor vector renders cleanly.
6. **Integrity Engine**: PASS. Renders exact fare components.
7. **Provenance Explorer**: PASS. Cryptographic lineage intact and hashes match backend.

---

### D. Collection Engine Result
**Status:** PASS
The "Run Collection" button invokes `POST /api/v1/pipeline/run`. Simulated terminal logic bridges the synchronous wait period to give visual feedback until the real execution completes.

---

### E. Data Quality Verification
**Status:** PASS
The Integrity Engine correctly displays `RAW` → `PARSED` → `NORMALIZED` → `DQ` → `INDEX READY` counts powered directly by the `include_parsed=true` flag. Validations handle outlier exclusions seamlessly.

---

### F. Provenance Verification
**Status:** PASS
The cryptographic lineage displays actual UUIDs (`observation_id`, `index_obs_id`) and computes to the canonical `payload_sha256_hash` retrieved dynamically. No mocked texts or IDs exist.

---

### G. Data-Mode Honesty Check
**Status:** PASS
- System returns `FIXTURE` mode.
- Frontend labels explicitly reflect `FIXTURE / DEMO`.
- No false "Live Web Scraping" badges exist; badges correctly display "System Heartbeat" or similar status limits.

---

### H. Network/API Isolation Check
**Status:** PASS
- All frontend connections target `process.env.NEXT_PUBLIC_API_URL`.
- No `localhost` artifacts or explicit IP fallback requests remain.

---

### I. Production DB Counts

*Scale observed via current API payloads:*
- **National Indices:** 2
- **Route Indices:** 18
- **Sources:** 2
- **Quality Logs:** 1
- **Backtest Runs:** 1

---

### J. Automated Test Results
- **pytest (Backend):** PASS (91/91 tests pass locally).
- **jest (Frontend):** PASS.
- **tsc (Frontend):** PASS.
- **lint (Frontend):** PASS.
- **build (Frontend):** PASS (Next.js SWC build successfully completes).

---

### K. Known Limitations
- Render Free Tier Spin-Down: The first API request after inactivity may take 30-50 seconds. The frontend `StateBoundary` handles this via standard loading loops, but demo handlers must pre-warm the backend prior to presentation.

### L. Remaining Blockers
- **None.**

---

### CONCLUSION
**READY FOR DEMO**
