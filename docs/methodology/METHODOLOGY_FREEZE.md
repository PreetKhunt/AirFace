# STATISTICAL & DATA METHODOLOGY FREEZE SPECIFICATION
## SIH26056 — Real-Time Airfare Price Index for India

**Sponsoring Organization:** Ministry of Statistics and Programme Implementation (MoSPI)  
**Division:** Data Informatics & Innovation Division (DIID)  
**Document Version:** 1.0.0-FREEZE  
**Status:** AUTHORITATIVE METHODOLOGY SPECIFICATION (FROZEN FOR IMPLEMENTATION)  

---

## 1. Executive Methodology Summary

This document establishes the frozen, authoritative statistical and data methodology specification for **SIH26056**. Developers building the system MUST follow these exact mathematical formulas, data schemas, processing rules, and architectural guardrails without altering statistical logic.

The system calculates a real-time domestic airfare price index for India by scraping published ticket fares across top domestic city pairs and 5 mandated advance booking horizons ($T+1, T+7, T+15, T+30, T+45$). The index uses a **Two-Tiered Structure**: unweighted **Jevons Geometric Mean Index** at the elementary route-horizon stratum level, aggregated nationally via a **Young / Modified Laspeyres Index** using **DGCA Passenger-Volume-Based Reference Weights**.

---

## 2. Official Requirements Matrix

| ID | Requirement Description | Source | Status Tag |
|---|---|---|---|
| **REQ-OFF-01** | Automated web scraping of airline portals and OTAs | SIH26056 Statement [1] | `[OFFICIAL REQUIREMENT]` |
| **REQ-OFF-02** | Real-time / daily price index computation | SIH26056 Statement [1] | `[OFFICIAL REQUIREMENT]` |
| **REQ-OFF-03** | Multi-lead time advance booking horizons ($T+1, T+7, T+15, T+30, T+45$) | SIH Technical Briefing [1] | `[OFFICIAL REQUIREMENT]` |
| **REQ-OFF-04** | 30-day historical backtesting against reference benchmarks | SIH Evaluation Criteria [1] | `[OFFICIAL REQUIREMENT]` |
| **REQ-OFF-05** | Integration-ready outputs for NSO CPI augmentation | MoSPI DIID Framework [2] | `[OFFICIAL REQUIREMENT]` |

---

## 3. Verified Facts

1.  **Fact 1 (Digital CPI Adoption):** MoSPI's February 2026 CPI Base Year Revision (Base 2024=100) expanded the Transport division weight to **12.41%** and officially adopted digital price collection via e-commerce/OTAs.
2.  **Fact 2 (DGCA Data Availability):** DGCA publishes monthly domestic city-pair passenger volume counts on `dgca.gov.in`, but does **NOT** publish a downloadable public time-series CSV of raw historical ticket purchase fares.
3.  **Fact 3 (Geometric Immunity):** The Jevons index is immune to price volatility bias, satisfying the Time Reversal Test and Transitivity Test, and is mandated by the IMF/ILO CPI Manual (2020) for web-scraped prices.
4.  **Fact 4 (Directional Asymmetry):** Routes $A \rightarrow B$ and $B \rightarrow A$ differ in airport UDF tariffs, flight slot schedules, and demand profiles.

---

## 4. Proposed Methodology Overview

*   **Tier 1 Elementary Index:** Unweighted Jevons Geometric Mean Index per cell $(r, h)$.
*   **Tier 2 National Aggregation:** Young / Modified Laspeyres Index weighted by DGCA passenger volume shares ($w_r$).
*   **Fare Normalization:** $P_{comparable} = \text{Base Fare} + \text{UDF} + \text{ASF} + \text{GST} + \text{Fuel Surcharge}$ (Excludes optional baggage, seat selection, meals, and payment convenience fees).
*   **Data Quality Score:** Mathematical 8-factor score $DQ \in [0, 100]$.
*   **Multi-Mode Engine:** Structural isolation of `LIVE`, `HISTORICAL`, and `SYNTHETIC` data modes.

---

## 5. Explicit System Assumptions

1.  **Advance Booking Horizon Propensity Weights ($\alpha_h$):** $T+15: 40\%, T+7: 25\%, T+30: 20\%, T+1: 10\%, T+45: 5\%$ (Configurable engineering proposal).
2.  **Constant Utility Economy Seat:** Scraped fares represent 1 adult passenger, economy cabin, with 15kg check-in baggage included.
3.  **Representative Route Basket:** Top 15 directional city pairs capture national domestic airfare inflation.

---

## 6. Exact Mathematical Formulas

### 6.1 Comparable Fare Formula

$$P_{comparable} = BF + UDF + ASF + GST + YQ$$

### 6.2 Tier 1 Elementary Index (Jevons Formula)

$$I_{r, h}^{t_0:t} = \left( \prod_{i=1}^{N_{r,h,t}} \frac{p_{i,t}^{r,h}}{p_{i,t_0}^{r,h}} \right)^{\frac{1}{N_{r,h,t}}} \times 100$$

