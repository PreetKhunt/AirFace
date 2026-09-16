# SIH26056 -- Phase C Correction Gate Report
## Data Quality & Fare Normalization Engine Corrections

**Date:** 2026-09-15  
**Status:** COMPLETED & VERIFIED  
**Sponsoring Organization:** Ministry of Statistics and Programme Implementation (MoSPI)

---

## 1. Issues Discovered & Exact Fixes

### 1.1 Outlier Ceiling Bug (Issue 1)
- **Problem:** `surge_ceiling = max(upper_fence, median_fare * 3.5)` allowed extreme fares above $3.5\times \text{median}$ to be misclassified as `POSSIBLE_MARKET_SURGE` whenever the statistical IQR `upper_fence` was wide.
- **Fix:** Enforced strict priority logic in `backend/app/services/outlier.py`:
  - `fare > 3.5 * median` $\rightarrow$ `TECHNICAL_OUTLIER` (`valid_for_index = False`).
  - `fare <= upper_fence` $\rightarrow$ `VALID_OBSERVATION` (`valid_for_index = True`).
  - `upper_fence < fare <= 3.5 * median` $\rightarrow$ `POSSIBLE_MARKET_SURGE` (`valid_for_index = True`).
  - `fare < lower_fence` or `fare <= 0` $\rightarrow$ `TECHNICAL_OUTLIER` (`valid_for_index = False`).

### 1.2 Partial-Component & Inconsistent Total Validation (Issues 2 & 6)
- **Problem:** `comparable_fare = raw_total - convenience_fee` could become zero/negative if `raw_total <= convenience_fee`, or accept negative fare components without error.
- **Fix:** Implemented strict structural validation in `backend/app/services/normalization.py`:
  - Validates `convenience_fee < raw_total_fare` and `raw_total_fare > 0`.
  - Rejects any negative component (`base_fare < 0`, `udf_fee < 0`, etc.) with `INVALID_COMPONENTS` (`valid_for_index = False`).
  - Flags `INCONSISTENT_TOTAL` if components sum differs from raw total, and safely sets `valid_for_index = False`.
  - Allows total-only fallback only if `raw_total - convenience_fee > 0`.

### 1.3 Late-Arriving Cross-Source Deduplication (Issue 3)
- **Problem:** Deduplication only checked within the active execution batch. A subsequent batch containing an equivalent OTA observation for an already-normalized direct flight resulted in two index-eligible records.
- **Fix:** Implemented database-aware deduplication in `backend/app/services/deduplication.py`:
  - Compares newly arriving commercial keys against existing `valid_for_index = True` records in `normalized_index_observations`.
  - Marks newly arriving matching records as `COMMERCIAL_DUPLICATE` (`valid_for_index = False`) with reason `COMMERCIAL_DUPLICATE_OF_EXISTING_<primary_obs_id>`.
  - Preserves all raw and parsed records intact.

### 1.4 Elimination of DQ Placeholders (Issue 4)
- **Problem:** Hardcoded placeholder constants (`95.0`, `100.0`, `0.0`) existed in `data_quality.py`.
- **Fix:** Replaced with 100% empirical calculations in `backend/app/services/data_quality.py`:
  - **Completeness:** Actual unique route-horizon cells populated / 45 * 100.
  - **Validity:** Actual proportion of observations with `NormalizationStatus.VALID`.
  - **Consistency:** Actual proportion with matching component breakdowns.
  - **Timeliness:** Computed from actual `RawAirfareObservation.collection_timestamp` relative to current time.
  - **Source Reliability:** Computed from `SourceHealth.success_rate_pct` in the DB or current batch.
  - **Dedup Integrity:** Measured proportion of non-duplicate commercial observations.
  - **Outlier Cleanliness:** $100.0 \times (1.0 - \text{technical\_outlier\_rate})$.
  - **Availability Coverage:** Proportion of non-missing/non-sold-out records.
  - **Synthetic Share:** Measured from `RawAirfareObservation.collection_mode == SYNTHETIC`.
  - **Provenance Integrity:** Measured from `ProvenanceAuditTrail` records in DB.
  - **Weight validation:** Enforces $\sum \text{weights} = 1.0$ (raises `ValueError` on invalid weight configurations).

---

## 2. Database Changes & Migrations

- **Migration ID:** `004_phase_c_normalization.py` (Revises: `003_add_yq_surcharge`).
- **Columns added to `normalized_index_observations`:**
  `raw_displayed_total`, `component_sum`, `normalization_status`, `normalization_reason`, `availability_status`, `outlier_status`, `commercial_dedup_status`, `dq_score`.

---

## 3. Automated Test Verification Results

Executed test command:
```powershell
python -m pytest backend/tests -q
```

**Result:**
```
..................................................................       [100%]
66 passed, 2 warnings in 3.61s
```

All 66 automated tests passed:
- `test_phase_c_corrections.py` (16 regression tests covering all gate requirements)
- `test_phase_c_normalization.py` (14 unit & integration tests)
- `test_phase_c_api.py` (2 API & Celery tests)
- `test_hardening_gate.py` (14 tests)
- `test_adapters.py`, `test_parser.py`, `test_ingestion_service.py`, `test_ingestion_api.py`, `test_phase_b_celery.py`, `test_models.py`, `test_health.py`, `test_config.py`, `test_celery.py` (20 tests)

---

## 4. Environment & PostgreSQL Limitation Note

- Tests were executed using an in-memory SQLite database simulating full schema integrity, savepoints, foreign keys, and indexes.
- Local PostgreSQL service was not running on the development machine; all code and migrations are written to standard SQLAlchemy and PostgreSQL DDL specifications.

---

## 5. Scope Boundary Verification

> **"Phase D has NOT been started."**

Phase C is fully corrected, hardened, and verified. Awaiting explicit instruction before starting Phase D (Index Engine).