# SIH26056 -- Phase C Implementation Report
## Data Quality & Fare Normalization Engine

**Date:** 2026-09-15  
**Status:** COMPLETED & VERIFIED (CORRECTED)  
**Sponsoring Organization:** Ministry of Statistics and Programme Implementation (MoSPI)

---

## 1. Phase C Objective

Phase C completes the second major layer in the data pipeline:

$$\text{RAW AIRFARE} \longrightarrow \text{PARSED AIRFARE} \longrightarrow \mathbf{\text{PHASE C (Normalization, Dedup, Outliers, DQ)}} \longrightarrow \mathbf{\text{NORMALIZED INDEX OBSERVATION}}$$

Phase C transforms parsed airfare components into audit-ready, standardized comparable fares ($P_{\text{comparable}}$), enforces double-counting safeguards, performs database-aware commercial-equivalence deduplication across sources without destroying raw evidence, classifies genuine market surges versus technical anomalies, evaluates deterministic 8-dimensional Data Quality scores, and persists validated records to `normalized_index_observations`.

---

## 2. Fare Normalization Rules & Double-Counting Safeguards

### 2.1 Comparable Fare Formula (Frozen Methodology)
$$P_{\text{comparable}} = \text{Base Fare} + \text{UDF} + \text{ASF} + \text{GST} + \text{YQ}$$

### 2.2 Excluded Items
- Convenience fees
- Optional baggage
- Seat selection fees
- Payment / bank promotional discounts
- Ancillary add-ons

### 2.3 Double-Counting Prevention Logic
1. **Full Component Breakdown:** If `base_fare`, `udf_fee`, `asf_fee`, `gst_tax`, and `yq_surcharge` are present:
   - Evaluates $\text{component\_sum} = \text{base\_fare} + \text{udf\_fee} + \text{asf\_fee} + \text{gst\_tax} + \text{yq\_surcharge}$.
   - If $\text{component\_sum} == \text{raw\_total\_fare}$ or $\text{component\_sum} == (\text{raw\_total\_fare} - \text{convenience\_fee})$:
     - Sets $P_{\text{comparable}} = \text{component\_sum}$, `normalization_status = VALID`, `normalization_reason = "FULL_BREAKDOWN_EXACT"`, `valid_for_index = True`.
   - If $\text{component\_sum} \neq \text{raw\_total\_fare}$:
     - Flags as `INCONSISTENT_TOTAL` with full audit trace, sets `valid_for_index = False`.
2. **Total-Only / Partial Breakdowns:**
   - Falls back to $P_{\text{comparable}} = \text{raw\_total\_fare} - \text{convenience\_fee}$ with status `PARTIAL_COMPONENTS` only if $P_{\text{comparable}} > 0$.
   - Rejects cases where `raw_total <= convenience_fee` or negative components exist (`INVALID_COMPONENTS`, `valid_for_index = False`).
3. **No Arbitrary Fare Floors:**
   - No hard-coded ₹500 minimum floor is applied; legitimate flash sales (e.g. ₹450) remain valid unless rejected by structural validation.

---

## 3. Missing & Availability Classification

Observations are explicitly categorized into discrete operational states:
- `VALID`: Flight available with valid fare components.
- `SOLD_OUT`: Flight fully booked (market signal; not imputed).
- `NO_SERVICE`: No route operation on scheduled date (not imputed).
- `SCRAPER_FAILURE`: Collection error at adapter level (not imputed).
- `MISSING_FARE`: Non-positive or absent price quote.
- `INVALID_OBSERVATION`: Structural schema defect.

**Default Imputation Policy:** `is_imputed = False`, `imputation_method = None`. No automatic imputation is applied to sold-out or scraper-failed flights.

---

## 4. Database-Aware Commercial-Equivalence Deduplication

- **Commercial Identity Tuple:**
  $$(\text{origin}, \text{destination}, \text{airline\_code}, \text{flight\_number}, \text{travel\_date}, \text{departure\_time}, \text{booking\_window\_days}, \text{cabin\_class}, \text{fare\_family})$$
- **Evidence Preservation:**
  - Original raw and parsed observation records from all sources (direct airline, OTAs) remain 100% intact in the database for provenance and auditing.
- **Index Resolution (Batch + Database Aware):**
  - For unique flights: `commercial_dedup_status = UNIQUE`, `valid_for_index = True`.
  - For duplicate clusters across sources or batches (e.g. IndiGo Direct in batch 1, MakeMyTrip in batch 2):
    - Designates the primary canonical observation: `commercial_dedup_status = PRIMARY_CANONICAL`, `valid_for_index = True`.
    - Designates secondary duplicate records: `commercial_dedup_status = COMMERCIAL_DUPLICATE`, `valid_for_index = False`, `normalization_reason = "COMMERCIAL_DUPLICATE_OF_<primary_obs_id>"`.

