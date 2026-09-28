# AIRFACE (SIH26056) — UI/UX Design System & Compliance Report

## 1. Design Philosophy

The AIRFACE user interface is styled as an **official-grade data intelligence platform**:
- **Palette:** Deep Obsidian (`#090d16`), Atmospheric Navy (`#0f172a`), Electric Cyan (`#06b6d4`), Amber Gold (`#f59e0b`), Emerald (`#10b981`), Soft White (`#f8fafc`).
- **Typography:** Monospace for prices, hashes, and dates; Clean Sans-Serif for headers and descriptive analysis.
- **Tone:** Professional, government/macroeconomic intelligence, technical, trustworthy.
- **Restraint:** Zero gratuitous gaming animations, zero fake 3D widgets, zero random decorative chatbot popups.

---

## 2. Mandatory State Boundaries

Every dashboard page implements `StateBoundary`:
1. **Loading State:** Clean skeleton or spinner indicating active data retrieval.
2. **Error State:** Descriptive error banner with "Retry" action.
3. **Empty / No-Data State:** Explicit `NO DATA AVAILABLE` message explaining why data is absent instead of rendering misleading zeroes.
4. **Data Mode Banner:** Obvious, color-coded badge in the header indicating `LIVE`, `HISTORICAL DEMO`, or `SYNTHETIC DEMO`.

---

## 3. Page Catalog (11 Integrated Modules)

1. **Overview (`/`):** Executive macroeconomic indicator, national index trend, horizon preview, and quick access control room.
2. **Route Intelligence (`/route-explorer`):** Search and filter all 9 Indian domestic corridors across 5 booking horizons with Jevons index trajectories.
3. **Booking Horizons (`/booking-horizon`):** Escalation curve visualization across T+1, T+7, T+15, T+30, and T+45.
4. **Index Analytics (`/index-analytics`):** Methodological comparison between Jevons and Young formulas, plus DGCA traffic volume weights basket.
5. **Data Quality (`/data-quality`):** 8-Factor composite score radar and historical score trajectories.
6. **Observation Cleaning (`/data-cleaning`):** Interactive inspector for raw, parsed, normalized, and excluded outlier observations.
7. **Collection Monitor (`/collection-monitor`):** Adapter health monitoring, latency telemetry, and manual pipeline trigger.
8. **Validation & Backtesting (`/backtest`):** Temporal validation metrics (MAPE, RMSE, Pearson r, Directional Accuracy) with disclosures.
9. **Provenance Explorer (`/provenance`):** Interactive cryptographic lineage graph from national aggregate to SHA-256 raw checksum.
10. **System Status (`/system-status`):** Infrastructure telemetry across frontend, backend, database, cache, workers, and adapters.
11. **Methodology (`/methodology`):** Formal mathematical specifications, axiomatic properties, and project engineering decisions.
