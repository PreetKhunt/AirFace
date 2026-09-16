# Final Scope Audit
## SIH26056 — Real-Time Airfare Price Index

This document audits the major functionality implemented in the final prototype against the official problem statement and methodology.

### 1. Official SIH Requirements
*These features were explicitly demanded by the MoSPI SIH26056 problem statement.*
- **Automated Web Scraping**: Implemented via modular Python adapters for Airlines and OTAs.
- **Dynamic Pricing Integration**: Implemented via $T+1$ through $T+45$ booking horizon stratus.
- **Airfare Price Index Calculation**: Implemented via the dual-tier calculation engine.
- **Data Quality & Cleaning**: Implemented via the normalizer and 8-factor DQ scoring system.
- **Dashboard Interface**: Implemented via the Next.js React application.

### 2. Derived Engineering Requirements
*These features were technically necessary to robustly fulfill the official requirements.*
- **Database Architecture**: PostgreSQL / TimescaleDB (fallback SQLite) to store longitudinal time-series data.
- **Background Task Processing**: Celery + Redis to prevent long-running scrapers from blocking the main API thread.
- **Data Mode Isolation**: Strict separation of `LIVE`, `HISTORICAL`, and `SYNTHETIC` namespaces to prevent demo data from poisoning official calculations.
- **Cryptographic Provenance**: SHA-256 payload hashing to provide auditability for federal regulators.

### 3. Project Methodology
*These are the specific mathematical/economic choices made to satisfy the "Index Calculation" requirement based on the IMF/ILO CPI Manual.*
- **Tier 1 (Elementary)**: Jevons Geometric Mean (chosen to satisfy the Time Reversal Test).
- **Tier 2 (Aggregation)**: Young / Modified Laspeyres formula using static passenger volume weights.
- **Outlier Rejection**: Tukey's Interquartile Range (IQR) method to automatically drop pricing anomalies.

### 4. Proposed Innovation
*These features exceed the strict baseline of the problem statement and serve as competitive differentiators.*
- **30-Day Automated Backtesting Engine**: Automatically calculates MAPE, RMSE, Pearson $r$, and Mean Bias against a reference baseline to quantitatively prove the scraper's accuracy.
- **Visual Provenance Explorer**: An interactive UI module allowing judges to trace a macroscopic index value step-by-step backward to the raw HTML DOM snippet.
- **Live Scraper Fleet Monitor**: Real-time health, latency, and success-rate telemetry for the web-scraping fleet.

**Audit Conclusion:** No proposed innovation was accidentally misrepresented as an official federal requirement. The statistical methodology strictly adheres to established macroeconomic standards.
