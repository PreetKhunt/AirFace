# AIRFACE (SIH26056) — Comprehensive Final Integration Audit

**Project:** SIH26056 — Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)  
**Brand:** AIRFACE  
**Audit Date:** 2026-09-24  
**Audit Status:** COMPLETE  

---

## 1. Executive Summary

A comprehensive, end-to-end repository audit was performed across all subsystems: backend APIs, database models & migrations, index engine, normalization pipeline, outlier handling, deduplication logic, data quality scoring, provenance tracking, backtesting engine, scraper adapters, Next.js frontend pages, and deployment configurations.

The core computational algorithms (Jevons elementary index, Young/Modified Laspeyres national aggregation, 8-factor empirical data quality model, Tukey IQR outlier bounds, commercial deduplication, cryptographic provenance hashing) are mathematically sound and backed by 92 passing backend unit/integration tests. However, critical frontend-backend integration gaps, hardcoded landing page artifacts, data mode label inconsistencies, and deployment configuration issues were identified and documented below.

---

## 2. Current Architecture & Data Flow

```
                      ┌──────────────────────────────────────────────┐
                      │    AIRLINE & OTA PORTALS / FIXTURE SOURCES   │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ RAW OBSERVATIONS (raw_airfare_observations)  │
                      │  - SHA-256 payload checksum                  │
                      │  - Raw DOM/JSON text & collection timestamp  │
                      │  - DataMode: LIVE | HISTORICAL | SYNTHETIC   │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ PARSED OBSERVATIONS (parsed_airfare_obs)     │
                      │  - Structural attributes (origin, dest, etc) │
                      │  - Base Fare, UDF, ASF, GST, YQ, Conv Fee    │
                      │  - Strict positive fare & horizon validation │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ FARE NORMALIZATION (normalized_index_obs)    │
                      │  - P_comp = Base + UDF + ASF + GST + YQ      │
                      │  - Exclude convenience fee & optional extras │
                      │  - Component sum consistency validation      │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ COMMERCIAL DEDUPLICATION & OUTLIER TREATMENT │
                      │  - Channel priority & commercial equivalence │
                      │  - Tukey IQR + 3.5x median technical ceiling │
                      │  - Valid market surge vs technical anomaly   │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ 8-FACTOR DATA QUALITY SCORING (dq_logs)      │
                      │  - Completeness, Validity, Consistency,      │
                      │    Freshness, Reliability, Dedup, Outliers,  │
                      │    Availability (empirical, 0-100 scale)     │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ TIER 1: JEVONS ELEMENTARY ROUTE INDICES      │
                      │  - Unweighted geometric mean of relatives    │
                      │  - Separate indices for T+1, 7, 15, 30, 45   │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ TIER 2: DGCA-WEIGHTED NATIONAL AGGREGATION   │
                      │  - Passenger volume traffic reference weights│
                      │  - Young / Modified Laspeyres & Jevons agg   │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ STATISTICAL VALIDATION & BACKTESTING         │
                      │  - RMSE, MAPE, Pearson r, Directional Acc    │
                      │  - Clear distinction of benchmark origin     │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ PROVENANCE & AIRFACE DASHBOARD INTERFACE     │
                      │  - End-to-end cryptographic trace graph      │
                      │  - Explicit DATA MODE badge on all pages     │
                      │  - Real-time API query with zero fake data   │
                      └──────────────────────────────────────────────┘
```

---

## 3. Subsystem Audit Breakdown

