# AIRFACE — DATA COMPLETENESS AUDIT

**Date:** 2026-09-24  
**Commit:** in progress  
**Backend:** https://sih-backend-kvyb.onrender.com  
**Frontend:** https://air-face-rho.vercel.app/

---

## 1. Current DB Counts

| Table | Count |
|-------|-------|
| National Aggregate Indices | 2 (1x SYNTHETIC @ T+45, 1x HISTORICAL @ T+45) |
| Elementary Route Indices | 18 (9x SYNTHETIC, 9x HISTORICAL — all at T+45) |
| Normalized Observations | ~541 |
| DQ Logs | 1 |
| Backtest Runs | 1 |
| Sources | 2 |

---

## 2. Route + Horizon Combinations with Real Index Data

All existing route index observations are at horizon **T+45** only.

| Route | Horizon | Data Mode | Index Value |
|-------|---------|-----------|-------------|
| DEL-BOM | T+45 | HISTORICAL | 100.0 |
| DEL-BLR | T+45 | HISTORICAL | 100.0 |
| BOM-BLR | T+45 | HISTORICAL | 100.0 |
| DEL-CCU | T+45 | HISTORICAL | 100.0 |
| DEL-HYD | T+45 | HISTORICAL | 100.0 |
| BOM-MAA | T+45 | HISTORICAL | 100.0 |
| DEL-PNQ | T+45 | HISTORICAL | 100.0 |
| DEL-PAT | T+45 | HISTORICAL | 100.0 |
| BOM-COK | T+45 | HISTORICAL | 100.0 |
| + same 9 routes | T+45 | SYNTHETIC | 100.0 |

**T+1, T+7, T+15, T+30 horizons have no computed index** — this is expected given the fixture CSV contains a single collection date per route.

---

## 3. Index Observations

- **2 national aggregate index observations** (base date calculation)
- **18 elementary route index observations** across 9 routes, 2 data modes
- All index values are 100.0 (base period)

---

## 4. Provenance-Traceable Observations

- Normalized observations: ~541 with parsed fare breakdown embedded
- At least one full lineage chain per route is traceable:
  - `national_index → route_index → booking_horizon → index_obs → normalized_obs → parsed_obs → raw_obs → SHA-256`
- Provenance queries now dynamically discover the first indexed route instead of hardcoding `DEL-BOM / T+1`

---

## 5. Validation Status

| Field | Value |
|-------|-------|
| Status | `INSUFFICIENT_DATA` |
| Reference Source | `MOCK_BASELINE` |
| MAPE | 0.0 |
| RMSE | 0.0 |
| Pearson r | null |
| Sample Count | 1 |

The `INSUFFICIENT_DATA` status is honest — the backtest cannot produce a meaningful Pearson correlation with a single sample point. This is displayed truthfully on both Market and Validation pages.

---

## 6. Data Mode

- `/health/system` returns `data_mode: "LIVE"` (platform is live, but data loaded is HISTORICAL/SYNTHETIC fixtures)
- Route indices: mix of `HISTORICAL` and `SYNTHETIC`
- The TopNavigation now reads `data_mode` from the live API and displays it dynamically
- The Control Room hero chart badge now reads from `sysStatus.data_mode` instead of hardcoded "LIVE DATA FEED"

---

## 7. Pages Now Populated with Real Data

| Page | Status | Notes |
|------|--------|-------|
| MARKET (Control Room) | ✅ POPULATED | National index from API, validation from backtest API |
| ROUTE INTELLIGENCE | ✅ POPULATED | Defaults to first valid route+horizon from index API |
| BOOKING HORIZON | ✅ POPULATED | Shows T+45 data (only available horizon) |
| COLLECTION ENGINE | ✅ POPULATED | Real source health + pipeline trigger |
| DATA QUALITY | ✅ POPULATED | Real DQ log from DB |
| INTEGRITY ENGINE | ✅ POPULATED | Real normalized + parsed fare components |
| PROVENANCE EXPLORER | ✅ POPULATED | Dynamic route discovery, real SHA-256 hash |
| VALIDATION/BACKTEST | ✅ POPULATED | Shows INSUFFICIENT_DATA — honest |

---

## 8. Legitimately Unavailable States

These "no data" states are **expected and honest**:

| State | Reason |
|-------|--------|
| T+1/T+7/T+15/T+30 horizon charts blank | No observations collected at those booking windows in fixture data |
| Validation: INSUFFICIENT_DATA | Only 1 sample point; Pearson r requires multiple matched pairs |
| Pearson r / Directional Accuracy: null | Mathematically impossible with sample_count=1 |

---

## 9. Fixes Applied in This Audit

1. **Route Intelligence**: `loadData` now auto-selects the first valid route+horizon from the index API. Clicking a route auto-switches horizon to avoid empty state.
2. **Provenance Explorer**: Replaced hardcoded `DEL-BOM / T+1` with dynamic discovery of first indexed route+horizon.
3. **Market Validation badge**: Now reads from `api.getBacktestResults()` — shows actual backend status (`INSUFFICIENT DATA`) instead of fabricated `PASS`.
4. **TopNavigation data mode**: Replaced hardcoded `LIVE ●` with API-driven data mode badge.
5. **Control Room hero badge**: Now reads `sysStatus.data_mode` instead of hardcoded `LIVE DATA FEED`.
6. **Route empty state**: Improved UX — shows available horizons for the selected route with one-click switch buttons.
