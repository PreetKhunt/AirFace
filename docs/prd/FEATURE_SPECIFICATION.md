# Feature Specification & Epics
## SIH26056 — Real-Time Airfare Price Index for India

---

## Epic 1: Automated Multi-Source Airfare Scraper Fleet

### Overview
Automated ingestion engine responsible for daily extraction of published domestic airfares across targeted airline portals (IndiGo, Air India) and major OTAs (MakeMyTrip, Yatra, EaseMyTrip).

### Features & Requirements

#### F1.1: Multi-Target Scraper Modules
* **Description:** Modular scrapers built using Playwright headless browser contexts and Scrapy engines.
* **Status Tag:** `[OFFICIAL REQUIREMENT]`
* **Requirements:**
  * Support dynamic JavaScript rendering for React/Next.js OTA search result pages.
  * Extract flight number, origin, destination, travel date, departure time, raw displayed total fare, base fare, and tax breakdown.

#### F1.2: Rate Limiting & Politeness Manager
* **Description:** Request pacing middleware enforcing ethical web scraping constraints.
* **Status Tag:** `[DERIVED ENG REQ]`
* **Requirements:**
  * Enforce a minimum delay of $\ge 2.0$ seconds between consecutive HTTP requests per target domain.
  * Rotate User-Agent headers with transparent MoSPI research bot identification string.

#### F1.3: Robots.txt & Ethics Engine
* **Description:** Pre-scraping compliance module.
* **Status Tag:** `[DERIVED ENG REQ]`
* **Requirements:**
  * Fetch and parse `robots.txt` before executing requests against any target domain.
  * Strictly bypass disallow paths (`/checkout`, `/booking`).

---

## Epic 2: Data Normalization, Deduplication & Outlier Pipeline

### Overview
Data cleaning microservice converting raw scraped DOM listings into normalized, comparable fare records.

### Features & Requirements

#### F2.1: Fare Component Normalizer
* **Description:** Isolates mandatory fare components and strips optional fees.
* **Status Tag:** `[OFFICIAL REQUIREMENT]`
* **Requirements:**
  * Compute $P_{comparable} = \text{Base Fare} + \text{UDF} + \text{ASF} + \text{GST} + \text{Fuel Surcharge}$.
  * Strip optional seat selection, meal fees, extra baggage, travel insurance, and OTA payment convenience fees.

#### F2.2: Multi-OTA Deduplication Engine
* **Description:** Resolves duplicate listings while preserving commercial fare differences.
* **Status Tag:** `[DERIVED ENG REQ]`
* **Requirements:**
  * Match key: `(origin, destination, airline_code, flight_number, travel_date, departure_time, fare_family)`.
  * Retain minimum mandatory price across verified channels for identical fare families, incrementing multi-source validation score.

#### F2.3: Outlier & Anomaly Cleaner
* **Description:** Filters technical parsing glitches while retaining genuine market price surges.
* **Status Tag:** `[PROPOSED METHODOLOGY]`
* **Requirements:**
  * Apply Tukey IQR bounds ($1.5 \times IQR$) to flag candidate outliers.
  * Drop impossible values ($<\text{₹}500$ or $>\text{₹}1,00,000$) resulting from regex parsing errors. Retain multi-source validated festival price spikes.

---

## Epic 3: Two-Tiered Price Index Microservice

### Overview
Core statistical calculation microservice implementing the frozen index formulas.

### Features & Requirements

#### F3.1: Tier 1 Elementary Jevons Index Calculation
* **Description:** Computes unweighted Jevons Geometric Mean Index for every Route $r$ and Horizon $h$ cell on day $t$.
* **Status Tag:** `[PROPOSED METHODOLOGY]`
* **Requirements:**
  * Formula: $I_{r,h}^{t_0:t} = \left( \prod_{i=1}^{N_{r,h,t}} \frac{p_{i,t}^{r,h}}{p_{i,t_0}^{r,h}} \right)^{\frac{1}{N_{r,h,t}}} \times 100$.
  * Maintain independent elementary index series for $T+1, T+7, T+15, T+30, T+45$.