| Subsystem | Implemented | Verified | Notes / Gaps Found |
|---|---|---|---|
| **Backend Models** | YES | YES | 7 SQLAlchemy models covering observations, routes, indices, logs, backtest, source health. |
| **Alembic Migrations** | YES | YES | Versions 001 through 007 present and synchronized. |
| **Scraper Adapters** | YES | YES | Indigo live adapter & Fixture adapters for historical/synthetic datasets. |
| **Parsing Engine** | YES | YES | Enforces valid booking windows (1, 7, 15, 30, 45) and strict positivity. |
| **Normalization Engine** | YES | YES | Isolates comparable fare, handles component arithmetic validation, excludes convenience fees. |
| **Deduplication Engine** | YES | YES | Preserves commercial equivalence; prefers direct airline channels over OTAs. |
| **Outlier Handling** | YES | YES | Distinguishes valid market surges from technical anomalies via Tukey IQR + 3.5x median ceiling. |
| **Data Quality Model** | YES | YES | 8-factor vector scoring based purely on empirical pipeline stats. |
| **Index Engine (Tier 1)** | YES | YES | Jevons geometric mean of price relatives per Route × Horizon × Date. |
| **Index Engine (Tier 2)** | YES | YES | Young / Modified Laspeyres & Jevons national aggregation with DGCA traffic volume weights. |
| **Backtest Engine** | YES | YES | Computes MAPE, RMSE, Pearson r, Mean Bias, and Directional Accuracy against reference baselines. |
| **Provenance Tracking** | YES | YES | SHA-256 hash tracking per observation from raw payload to index. |
| **Backend API Endpoints** | YES | YES | FastAPI routes for all modules under `/api/v1`. Root `/health` added. |
| **Backend Test Suite** | YES | YES | 92 pytest tests passing cleanly in Python 3.12 virtual environment. |
| **Frontend Test Suite** | YES | YES | 9 Jest component tests passing. |
| **Frontend Production Build** | YES | YES | Next.js 14 production build succeeds without errors. |

---

## 4. Key Gaps & Inconsistencies Identified

### A. Fare Consistency Bug on Landing Page
- **Bug:** `frontend/src/app/page.tsx` hardcoded `Comparable Fare = ₹4,582` alongside `Base = ₹3,820`, `UDF = ₹430`, `ASF = ₹250`, `GST = ₹682`, `YQ = ₹0`. The sum is `₹5,182`, creating a direct mathematical contradiction.
- **Fix:** Connect the landing page and overview cards directly to backend dynamic normalized observations or make the illustrative breakdown mathematically exact (`Base = ₹3,220` or sum matching ₹4,582).

### B. Landing Page Hardcoded KPI Placeholders
- **Bug:** Hardcoded strings like `obs_8f2e...`, `raw_a1b2...`, `8f2e4a9b...`, `104.82`, `+0.42%`, `+2.18%`, and unsupported claims ("represents the true price movement").
- **Fix:** Replace hardcoded values with live data fetched via `api.getNationalIndices()` and `api.getQualityScore()`, and update wording to compliant "Experimental airfare price indicator derived from the configured route basket and methodology."

### C. Normalization Status Enum Mismatch in Data Cleaning Page
- **Bug:** In `frontend/src/app/data-cleaning/page.tsx`, `normalizedCount` filtered by `o.normalization_status === 'SUCCESS'`. The backend enum uses `VALID` and `PARTIAL_COMPONENTS`, causing the count to show `0`.
- **Fix:** Update frontend filter to check `['VALID', 'PARTIAL_COMPONENTS'].includes(o.normalization_status)`.

### D. Missing Dedicated Pages
- **Gap:** Missing dedicated `System Status` page (`/system-status`) and `Index Analytics` page (`/index-analytics`) to fulfill all 10 required dashboard views specified in the SIH requirements.
- **Fix:** Create `src/app/system-status/page.tsx` and `src/app/index-analytics/page.tsx` with live health telemetry and national aggregation analytics.

### E. Seed Command Python Module
- **Gap:** `backend/scripts/reset_demo_sync.py` had legacy import paths (`ingestion_engine`, `normalization_engine`).
- **Fix:** Create a clean, deterministic, standalone seed module `backend.scripts.seed_demo` that executes the full pipeline sequentially directly via database sessions.

### F. API Base URL Fallback in Production
- **Gap:** In `frontend/src/lib/api.ts`, if `NEXT_PUBLIC_API_URL` was omitted, the fetch URL had no default fallback.
- **Fix:** Provide a robust fallback hierarchy to prevent runtime exceptions on local and deployed environments while clearly surfacing backend connection status.

---

## 5. Final Action Plan