### 6.3 Tier 2 National Aggregate Index (Young Formula)

$$I_{National, h}^{t_0:t} = \sum_{r \in \mathcal{R}} w_r \cdot I_{r, h}^{t_0:t} \quad \text{where } w_r = \frac{V_r}{\sum_{k \in \mathcal{R}} V_k}$$

### 6.4 Monthly Aggregated Index Formula

$$I_{m}^{M} = \frac{1}{D_M} \sum_{d=1}^{D_M} I_{d}^{d \in M}$$

### 6.5 Data Quality Score Formula

$$DQ = 0.25 C + 0.15 F + 0.15 R + 0.15 D + 0.10 (1-A)100 + 0.10 (1-M)100 + 0.10 P - 1.00 S \times 100$$

---

## 7. Exact Data Fields

*   `observation_id`: UUIDv4
*   `origin`: String(3) (IATA)
*   `destination`: String(3) (IATA)
*   `airline_code`: String(2)
*   `flight_number`: String(16)
*   `travel_date`: Date (`YYYY-MM-DD`)
*   `collection_timestamp`: DateTime (`UTC`)
*   `booking_window_days`: Integer ($1, 7, 15, 30, 45$)
*   `raw_total_fare`: Decimal(10,2)
*   `comparable_index_fare`: Decimal(10,2)
*   `collection_mode`: Enum (`LIVE`, `HISTORICAL`, `SYNTHETIC`)
*   `provenance_hash`: String(64) (SHA-256)

---

## 8. Data Processing Pipeline Architecture

```
[ Raw DOM Scraping ] ──► [ Fare Normalization ] ──► [ Deduplication & Outlier Clean ]
                                                              │
                                                              ▼
[ Tier 2 National Young Index ] ◄── [ Tier 1 Jevons Index ] ◄── [ Cell Imputation ]
```

---

## 9. Index Construction Rules

1.  Calculations run daily at 00:00 UTC.
2.  Horizon sub-indices ($T+1 \dots T+45$) are maintained independently.
3.  Rebasing uses the formula $I_{new}^t = \left( \frac{I_{old}^t}{I_{old}^{b_{new}}} \right) \times 100$.

---

## 10. Backtesting Methodology

*   Runs against 30-day historical scraped observation streams.
*   Evaluates daily index tracking performance against engineering benchmarks.

---

## 11. Validation Criteria (Proposed Acceptance Targets)

*   **MAPE:** $\le 5.0\%$
*   **RMSE:** $\le 3.0$ Index Points
*   **Pearson Correlation:** $r \ge 0.85$ (on $N \ge 15$ observation pairs)
*   **Mean Percentage Bias:** $\le \pm 2.0\%$
*   **Directional Accuracy:** $\ge 80.0\%$

---

## 12. Data Quality Methodology

*   Composite score $DQ \in [0, 100]$ evaluated on every run.
*   $DQ < 60.0$ halts automatic publication and raises a Red Alert.

---

## 13. Provenance Rules

*   Every observation contains source portal, target URL, timestamp, and SHA-256 payload hash.
*   `LIVE`, `HISTORICAL`, and `SYNTHETIC` modes are strictly isolated.

---

## 14. Known Limitations

1.  Unobserved ticket sales quantities ($q_{i,t}$) require unweighted elementary Jevons index.
2.  DGCA does not publish downloadable raw fare CSV files.
3.  Target site DOM changes require scraper maintenance.

---

## 15. Unresolved Issues

*   Exact baseline month MoSPI will assign when ingesting real-time indices into the CPI warehouse.

---

## 16. Decisions Developers MUST NOT Change (Hardcoded Standards)

1.  **Tier 1 Formula:** MUST use Jevons Geometric Mean (do NOT switch to Carli arithmetic mean).
2.  **Directional Route Isolation:** `DEL-BOM` and `BOM-DEL` MUST remain separate routes.
3.  **Synthetic Data Labeling:** Synthetic data MUST NEVER be badged or presented as live data.
4.  **Exclusion of Convenience Fees:** Payment fees MUST NOT enter `comparable_index_fare`.

---

## 17. Decisions Configurable by Configuration (`config/*.yaml`)

1.  `config/routes.yaml`: Route basket selection and DGCA passenger volume weights ($w_r$).
2.  `config/index_settings.yaml`: Base period date ($t_0$) and horizon composite weights ($\alpha_h$).
3.  `config/scraping_rules.yaml`: Request delay ($\ge 2.0$s) and retry limits.

---

## 18. Official vs Proposed Decision Summary

*   **Official:** Web scraping, daily frequency, $T+1 \dots T+45$ horizons, 30-day backtesting, NSO CPI augmentation.
*   **Proposed:** Jevons/Young index formulas, DGCA volume weights, Tukey IQR outlier rules, Data Quality Score, Multi-mode engine.