#### F3.2: Tier 2 National Young Aggregate Index Calculation
* **Description:** Aggregates elementary route indices into a national price index using DGCA passenger volume weights $w_r$.
* **Status Tag:** `[PROPOSED METHODOLOGY]`
* **Requirements:**
  * Formula: $I_{National, h}^{t_0:t} = \sum_{r \in \mathcal{R}} w_r \cdot I_{r,h}^{t_0:t}$.

#### F3.3: Multi-Frequency Aggregation Engine
* **Description:** Computes daily, weekly, and monthly aggregate index series.
* **Status Tag:** `[OFFICIAL REQUIREMENT]`
* **Requirements:**
  * Compute daily index at 00:00 UTC. Compute weekly arithmetic mean $I_w$ and monthly arithmetic mean $I_m$.

---

## Epic 4: 30-Day Backtest & Statistical Validation Engine

### Overview
Automated validation microservice evaluating calculated index series against 30-day historical reference benchmarks.

### Features & Requirements

#### F4.1: Automated 30-Day Backtest Pipeline
* **Description:** Ingests 30-day historical scraped observation streams and computes validation metrics.
* **Status Tag:** `[OFFICIAL REQUIREMENT]`
* **Requirements:**
  * Evaluate MAPE, RMSE, Pearson $r$, Mean Percentage Bias, and Directional Accuracy.
  * Export machine-readable backtest JSON audit report.

---

## Epic 5: Multi-Mode Data Engine & Provenance Explorer

### Overview
Data management engine guaranteeing strict data isolation and payload auditability.

### Features & Requirements

#### F5.1: Multi-Mode Data Router (`LIVE`, `HISTORICAL`, `SYNTHETIC`)
* **Description:** Structurally isolates operational data modes.
* **Status Tag:** `[PROPOSED METHODOLOGY]`
* **Requirements:**
  * Toggle system ingestion mode between Live scraped, Historical database, and Synthetic mock data.
  * Enforce mandatory UI badge labeling on all views (`[LIVE DATA]`, `[HISTORICAL DATA]`, `[SYNTHETIC MOCK]`).

#### F5.2: Cryptographic Provenance Explorer
* **Description:** Provides full payload auditability for NSO statisticians.
* **Status Tag:** `[PROPOSED METHODOLOGY]`
* **Requirements:**
  * Store target URL, scraper timestamp, parser version, and SHA-256 payload hash for every price quote.

---

## Epic 6: Interactive Web Dashboard & Analytics UI

### Overview
User-facing web application for MoSPI statisticians, policy analysts, and SIH judges.

### Features & Requirements

#### F6.1: Real-Time Index Visualizer
* **Description:** Interactive line charts displaying national and route-level price index trends.
* **Status Tag:** `[OFFICIAL REQUIREMENT]`
* **Requirements:**
  * Filter by route, advance booking horizon ($T+1 \dots T+45$), date range, and frequency (daily/weekly/monthly).

#### F6.2: Advance Booking Horizon Heatmap
* **Description:** Heatmap visualization comparing fare escalation curves across lead times.
* **Status Tag:** `[PROPOSED METHODOLOGY]`
* **Requirements:**
  * Display color-coded pricing surge intensity matrix across routes and lead times.

#### F6.3: Real-Time Data Quality Score Indicator
* **Description:** Live dashboard widget displaying the 8-factor Data Quality Score ($DQ \in [0, 100]$).
* **Status Tag:** `[PROPOSED ENGINEERING METRIC]`
* **Requirements:**
  * Display composite $DQ$ score, quality band badge (Green/Blue/Amber/Red), and breakdown sub-metrics.

---

## Epic 7: Auxiliary AI/ML Intelligence Layer

### Overview
Operational AI modules for data quality anomaly detection and short-term forecasting.

### Features & Requirements

#### F7.1: Isolation Forest Anomaly Detection
* **Description:** Machine learning module flagging suspicious DOM parsing errors.
* **Status Tag:** `[PROPOSED METHODOLOGY]`
* **Requirements:**
  * Flag price quotes with anomaly score $>0.75$ for manual review.

#### F7.2: Prophet Short-Term Index Forecasting
* **Description:** Time-series forecasting module predicting 7-day to 30-day forward index trends.
* **Status Tag:** `[OPTIONAL INNOVATION]`
* **Requirements:**
  * Generate 7-day and 14-day forward index forecast intervals for policy planning.
