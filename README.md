# AIRFACE (SIH26056) — Real-Time Airfare Price Index for India

> **SIH26056:** “Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)”

**Brand / System Name:** AIRFACE  
**Disclaimer:** This prototype is built for Smart India Hackathon 2026. It demonstrates the technical feasibility, data pipeline, and methodological framework for dynamic airfare price indexing. It is an experimental data intelligence prototype and does not replace the official Consumer Price Index published by the National Statistical Office (NSO / MoSPI).

---

## 1. Problem & Solution Overview

Airline ticket pricing in India is characterized by algorithmic dynamic pricing and steep escalation based on advance purchase windows. Traditional monthly point-in-time surveys fail to capture this intra-month volatility and advance-purchase variance.

**AIRFACE** provides an automated, auditable, and mathematically rigorous solution:
1. **Automated Ingestion:** Scalable web scraping adapters for direct airline feeds and OTAs.
2. **Component-Wise Normalization:** Strict isolation of comparable fares ($P_{\text{comp}} = \text{Base} + \text{UDF} + \text{ASF} + \text{GST} + \text{YQ}$) with double-counting prevention and convenience fee exclusion.
3. **Commercial Deduplication:** Preserves commercial equivalence while giving priority to direct airline channels.
4. **Outlier Treatment:** Tukey IQR anomaly detection with a $3.5\times$ median technical ceiling that preserves genuine market price surges.
5. **8-Factor Empirical Data Quality:** Continuous mathematical scoring across completeness, validity, consistency, freshness, reliability, dedup integrity, outlier cleanliness, and availability coverage.
6. **Tier 1 Elementary Jevons Indices:** Unweighted geometric mean of price relatives per Route × Horizon × Date cell, satisfying the Axiomatic Time Reversal Test.
7. **Tier 2 DGCA Traffic-Weighted National Index:** National aggregation using DGCA passenger volume reference weights via Young/Modified Laspeyres & Jevons formulas.
8. **Cryptographic Lineage:** End-to-end SHA-256 payload checksum audit trails from national index down to raw scraper payloads.
9. **Statistical Backtesting:** Rigorous 30-day temporal validation evaluating MAPE, RMSE, Pearson $r$, Bias, and Directional Accuracy against reference baselines.

---

## 2. System Architecture

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

## 3. Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic
- **Task Queue & Cache:** Celery, Redis (optional for background scrapers)
- **Database:** PostgreSQL / TimescaleDB (production) / SQLite (zero-config local demo)
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Lucide Icons
- **Testing:** Pytest (92 unit/integration tests), Jest + React Testing Library (11 component tests)

---

## 4. Quick Start & Demo Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# From repository root:
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r backend/requirements.txt
```

### 2. Run Deterministic Demo Seed
```bash
# Seeds 571 observations, runs normalization, computes Tier 1/2 indices, provenance, and backtests
python -m backend.scripts.seed_demo
```

### 3. Start Backend API Server
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 4. Start Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Dashboard will be available at: `http://localhost:3000`

---

## 5. Running Tests

### Backend Unit & Integration Tests (92 Tests)
```bash
pytest backend/tests -v
```

### Frontend Dashboard Tests (11 Tests)
```bash
cd frontend
npm test
```

### Production Build Verification
```bash
cd frontend
npm run build
```

---

## 6. Project Documentation Index

- [`docs/FINAL_INTEGRATION_AUDIT.md`](docs/FINAL_INTEGRATION_AUDIT.md): Comprehensive repository audit, architecture gaps, and completed fixes.
- [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md): Step-by-step 5-minute SIH judge presentation walkthrough.
- [`docs/DATASET.md`](docs/DATASET.md): Route basket, horizon breakdown, fare decomposition, and controlled edge cases.
- [`docs/VALIDATION.md`](docs/VALIDATION.md): Formulations for MAPE, RMSE, Pearson $r$, Bias, and Directional Accuracy.
- [`docs/PROVENANCE.md`](docs/PROVENANCE.md): Cryptographic SHA-256 payload lineage architecture.
- [`docs/UI_UX_REPORT.md`](docs/UI_UX_REPORT.md): Design system, state boundaries, and module catalog.

---

## 7. Methodological Limitations & Future Scope

1. **Traffic vs Expenditure Weights:** DGCA passenger volume proportions serve as traffic-based reference weights rather than exact household consumer expenditure weights.
2. **Benchmark Availability:** Official historical micro-data series are not publicly published by airlines; validation utilizes version-controlled reference datasets.
3. **Anti-Bot & Rate Limits:** Production deployment respects `robots.txt`, ethical rate-limiting ($\ge 2.0\text{s}$ delays), and does not use unauthorized evasion techniques.
