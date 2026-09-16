# Implementation Plan & Prototype Strategy
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Prototype Strategy & Vertical Slice Mandate

To ensure a successful hackathon submission by **20 September 2026**, implementation focuses on building a convincing **vertical slice prototype**. Rather than attempting an overly broad web scraping fleet, the prototype proves the complete end-to-end data pipeline:

```
SOURCE ──► AIRFARE OBSERVATION ──► NORMALIZATION ──► DATA QUALITY ──► JEVONS INDEX ──► ROUTE INDEX ──► DGCA WEIGHT ──► NATIONAL INDEX ──► DASHBOARD ──► BACKTEST ──► PROVENANCE
```

### Multi-Mode Data Resilience Strategy

```
                 DATA MODE TOGGLE
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
     LIVE           HISTORICAL       SYNTHETIC
  Real-time       30-Day Scraped     Calibrated Demo
  Scraper         Archive Database   Mock Data
       │                │                │
       └────────────────┼────────────────┘
                        ▼
                  SAME PIPELINE
                        ▼
                SAME INDEX ENGINE
                        ▼
                    DASHBOARD
```

> [!IMPORTANT]
> **REPRESENTATION RESILIENCE GUARANTEE:**  
> If target airline/OTA portals implement bot blocks during live competition evaluation, the system switches smoothly to `HISTORICAL` or `SYNTHETIC` mode. The UI explicitly badges the active mode (`[HISTORICAL DEMO DATA]`), ensuring presentation uptime without misrepresentation.

---

## 2. Priority Classification (P0 / P1 / P2)

### P0 — MUST WORK (Core Vertical Slice Prototype)
* Data Ingestion Pipeline & Raw Observation Store
* Fare Normalization & Component Extractor ($P_{comparable} = BF + \text{Taxes}$)
* Tier 1 Jevons Elementary Index ($I_{r,h}$) & Tier 2 Young Aggregate Index ($I_{National}$)
* DGCA Passenger Volume Weight Integration ($w_r$)
* Interactive Web Dashboard (Overview, Top Routes, Booking Window, Trend Chart)
* Historical/Synthetic Data Fallback Engine (`LIVE`, `HISTORICAL`, `SYNTHETIC`)

### P1 — SHOULD WORK (High-Value Presentation & Quality Features)
* Live Playwright Scraper Adapters (IndiGo, MakeMyTrip, EaseMyTrip)
* 30-Day Automated Backtest Engine (MAPE, RMSE, Pearson $r$, Bias, DA)
* 8-Factor Data Quality Score Engine ($DQ \in [0, 100]$)
* Cryptographic Provenance Explorer (SHA-256 payload audit trail modal)
* REST API Endpoints for CPI Data Export (JSON/CSV)

### P2 — NICE TO HAVE (Optional Innovation Upgrades)
* AI Isolation Forest Anomaly Detection
* Prophet Time-Series Index Forecasting (14-Day Projections)
* Automated NLG Press Release Briefing Generator

---

## 3. Implementation Phases (A through F)

### Phase A — Foundation & Environment Setup
* Project directory structure & virtualenv initialization.
* Docker Compose configuration (PostgreSQL 16 + TimescaleDB, Redis 7, FastAPI backend, Next.js frontend).
* Shared Pydantic data models & logging configuration.

### Phase B — Data Engine & Ingestion
* `raw_airfare_observation` and `parsed_airfare_observation` database schemas.
* Base Scraper Adapter interface and Playwright Chromium driver integration.
* Static historical fixture loader & multi-mode data router (`LIVE`, `HISTORICAL`, `SYNTHETIC`).

### Phase C — Data Quality & Fare Normalization
* Component fare parser (isolating `base_fare`, `UDF`, `ASF`, `GST`, stripping convenience fees).
* Multi-OTA deduplication matching on `(origin, dest, airline, flight_no, travel_date, departure_time, fare_family)`.
* Missing value imputation manager (max 3 days cell-mean) & Tukey IQR outlier cleaner.
* Real-time 8-Factor Data Quality Score engine ($DQ$).

### Phase D — Statistical Index Engine
* Vectorized Tier 1 Jevons Geometric Mean Index calculation module.
* DGCA Passenger Volume Weight ingestion ($w_r$) and Tier 2 Young National Aggregation module.
* Multi-frequency temporal aggregator (Daily $I_d$, Weekly $I_w$, Monthly $I_m$) and dynamic base rebasing logic.

### Phase E — Validation & 30-Day Backtest Pipeline
* 30-day historical reference dataset loader.
* Temporal alignment & observation pair matcher.
* Metric calculation engine: MAPE, RMSE, Pearson correlation $r$, Mean Percentage Bias, Directional Accuracy.
* Machine-readable JSON backtest audit report generator.

### Phase F — Interactive Web Dashboard & Provenance UI
* Next.js dark-theme UI matching official competition layout mockup.
* Module 1: Overview Header & National Airfare Trend Line Chart.
* Module 2: Route Explorer Table & Module 3: Booking Window Bar Chart.
* Module 4: Collection Monitor Table & Module 5: Data Quality Score Widget.
* Module 6: 30-Day Backtest Panel & Module 7: Step-by-Step Provenance Explorer Modal.

---

## 4. Five-Day Execution Schedule (15–20 September 2026)

| Date | Key Milestone | Target Deliverables |
|---|---|---|
| **15 Sep** | **Step 1 & Step 2 Complete** | Research Dossier & Methodology Freeze Specification finalized. |
| **16 Sep** | **Step 3 & Step 4 Complete** | PRD Suite, System Architecture, & Database DDL finalized. Foundation environment setup (Phase A). |
| **17 Sep** | **Phase B & Phase C Execution** | Ingestion engine, multi-mode data router, fare normalizer, deduplication, and DQ engine built. |
| **18 Sep** | **Phase D & Phase E Execution** | Tier 1 Jevons & Tier 2 Young index engines, 30-day backtest runner, and REST APIs built. |
| **19 Sep** | **Phase F Execution & Integration** | Next.js dark-theme dashboard, Provenance Explorer modal, end-to-end pipeline integration & unit tests. |
| **20 Sep** | **Final Demo Polish & Submission** | Final prototype deployment, offline demo cached database setup, presentation guide ready. |