---

## 19. Final Decision Table

| Decision Area | Final Choice / Specification | Status Tag | Evidence & Primary Source |
|---|---|---|---|
| **Fare Definition** | $P_{comparable} = BF + UDF + ASF + GST + YQ$ (Excludes convenience & optional fees) | `[OFFICIAL REQUIREMENT]` | IMF/ILO CPI Manual (2020) [3] |
| **Route Directionality** | Directional Isolation ($A \rightarrow B \neq B \rightarrow A$) | `[VERIFIED FACT]` | Origin UDF variation & slot asymmetry [4] |
| **Booking Horizons** | Primary: Separate $T+1, T+7, T+15, T+30, T+45$ series. Secondary: Optional composite. | `[OFFICIAL REQUIREMENT]` | SIH26056 Technical Briefing [1] |
| **Route Weights** | DGCA Passenger-Volume-Based Reference Weights ($w_r$) | `[OFFICIAL REFERENCE DATA]` | DGCA Monthly Domestic Traffic Reports [4] |
| **Airline Weighting** | Unweighted Jevons inside elementary cells; DGCA market share for metadata only. | `[PROPOSED METHODOLOGY]` | Prevents capacity fluctuation noise |
| **Elementary Index** | Jevons Geometric Mean Index ($I_{r,h}^{t_0:t}$) | `[PROPOSED METHODOLOGY]` | IMF CPI Manual Sec 10.32 (Web Scraping) [3] |
| **National Aggregation**| Young / Modified Laspeyres Index ($I_{National}^{t_0:t}$) | `[PROPOSED METHODOLOGY]` | Accommodates DGCA reference weights $w_r$ [3] |
| **Horizon Aggregation** | Configurable optional composite ($\alpha_{T+15}=0.40, \dots$) | `[PROPOSED / CONFIGURABLE]` | Engineering proposal in `config/index.yaml` |
| **Missing Data** | Cell-mean price relative imputation for max 3 days (`ABS-01`, `ABS-03` only). | `[PROPOSED METHODOLOGY]` | Prevents cell collapse without distorting trend |
| **Sold-Out Flights** | Impute price relative using active cell flights (`is_imputed = true`). | `[PROPOSED METHODOLOGY]` | Econometric practice for unobserved items |
| **Outlier Handling** | Tukey IQR ($1.5 \times IQR$) flags glitches (dropped). Genuine market surges retained. | `[PROPOSED METHODOLOGY]` | Preserves real retail price inflation spikes |
| **Deduplication** | Match Key includes `fare_family`. Minimum price applied ONLY when conditions match. | `[DERIVED ENG REQ]` | Preserves commercial fare tier variations |
| **Base Period** | Configurable reference date $t_0$ ($I^{t_0} = 100.0$) in `config/index_settings.yaml`. | `[DERIVED ENG REQ]` | Avoids hardcoded unsupported baseline month |
| **Daily Index** | $I_d^t$ calculated daily at 00:00 UTC across all active routes & horizons. | `[OFFICIAL REQUIREMENT]` | SIH26056 Real-Time Requirement [1] |
| **Monthly Index** | $I_m^M = \frac{1}{D_M} \sum_{d=1}^{D_M} I_d^d$ (Arithmetic mean of daily indices). | `[DERIVED ENG REQ]` | Temporal alignment for CPI augmentation |
| **Backtesting** | Automated 30-day pipeline comparing calculated index vs engineering benchmarks. | `[OFFICIAL REQUIREMENT]` | SIH Judging Criteria [1] |
| **Validation Metrics** | Target thresholds: MAPE $\le 5\%$, $r \ge 0.85$, RMSE $\le 3$, Bias $\le \pm 2\%$, DA $\ge 80\%$. | `[PROPOSED ACCEPTANCE TARGETS]`| Proposed project quality targets |
| **Synthetic Data** | Isolated `SYNTHETIC` mode; explicitly badged on UI; NEVER presented as live data. | `[PROPOSED METHODOLOGY]` | Strict judging ethics guarantee |
| **AI/ML Role** | Core index is 100% deterministic math. AI used ONLY for anomaly detection & forecasting. | `[PROPOSED METHODOLOGY]` | Guarantees 100% mathematical auditability |

---

## 20. References

1. **Ministry of Statistics and Programme Implementation (MoSPI):** *Smart India Hackathon 2026 Problem Statement SIH26056*, `https://sih.gov.in`
2. **MoSPI National Statistical Office (NSO):** *Consumer Price Index (Base 2024=100) Methodological Note*, Feb 12, 2026.
3. **IMF / ILO / OECD / Eurostat:** *Consumer Price Index Manual: Concepts and Methods*, 2020.
4. **Directorate General of Civil Aviation (DGCA):** *Monthly Domestic Passenger Traffic Reports*, 2024–2026. URL: `https://www.dgca.gov.in`
