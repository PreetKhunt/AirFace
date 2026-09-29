# AIRFACE Final Frontend & Data Audit

## Scope

This audit records the frontend and data-completeness changes made against the current AIRFACE repository. The implementation preserves the existing cinematic aviation interface and uses the existing FastAPI, SQLAlchemy and deterministic fixture pipeline as the source of truth.

## Pages modified

- Root layout: browser metadata now uses `AIRFACE — Real-Time Airfare Price Index`.
- Top navigation: visible `SIH26056` product badge removed; backend-derived mode remains visible.
- Route Explorer: unavailable route/horizon combinations now state the route, horizon and status instead of showing a misleading blank chart.
- Booking Horizon: continues to consume `/index/horizons` and `/index/national` for the mandated horizon set.
- Collection Monitor: adds an implementation-accurate collection-to-API pipeline visualization while retaining the real `/pipeline/run` trigger.
- Validation: non-validated backend states, including `INSUFFICIENT_DATA`, no longer render as a successful validation state or fabricated metrics.
- Provenance Explorer: displays additional backend-resolved route, horizon, fare and data-mode fields.
- Methodology: rewritten as concise cinematic pipeline cards matching the documented normalization, deduplication, outlier, index, validation and provenance methodology.

## API endpoints consumed

`/health/system`, `/index/horizons`, `/index/national`, `/index/route`, `/normalized-observations`, `/provenance/{observation_id}`, `/backtest/results`, `/sources`, and `/pipeline/run`.

## Backend data mode and coverage

The UI reads `data_mode` from `/health/system` and related index endpoints. It renders:

- `LIVE` only for backend `LIVE`.
- `HISTORICAL DEMO` for backend `HISTORICAL` demo data.
- `SYNTHETIC DEMO` for backend `SYNTHETIC`.

The canonical `backend/scripts/seed_demo.py` uses the existing ingestion pipeline, enables deterministic synthetic base-period records, normalizes all observations, calculates indices, and creates provenance records. The version-controlled fixture registry contains the five mandated horizons (`T+1`, `T+7`, `T+15`, `T+30`, `T+45`) across the documented active route basket, including directional route identifiers.

For the local verification database created through that seed pipeline, the latest persisted data mode is `SYNTHETIC`. The active-mode API reports all five horizons as available, nine routes per horizon, and horizon observation counts of T+1: 67, T+7: 36, T+15: 36, T+30: 36, and T+45: 18. It reports 47, 18, 18, 18, and 9 elementary route-index rows respectively. The seed created 643 total raw/parsed/normalized records across modes and 643 provenance audit rows; these are local demo database counts, not claims about an external production database.

For this local run, the API uses an isolated ignored SQLite database because Docker/PostgreSQL is unavailable. Redis is also unavailable, so `/health/system` correctly reports the service as degraded while its database connection, data mode and data endpoints remain available. The frontend now turns an actual network failure into an actionable API-origin/backend-start message rather than the browser's generic “Failed to fetch”.

## Provenance and validation

Provenance remains database-backed: National/index route context is resolved through normalized and parsed observations to the raw source audit record and its SHA-256 payload hash. Validation metrics are shown only when the persisted backend status is `VALIDATED`; `INSUFFICIENT_DATA`, `REFERENCE_UNAVAILABLE`, `NOT_RUN`, and `FAILED` are presented as non-success states without invented metrics.

The local seed produced a `VALIDATED` synthetic reference run with 30/30 matches. This result is for the version-controlled synthetic demo baseline only and is not official airfare validation.

## Legitimate unavailable states

Unavailable route/horizon combinations, absent national aggregates, missing reference overlap, disabled live adapters, unavailable Redis, and empty source-health records remain explicit empty or status states. No React component supplies statistical values, fake chart points, live labels, or synthetic provenance records.

## Verification

```text
backend: python -m pytest tests -q — 95 passed

frontend: npm test -- --runInBand — 11 passed
frontend: npm exec tsc -- --noEmit — passed
frontend: npm run lint — passed
frontend: npm run build — passed
```

The configured npm cache and prefix were inspected before installation. Local frontend dependencies were installed with the project lockfile. The frontend Jest expectation for the intentionally revised methodology heading was updated.

## Assumptions

- Existing database contents are authoritative at runtime; the frontend does not seed or synthesize data.
- The canonical deterministic demo seed is the supported way to populate a fresh database.
- The synthetic reference baseline is disclosed as a prototype benchmark, not official airfare microdata.
- The repository `.gitignore` was UTF-16 encoded and was not being parsed by Git; it was converted to UTF-8 so generated environments, caches and local SQLite databases are ignored correctly.
