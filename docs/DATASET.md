# AIRFACE (SIH26056) — Dataset & Fixture Specification

## 1. Overview

The AIRFACE platform incorporates deterministic, version-controlled fixture datasets alongside live scraping adapters. The dataset is specifically constructed to evaluate and exercise every phase of the statistical pipeline (Ingestion, Parsing, Normalization, Deduplication, Outlier Handling, Data Quality Scoring, Tier 1 Elementary Jevons Index, Tier 2 DGCA-Weighted National Index, and Statistical Backtesting).

---

## 2. Dataset Structure

### A. Corridors & Route Basket (9 Key Indian Domestic Routes)
| Route ID | Origin | Destination | Classification | DGCA Volume Weight |
|---|---|---|---|---|
| `DEL-BOM` | Delhi (DEL) | Mumbai (BOM) | Metro – Metro | 24.50% |
| `DEL-BLR` | Delhi (DEL) | Bengaluru (BLR) | Metro – Metro | 18.20% |
| `BOM-BLR` | Mumbai (BOM) | Bengaluru (BLR) | Metro – Metro | 14.10% |
| `DEL-CCU` | Delhi (DEL) | Kolkata (CCU) | Metro – Metro | 11.80% |
| `DEL-HYD` | Delhi (DEL) | Hyderabad (HYD) | Metro – Metro | 9.60% |
| `BOM-MAA` | Mumbai (BOM) | Chennai (MAA) | Metro – Metro | 8.20% |
| `DEL-PNQ` | Delhi (DEL) | Pune (PNQ) | Metro – Tier 2 | 5.20% |
| `DEL-PAT` | Delhi (DEL) | Patna (PAT) | Metro – Tier 2 | 4.60% |
| `BOM-COK` | Mumbai (BOM) | Kochi (COK) | Metro – Tier 2 | 3.80% |

### B. Advance Booking Horizons (5 Mandated Windows)
- **T+1:** 1 day advance booking (Departure date = Collection date + 1 day)
- **T+7:** 7 days advance booking
- **T+15:** 15 days advance booking
- **T+30:** 30 days advance booking
- **T+45:** 45 days advance booking

### C. Participating Airlines
- **6E:** IndiGo
- **AI:** Air India
- **IX:** Air India Express
- **QP:** Akasa Air
- **SG:** SpiceJet

---

## 3. Data Ingestion & Component Decomposition

Every airfare observation contains explicit component breakdowns:
- `raw_total_fare`: Gross displayed price
- `base_fare`: Airline base ticket fare
- `udf_fee`: User Development Fee (Airport authority charge)
- `asf_fee`: Aviation Security Fee (Statutory fee)
- `gst_tax`: Goods & Services Tax (5% economy GST)
- `yq_surcharge`: Airline Fuel Surcharge
- `convenience_fee`: Payment / internet handling fee (strictly excluded)
- `comparable_fare`: $P_{\text{comparable}} = \text{Base} + \text{UDF} + \text{ASF} + \text{GST} + \text{YQ}$

---

## 4. Controlled Edge Cases & Pipeline Stress Tests

The dataset contains deliberately engineered, controlled scenarios to test pipeline robustness:
1. **Normal Standard Fares:** Complete breakdown where $\sum \text{Components} = \text{Raw Total}$.
2. **Convenience Fee Isolation:** Fares with non-zero convenience fees (e.g., ₹300) where $P_{\text{comp}} = \text{Raw Total} - \text{Conv Fee}$.
3. **Partial Breakdown Fallback:** Observations where explicit fees are missing but total is valid.
4. **Commercial Equivalence Duplicates:** Cross-channel observations for identical flight and date, prioritizing direct airline feeds.
5. **Component Inconsistency Anomaly:** Observations where $\sum \text{Components} \neq \text{Raw Total}$ are flagged as `INCONSISTENT_TOTAL` and disqualified from index calculations.
6. **Market Surge vs Technical Outlier:** Controlled surges ($2.0\times - 2.5\times$ median) are retained for market pricing, while extreme anomalies exceeding $3.5\times$ median are classified as `TECHNICAL_OUTLIER`.
7. **Negative Fare & Zero Protection:** Records with non-positive fares are rejected during parsing.

---

## 5. Summary of Files

- `data/fixtures/historical/airfare_historical.csv`: Verified historical time-series fixture dataset.
- `data/fixtures/synthetic/airfare_synthetic.csv`: Multi-route, multi-horizon synthetic benchmark dataset.
- `data/fixtures/synthetic/airfare_validation.csv`: 30-day continuous synthetic sequence for validation backtesting.
- `data/fixtures/reference/demo_reference_baseline.csv`: 30-day baseline reference series for statistical benchmarking.
