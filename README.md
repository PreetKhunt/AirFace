# SIH26056 — Real-Time Airfare Price Index for India

**Disclaimer:** This software is a prototype built for the Smart India Hackathon (SIH). It demonstrates technical feasibility and methodological correctness for dynamically indexing airfares. **It is not, and does not replace, India's official Consumer Price Index (CPI).**

## 1. What SIH26056 Asks
The Ministry of Statistics and Programme Implementation (MoSPI) requires an automated web-scraping and analytical system to track highly dynamic airline pricing. Because airfares change based on the advance booking window, a simple daily average is insufficient. The system must collect data, clean it, and compute a representative price index to augment the official CPI.

## 2. What We Built
We built an end-to-end, reproducible data pipeline and monitoring dashboard. 
- A distributed web-scraping fleet.
- A robust data normalization and outlier rejection engine.
- A two-tier macroeconomic index calculator.
- An automated backtesting engine for statistical validation.
- A Next.js visual dashboard tailored for data provenance and transparency.

## 3. Architecture
- **Backend**: Python 3, FastAPI, SQLAlchemy, Alembic.
- **Task Queue**: Celery + Redis (for asynchronous scraping).
- **Database**: PostgreSQL with TimescaleDB (for time-series data); falls back gracefully to SQLite for local development.
- **Frontend**: Next.js 14, React, Tailwind CSS, Recharts.

## 4. Data Pipeline
1. **Ingestion**: Raw HTML DOM payloads are scraped and stored with SHA-256 hashes.
2. **Parsing**: Gross totals, base fares, and explicit taxes are extracted.
3. **Normalization**: Fares are reduced to comparable index components ($Base Fare + YQ + Mandatory Taxes$), stripping out optional convenience fees.
4. **Deduplication**: Identical flights found across multiple OTAs are consolidated.
5. **Quality Check**: Tukey's IQR bounding removes anomalous prices.

## 5. Index Methodology
Aligned with the **IMF/ILO CPI Manual (2020)**:
- **Booking Horizons**: Fares are stratified by advance lead times ($T+1, T+7, T+15, T+30, T+45$).
- **Tier 1 (Elementary Route Index)**: Unweighted Jevons Geometric Mean (satisfies the Time Reversal Test).
- **Tier 2 (National Aggregation)**: Young / Modified Laspeyres formula, weighted using official DGCA passenger volume proportions.

## 6. Data Modes
To ensure the integrity of the live data, the application enforces strict isolation:
- **LIVE**: Actual data collected from the internet.
- **HISTORICAL**: Frozen snapshots of real data used for backtesting.
- **SYNTHETIC**: Mathematically manufactured data specifically for testing extreme edge-cases.

## 7. Validation
The system includes an automated 30-day temporal backtester. It aligns the calculated scraped index against reference baselines to compute MAPE, RMSE, Pearson $r$, Mean Bias, and Directional Accuracy.

## 8. How to Run (Development)
```bash
# 1. Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --reload

# 2. Setup Frontend
cd frontend
npm install
npm run dev
```

## 9. How to Run Demo (Deterministic Reset)
To populate the application with a clean, repeatable demonstration dataset (without needing Redis/Celery):
```bash
cd backend
python scripts/reset_demo_sync.py
```
This drops the SQLite database, migrates the schema, ingests synthetic/historical fixtures, runs normalization, computes indices, and runs backtests.

## 10. Known Limitations
- Next.js build encounters an SWC binary incompatibility on some Windows Node 24 architectures (bypassed via `.babelrc`).
- Live scraping requires a running instance of Redis; it will fail safely if offline.
- Backtest statistical validity relies on the accuracy of the provided reference baseline data.
