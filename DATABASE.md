# Database & Schema Reference
## SIH26056 -- Real-Time Airfare Price Index for India

---

## 1. Database Overview

The system uses **PostgreSQL 16** with **TimescaleDB** extensions for high-performance time-series indexing of airfare observations and calculated price indices.

---

## 2. Core Tables Summary

* `routes`: Domestic city-pair basket and DGCA volume weights ($w_r$).
* `raw_airfare_observations`: Raw DOM HTML text, collection timestamps, source URLs, and data mode (`LIVE`, `HISTORICAL`, `SYNTHETIC`).
* `parsed_airfare_observations`: Structured fare fields (`base_fare`, `udf_fee`, `asf_fee`, `gst_tax`, `yq_surcharge`, `convenience_fee`, `booking_window_days`).
* `normalized_index_observations`: Cleaned comparable fares ($P_{\text{comparable}}$), double-counting audit fields, outlier flags, availability status, commercial dedup status, and DQ score (Owned & populated by Phase C).
* `elementary_route_indices`: Tier 1 Jevons Geometric Mean values per route-horizon cell (Owned by Phase D).
* `national_aggregate_indices`: Tier 2 Young National Aggregate Index values (Owned by Phase D).
* `data_quality_logs`: Daily Data Quality Score ($DQ$) breakdowns across 8 dimensions.
* `provenance_audit_trail`: Cryptographic audit metadata and SHA-256 payload hashes for record integrity.
* `source_health`: Operational health status and success rates for scraper adapters (`HEALTHY`, `DEGRADED`, `BLOCKED`, `UNAVAILABLE`, `DISABLED`).

---

## 3. Alembic Migrations

* `001_initial_schema.py`: Core 8 tables and `datamode` enum.
* `002_source_health.py`: `source_health` table for per-adapter monitoring.
* `003_add_yq_surcharge.py`: Added `yq_surcharge` column to `parsed_airfare_observations`.
* `004_phase_c_normalization.py`: Added breakdown auditing, availability status, outlier classification, commercial dedup status, and DQ score columns to `normalized_index_observations`.
* `005_phase_c_dq_components.py`: Data quality enhancements.
* `006_phase_d_index_engine.py`: Added `methodology`, `data_mode`, and `coverage_pct` to `elementary_route_indices` and `national_aggregate_indices`.
* `007_phase_e_backtest_runs.py`: Created `backtest_runs` table for logging 30-day index validation executions.