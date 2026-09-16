# Phase D: Index Engine - Implementation Report

## Executive Summary
Phase D implemented the core statistical Index Engine subsystem, introducing Tier 1 (Jevons) and Tier 2 (Young/Modified Laspeyres) methodologies. The engine is read-only with respect to Phase C normalization data and successfully isolates booking horizons and data modes.

## 1. Methodologies Implemented

### 1.1 Jevons Primary Methodology
- **Scope**: Tier 1 (Elementary Route Index) and supported at Tier 2.
- **Implementation**: Computes the unweighted geometric mean of comparable price relatives.
- **Safety**: Rejects zero and negative fares explicitly. Excludes invalid/outlier observations.
- **Matching**: Matches flights exactly on `(route_id, booking_horizon, flight_number)` against aggregated base date reference prices.

### 1.2 Young / Modified Laspeyres Secondary Methodology
- **Scope**: Tier 2 (National Aggregate Index) only.
- **Implementation**: Computes the DGCA-volume-weighted arithmetic mean of Tier 1 elementary indices.
- **Weights**: Configured DGCA passenger volume weights dynamically normalize to sum to 1.

## 2. Configuration & Reference

### 2.1 Reference Period & Base Index
- The default base value is set to `100.0000`.
- The `base_date` (reference period) is configurable per execution. Missing reference fares result in skipped calculations rather than synthetic fabrication.

### 2.2 Booking Horizon Segregation
- Strict segregation maintained. Elementary and National indices are calculated and persisted separately for `T+1`, `T+7`, `T+15`, `T+30`, and `T+45`.

## 3. Data Safety and Quality

### 3.1 Numerical Handling
- Used Python's `math.exp` and `math.log` for numerical stability with geometric means.
- `Decimal` is used across the pipeline for exact precision when writing database records.

### 3.2 Data Mode Isolation
- The `data_mode` (`LIVE`, `HISTORICAL`, `SYNTHETIC`) is propagated from Phase C and fully isolates indices. Synthetic outputs are distinctly labeled in the database.

## 4. Subsystem Components

- **Index Engine Service**: `app/services/index_engine.py` encapsulating the business logic.
- **API**: Endpoints exposed in `app/api/v1/index.py` allowing deterministic calculation and retrieval of indices by methodology and horizon.
- **Database Schema**: Created Alembic Migration `006_phase_d_index_engine` to add `methodology`, `data_mode`, and `coverage_pct` to the existing index tables.

## 5. PostgreSQL Status
- SQLite test suite executed; PostgreSQL integration not executed (PostgreSQL unavailable in current environment).

## 6. Limitations
- Coverage computation currently simplifies to a basic percentage of observed routes against active target routes.
- Advanced daily/weekly/monthly temporal aggregations are foundational; future integration with chronological rollups is expected in reporting.

## 7. Next Steps
- Phase E has NOT been started.