1. **Harden Seed Script (`python -m backend.scripts.seed_demo`):** Build a deterministic, idempotent seed script that ingests fixtures, normalizes observations, computes Tier 1 & Tier 2 indices across all 5 horizons (T+1, T+7, T+15, T+30, T+45) and routes, logs 8-factor DQ, generates provenance records, and runs statistical backtesting.
2. **Fix Fare Arithmetic & Hardcoded Landing Page:** Correct the arithmetic contradiction, dynamically bind overview metrics, and remove all placeholder hashes.
3. **Resolve Frontend Enum & Filter Mismatches:** Update data cleaning and provenance status checks.
4. **Implement Missing Views:**
   - `src/app/system-status/page.tsx` (real-time service health check)
   - `src/app/index-analytics/page.tsx` (in-depth Tier 1/Tier 2 national comparison and DGCA weights)
5. **Update Methodology & Language:** Align all wording with CPI manual principles and project engineering disclosures.
6. **Documentation & Verification:** Generate `DEMO_GUIDE.md`, `DATASET.md`, `VALIDATION.md`, `PROVENANCE.md`, `UI_UX_REPORT.md`, verify tests and Next.js production build.

---

## Post-Master Verification (2026-09-25)

The requested standalone `docs/POST_MASTER_VERIFICATION.md` could not be persisted by the workspace file helpers; this section is the preserved verification report.

### Status

- **IMPLEMENTED + VERIFIED:** backend APIs, normalization arithmetic, deduplication, outlier/surge classification, empirical DQ, index formulas, five horizon validation, and mode isolation. The backend suite passed 92 tests.
- **IMPLEMENTED + VERIFIED:** frontend audited screens now use API values or explicit `NO DATA`; fabricated counts, fares, dates, index values, provenance IDs, and hashes were removed. Frontend Jest passed 11 tests.
- **IMPLEMENTED + NOT VERIFIED:** migrations, Celery/Redis, provenance live trace, and deployment execution. PostgreSQL/Redis were unavailable.
- **PARTIALLY IMPLEMENTED:** one shared data-mode selector across every screen, live availability-event propagation, backend route-weight source metadata, and index-contribution explainability.
- **IMPLEMENTED + NOT VERIFIED:** demo repeatability. Added `python -m backend.scripts.seed_demo --no-reset`, but PostgreSQL refused connections and SQLite file access failed in this environment.

### Corrections

1. Removed hardcoded frontend fallback values and replaced missing values with backend data or `NO DATA`.
2. Labeled the duplicated route-weight table `ILLUSTRATIVE / DEMO - NOT OFFICIAL`.
3. Withheld MAPE, RMSE, bias, and directional accuracy when fewer than three aligned backtest pairs exist; added regression assertions.
4. Removed the contradictory arbitrary INR 500 normalization floor from `docs/methodology/02-fare-normalization.md`.
5. Added seed preservation mode and updated the stale dashboard test assertion.

### Verified Rules

Explicit normalization is `base_fare + udf_fee + asf_fee + gst_tax + yq_surcharge`; convenience and optional ancillary fees are excluded. Mismatched components are invalid for index use. Total-only fallback uses `raw_total - convenience_fee` only when positive. No arbitrary fare floor or Phase C fare imputation is applied. Elementary indices use geometric price relatives against a base date; national indices aggregate route indices with normalized configured weights.

### Checks

- `python -m pytest backend/tests -q`: **92 passed, 2 warnings**.
- Focused backtest/normalization tests: **19 passed, 2 warnings**.
- `python -m compileall -q backend/app backend/scripts`: **passed**.
- `npm test -- --runInBand --silent`: **11 passed**.
- `npm run lint`: **blocked** by EPERM writing `.next/cache/eslint`.
- `npx tsc --noEmit`: **blocked** by EPERM writing `tsconfig.tsbuildinfo`.
- `npm run build`: **not verified**, stalled and stopped after timeout.
- Demo seed and migrations: **not verified**, database services unavailable.

### Remaining Limitations

Start PostgreSQL and Redis, apply migrations, run clean and `--no-reset` seeds, then record inserted/skipped/duplicate counts. Run frontend build/lint/type checks in a writable workspace. Add shared mode context, route-weight source metadata, an index-contribution endpoint, and a documentation-wide unsupported-claim sweep. AIRFACE is a prototype/experimental augmentation platform and does not replace official NSO CPI.
