# Testing & Verification Guide
## SIH26056 -- Real-Time Airfare Price Index for India

---

## 1. Running Automated Tests

Run backend tests using `pytest`:

```bash
# Run all automated tests
python -m pytest backend/tests -q

# Run Phase C specific test suites
python -m pytest backend/tests/test_phase_c_normalization.py -v
python -m pytest backend/tests/test_phase_c_api.py -v
```

---

## 2. Test Coverage Summary

- **Phase A (Foundation):** Configuration, database session, base model registry, Celery initialization.
- **Phase B (Data Engine & Adapters):** Fixture loading (450 historical rows, 90 synthetic rows), live adapter safety floor, channel-separated duplicate identity, transaction savepoint isolation, SHA-256 provenance trail.
- **Phase C (Quality & Normalization):**
  - Fare component calculation ($P_{\text{comparable}} = BF + UDF + ASF + GST + YQ$) with double-counting safeguards.
  - Exclusion of convenience fees and inclusion of fuel surcharge (YQ).
  - Commercial-equivalence deduplication across sources with complete evidence preservation.
  - Objective statistical outlier screening (IQR + robust median bounds) distinguishing legitimate market surges from technical anomalies.
  - Deterministic 8-dimension Data Quality scoring in $[0.00, 100.00]$.
  - Default no-imputation policy.
  - Full end-to-end integration flow from fixture ingestion to `normalized_index_observations`.
- **Phase D (Index Engine):**
  - Deterministic Tier 1 Jevons elementary indices matching against reference fares.
  - Deterministic Tier 2 national indices with both Jevons and Young / Modified Laspeyres methodologies.
  - Verification of booking horizon separation (T+1 through T+45).
  - Implicit zero/negative fare protections and exclusion of invalid observations.
- **Phase E (Validation & Backtesting Engine):**
  - Execution of temporal-aligned backtests returning objective statistical values: MAPE, RMSE, Pearson Correlation, Bias, and Directional Accuracy.
  - Zero-reference division safety nets.
  - Detection and explicit declaration of insufficient statistical data volume (e.g. fewer than 2 matched samples for Pearson).
  - Complete data isolation protecting testing metrics against Synthetic dataset pollution.