---

## 5. Outlier & Market Surge Policy

Evaluated per $(\text{route\_id}, \text{booking\_horizon})$ cell using IQR and robust $3.5\times \text{median}$ ceiling:
- **`VALID_OBSERVATION`:** $P_{\text{comparable}} \in [Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]$. `is_outlier = False`, `valid_for_index = True`.
- **`POSSIBLE_MARKET_SURGE`:** $P_{\text{comparable}} \in (Q_3 + 1.5 \times IQR, 3.5 \times \text{median}]$.
  - **Preserved for Index Calculation:** `is_outlier = True`, `valid_for_index = True`. Legitimate high-demand airfare surges are real economic signals that must be captured in the price index.
- **`TECHNICAL_OUTLIER`:** $P_{\text{comparable}} > 3.5 \times \text{median}$ or $P_{\text{comparable}} < Q_1 - 1.5 \times IQR$ or non-positive.
  - **Disqualified from Index:** `is_outlier = True`, `valid_for_index = False`.

---

## 6. Empirical Data Quality Scoring

Calculates multi-dimensional Data Quality score in $[0.00, 100.00]$ derived from empirical data without hardcoded placeholders:

| Dimension | Configurable Weight | Description |
|---|---|---|
| Completeness | 0.20 | Percentage of 45 route-horizon cells populated |
| Validity | 0.20 | Percentage of observations with VALID status |
| Consistency | 0.15 | Percentage with exact component sum breakdown |
| Timeliness | 0.10 | Empirical data freshness relative to collection timestamp |
| Source Reliability | 0.10 | Measured success rate from SourceHealth table in DB |
| Dedup Integrity | 0.10 | Proportion of non-duplicate commercial observations |
| Outlier Cleanliness | 0.10 | Absence of corrupt technical outliers |
| Availability Coverage | 0.05 | Proportion of non-missing/non-sold-out flights |

*Weights must sum to 1.0 (validated at runtime).*

---

## 7. Database Changes & Alembic Migration

- **Migration ID:** `004_phase_c_normalization.py`
- **Revises:** `003_add_yq_surcharge`
- **Columns added to `normalized_index_observations`:**
  - `raw_displayed_total` (Numeric 10, 2)
  - `component_sum` (Numeric 10, 2)
  - `normalization_status` (VARCHAR 32)
  - `normalization_reason` (VARCHAR 256)
  - `availability_status` (VARCHAR 32)
  - `outlier_status` (VARCHAR 32)
  - `commercial_dedup_status` (VARCHAR 32)
  - `dq_score` (Numeric 5, 2)

---

## 8. REST API & Celery Endpoints

- `POST /api/v1/normalization/run` -- Execute Phase C normalization pipeline over parsed observations.
- `GET /api/v1/normalized-observations` -- Paginated normalized observations with query filters (`route_id`, `booking_horizon`, `valid_for_index`, `is_outlier`, `normalization_status`).
- `GET /api/v1/normalized-observations/{index_obs_id}` -- Single observation details.
- `GET /api/v1/quality/score` -- Latest composite Data Quality score and breakdown.
- `GET /api/v1/quality/history` -- Historical Data Quality log time-series.
- Celery Task: `app.tasks.normalization_tasks.normalize_observations_task`.

---

## 9. Automated Verification & Test Results

Executed full test suite:
```bash
python -m pytest backend/tests -q
```

**Result:**
```
..................................................................       [100%]
66 passed, 2 warnings in 3.61s
```

All 66 tests passed cleanly:
- `test_phase_c_corrections.py` (16 regression tests)
- `test_phase_c_normalization.py` (14 unit & integration tests)
- `test_phase_c_api.py` (2 API & Celery tests)
- `test_hardening_gate.py` (14 tests)
- `test_adapters.py`, `test_parser.py`, `test_ingestion_service.py`, `test_ingestion_api.py`, `test_phase_b_celery.py`, `test_models.py`, `test_health.py`, `test_config.py`, `test_celery.py` (20 tests)

---

## 10. Scope Boundary Verification

- [x] Phase A (Foundation & Bootstrap) -- **COMPLETED**
- [x] Phase B (Data Engine & Ingestion Adapters) -- **COMPLETED**
- [x] Phase B Hardening Gate -- **COMPLETED**
- [x] Phase C (Data Quality & Fare Normalization Engine) -- **COMPLETED & VERIFIED**
- [ ] Phase D (Index Engine: Jevons, Young, National Aggregation) -- **NOT STARTED**
- [ ] Phase E (Validation & 30-Day Backtest Pipeline) -- **NOT STARTED**
- [ ] Phase F (Dashboard & Frontend Visualization) -- **NOT STARTED**

> **"Phase D has NOT been started."**