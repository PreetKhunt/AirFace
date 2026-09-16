# System Architecture Specification
## SIH26056 — Real-Time Airfare Price Index for India

**Sponsoring Organization:** Ministry of Statistics and Programme Implementation (MoSPI)  
**Document Version:** 1.0.0-ARCH  
**Status:** APPROVED ARCHITECTURE SPECIFICATION  

---

## 1. High-Level System Architecture Diagram

The system architecture implements an end-to-end data pipeline processing raw web-scraped airfare listings into deterministic statistical price index numbers, backed by multi-mode data fallback, data quality scoring, backtesting, and full provenance explainability.

```
                    ┌──────────────────────┐
                    │ Airline Websites     │
                    │ (IndiGo, Air India)  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ OTA Portals          │
                    │ (MakeMyTrip, EMT)    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Source Adapters      │
                    │ Playwright / Scrapy  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Raw Observation Store│
                    │ (PostgreSQL/JSONB)   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Cleaning & Normalizer│
                    │ Base+Taxes Extraction│
                    └──────────┬───────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
      ┌───────────────┐                 ┌────────────────┐
      │ DGCA Traffic  │                 │ Historical     │
      │ Volume Data   │                 │ Reference Data │
      └───────┬───────┘                 └───────┬────────┘
              │                                 │
              └────────────────┬────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Index Engine         │
                    │ Jevons + Young Agg   │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          Daily Index     Weekly Index    Monthly Index
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Analytics Engine     │
                    │ DQ Score & Provenance│
                    └──────────┬───────────┘
                               │
              ┌────────────────┼─────────────────┐
              ▼                ▼                 ▼
          Dashboard           API           Backtesting
     (React/Next.js)      (FastAPI)      (30-Day Engine)
```

---

## 2. Component Subsystems & Responsibilities

### 2.1 Ingestion Subsystem (Scraper Fleet)
* **Components:** Playwright Chromium headless contexts, Scrapy engines, Rate Limiter ($\ge 2.0$s delay), Robots.txt Parser, User-Agent Rotator.
* **Responsibility:** Daily automated extraction of domestic ticket fare listings across top city pairs and 5 advance booking horizons ($T+1, T+7, T+15, T+30, T+45$).

### 2.2 Processing & Normalization Subsystem
* **Components:** Fare Component Extractor, Deduplication Engine, Tukey IQR Outlier Filter, Imputation Manager.
* **Responsibility:** Normalizes fares ($P_{comparable} = BF + UDF + ASF + GST + YQ$), removes payment fees/add-ons, deduplicates identical listings, and flags technical outliers.

### 2.3 Statistical Index Engine Subsystem
* **Components:** Tier 1 Jevons Microservice, Tier 2 Young Aggregation Microservice, DGCA Volume Weight Manager, Temporal Aggregator (Daily/Weekly/Monthly).
* **Responsibility:** Computes deterministic price indices: Jevons geometric mean at elementary route-horizon strata; Young index weighted by DGCA passenger volume shares ($w_r$).

### 2.4 Data Quality & Provenance Subsystem
* **Components:** 8-Factor Data Quality Calculator ($DQ \in [0, 100]$), Cryptographic Payload Audit Trail (SHA-256), Data Mode Router (`LIVE`, `HISTORICAL`, `SYNTHETIC`).
* **Responsibility:** Computes real-time data health scores, stores immutable provenance blocks, and manages fallback toggles for 100% demo resilience.

### 2.5 Presentation & Export Subsystem
* **Components:** Next.js Web Dashboard, FastAPI REST API, 30-Day Backtest Pipeline Engine.
* **Responsibility:** Displays real-time charts, lead-time heatmaps, DQ widgets, provenance drill-down modals, and exports CPI-compliant CSV/JSON data.

---

## 3. Technology Stack Specification

| Component | Technology Choice | Version | Justification |
|---|---|---|---|
| **Backend Framework** | FastAPI (Python) | 0.110+ | Asynchronous performance, automatic OpenAPI docs, native Pydantic integration |
| **Scraper Engines** | Playwright & Scrapy | 1.42+ | Dynamic JS DOM rendering for React OTAs + fast asynchronous HTTP parsing |
| **Database** | PostgreSQL + TimescaleDB | 16+ | Relational schema integrity + optimized time-series indexing for price observations |
| **Caching & Queues** | Redis + Celery | 7.2+ | Rate-limited scraper task queue management and fast dashboard caching |
| **Frontend UI** | React / Next.js + TailwindCSS | 14+ | Modern dark-theme responsive UI, fast SSR, Recharts visualizer |
| **Data Science / Math** | NumPy, Pandas, SciPy, Statsmodels | 2.2+ | High-performance vector math for Jevons/Young index calculations |
| **Containerization** | Docker & Docker Compose | 25+ | Zero-dependency deployment across Windows/Linux/macOS |
