# Functional Requirements Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Data Ingestion & Scraping Requirements (FR-001 to FR-006)

| Req ID | Requirement Title | Detailed Specification | Priority | Status Tag | Traceability |
|---|---|---|---|---|---|
| **FR-001** | Multi-Target Web Scraping | System MUST scrape published domestic airfares from scheduled airline portals (IndiGo, Air India) and major OTAs (MakeMyTrip, Yatra, EaseMyTrip). | **MUST** | `[OFFICIAL REQUIREMENT]` | SIH26056 Statement / REQ-OFF-01 |
| **FR-002** | High-Frequency Daily Sampling | System MUST execute daily automated scraping runs across target portals at 00:00 UTC. | **MUST** | `[OFFICIAL REQUIREMENT]` | SIH26056 Statement / REQ-OFF-02 |
| **FR-003** | Multi-Lead Time Sampling | System MUST concurrently scrape fares across 5 advance booking horizons: $T+1, T+7, T+15, T+30, T+45$ days relative to collection date. | **MUST** | `[OFFICIAL REQUIREMENT]` | SIH Technical Spec / REQ-OFF-04 |
| **FR-004** | Rate Limiting Enforcement | Scraping engine MUST enforce a minimum delay of $\ge 2.0$ seconds between consecutive HTTP requests per target domain. | **MUST** | `[DERIVED ENG REQ]` | IT Act 2000 / Ethics Strategy |
| **FR-005** | Robots.txt Compliance | System MUST parse `robots.txt` before firing requests and bypass disallow paths (`/checkout`, `/booking`). | **MUST** | `[DERIVED ENG REQ]` | IT Act 2000 / Ethics Strategy |
| **FR-006** | Dynamic JS Rendering | System MUST utilize headless Playwright Chromium contexts to render client-side dynamic JavaScript DOMs on OTA portals. | **MUST** | `[DERIVED ENG REQ]` | Methodology 01 / Technical Scope |

---

## 2. Normalization & Data Quality Requirements (FR-007 to FR-012)

| Req ID | Requirement Title | Detailed Specification | Priority | Status Tag | Traceability |
|---|---|---|---|---|---|
| **FR-007** | Fare Normalization Formula | System MUST compute $P_{comparable} = \text{Base Fare} + \text{UDF} + \text{ASF} + \text{GST} + \text{Fuel Surcharge}$. | **MUST** | `[OFFICIAL REQUIREMENT]` | Methodology 02 / IMF CPI Manual |
| **FR-008** | Ancillary Fee Exclusion | System MUST strip optional convenience fees, seat selection, meal fees, extra baggage, travel insurance, and bank promo card discounts. | **MUST** | `[DERIVED ENG REQ]` | Methodology 02 / Normalization |
| **FR-009** | Multi-OTA Deduplication | System MUST match listings by `(origin, destination, airline, flight_no, travel_date, departure_time, fare_family)`, retaining minimum mandatory price for identical fare families. | **MUST** | `[DERIVED ENG REQ]` | Methodology 06 / Deduplication |
| **FR-010** | Outlier Filtering (Tukey IQR)| System MUST apply Tukey IQR bounds ($1.5 \times IQR$) to flag candidate outliers. Drop technical/parsing glitches ($<\text{₹}500$ or $>\text{₹}1,00,000$); retain multi-source market surges. | **MUST** | `[PROPOSED METHODOLOGY]` | Methodology 06 / Outlier Strategy |
| **FR-011** | Imputation of Sold-Out Slots | System MAY apply cell-mean price relative imputation ONLY for `SOLD_OUT_INVENTORY` and temporary `SCRAPER_FAILURE` for max 3 consecutive days. | **MUST** | `[PROPOSED METHODOLOGY]` | Methodology 06 / Imputation |
| **FR-012** | Data Quality Score Engine | System MUST calculate composite Data Quality Score ($DQ \in [0, 100]$) for every index run based on 8 operational sub-metrics. | **MUST** | `[PROPOSED ENGINEERING METRIC]` | Methodology 08 / Quality Engine |

---

## 3. Price Index Calculation Requirements (FR-013 to FR-018)

| Req ID | Requirement Title | Detailed Specification | Priority | Status Tag | Traceability |
|---|---|---|---|---|---|
| **FR-013** | Tier 1 Jevons Elementary Index | System MUST calculate unweighted Jevons Geometric Mean Index $I_{r,h}^{t_0:t}$ per Route $r$ and Horizon $h$ cell. | **MUST** | `[PROPOSED METHODOLOGY]` | Methodology 05 / Tier 1 Formula |
| **FR-014** | Tier 2 Young Aggregate Index | System MUST aggregate elementary route indices into a National Price Index using DGCA Passenger Volume Weights $w_r$. | **MUST** | `[PROPOSED METHODOLOGY]` | Methodology 05 / Tier 2 Formula |
| **FR-015** | Horizon Index Isolation | System MUST preserve separate independent price index series for each horizon $T+1, T+7, T+15, T+30, T+45$. | **MUST** | `[OFFICIAL REQUIREMENT]` | Methodology 03 / Horizon Rule |
| **FR-016** | Multi-Frequency Aggregation | System MUST calculate daily indices $I_d$, weekly arithmetic means $I_w$, and monthly arithmetic means $I_m$. | **MUST** | `[OFFICIAL REQUIREMENT]` | Methodology 05 / Aggregation |
| **FR-017** | Dynamic Base Rebasing | System MUST support dynamic rebasing relative to configurable baseline date $t_0$ ($I^{t_0} = 100.0$). | **MUST** | `[DERIVED ENG REQ]` | Methodology 05 / Rebasing |
| **FR-018** | Directional Route Isolation | System MUST treat route pairs $A \rightarrow B$ and $B \rightarrow A$ as strictly separate directional markets (`DEL-BOM` vs `BOM-DEL`). | **MUST** | `[VERIFIED FACT]` | Methodology 04 / Directionality |

---

## 4. Backtesting & Provenance Requirements (FR-019 to FR-024)

| Req ID | Requirement Title | Detailed Specification | Priority | Status Tag | Traceability |
|---|---|---|---|---|---|
| **FR-019** | 30-Day Automated Backtest | System MUST execute an automated 30-day backtesting pipeline evaluating index performance against historical reference streams. | **MUST** | `[OFFICIAL REQUIREMENT]` | SIH Evaluation / REQ-OFF-05 |
| **FR-020** | Backtest Metric Audit Report | System MUST compute and report MAPE, RMSE, Pearson $r$, Mean Percentage Bias, and Directional Accuracy in JSON format. | **MUST** | `[PROPOSED ACCEPTANCE TARGETS]`| Methodology 07 / Metrics |
| **FR-021** | Multi-Mode Data Router | System MUST enforce strict structural isolation between `LIVE`, `HISTORICAL`, and `SYNTHETIC` data modes. | **MUST** | `[PROPOSED METHODOLOGY]` | Methodology 09 / Data Modes |
| **FR-022** | Synthetic Data Badge Labeling | System MUST explicitly display prominent UI warning badge `[MODE: SYNTHETIC]` whenever synthetic mock data is present. | **MUST** | `[PROPOSED METHODOLOGY]` | Methodology 09 / Judging Ethics |
| **FR-023** | Cryptographic Provenance Audit | System MUST store target URL, collection timestamp, parser version, and SHA-256 payload hash for every observation. | **MUST** | `[PROPOSED METHODOLOGY]` | Methodology 09 / Provenance |
| **FR-024** | Offline Demo Toggle Mode | System MUST support 100% offline demo execution using pre-cached historical scraped databases during presentation network failures. | **MUST** | `[PROPOSED METHODOLOGY]` | Risk Register / RSK-JDG-03 |

---

## 5. User Interface & Analytics Requirements (FR-025 to FR-030)

| Req ID | Requirement Title | Detailed Specification | Priority | Status Tag | Traceability |
|---|---|---|---|---|---|
| **FR-025** | Interactive Index Visualizer | Dashboard MUST render real-time interactive line charts of national and route-level price indices with horizon and date filters. | **MUST** | `[OFFICIAL REQUIREMENT]` | Feature Spec / F6.1 |
| **FR-026** | Lead-Time Escalation Heatmap | Dashboard MUST render an advance booking horizon heatmap comparing price surge intensity across lead times ($T+1 \dots T+45$). | **SHOULD** | `[PROPOSED METHODOLOGY]` | Feature Spec / F6.2 |
| **FR-027** | Live Data Quality Widget | Dashboard MUST render a real-time widget displaying the 8-factor Data Quality Score ($DQ$) and quality band badge. | **MUST** | `[PROPOSED ENGINEERING METRIC]` | Feature Spec / F6.3 |
| **FR-028** | Formula Transparency Explorer | Dashboard MUST provide an interactive drill-down showing exact constituent Jevons values and DGCA route weights for any index point. | **SHOULD** | `[PROPOSED METHODOLOGY]` | Risk Register / RSK-JDG-02 |
| **FR-029** | CPI Data Export Microservice | System MUST provide REST API and file export endpoints returning CPI-compatible index series in JSON, CSV, and Excel formats. | **MUST** | `[OFFICIAL REQUIREMENT]` | REQ-OFF-05 / MoSPI Augmentation |
| **FR-030** | Auxiliary AI Anomaly Alerting | AI layer MAY run Isolation Forest anomaly detection to flag suspicious DOM parsing glitches with score $>0.75$. | **COULD** | `[PROPOSED METHODOLOGY]` | Feature Spec / F7.1 |
