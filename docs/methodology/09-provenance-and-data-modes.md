# Provenance & Data Modes Specification

---

## 1. Multi-Mode Architecture & Strict Isolation

To maintain 100% scientific integrity and prevent presentation ambiguity during SIH judging, the system enforces **strict architectural isolation** across three operational data modes:

```
                       [ Data Ingestion Dispatcher ]
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
  [ MODE: LIVE ]             [ MODE: HISTORICAL ]        [ MODE: SYNTHETIC ]
  Scraped real-time from     Stored historical scraped   Calibrated test mock data
  active airline/OTA DOMs    time-series database        (Demo & load testing only)
```

### Data Mode Definitions & Compliance Directives

| Data Mode | Input Origin | Primary Purpose | Mandatory UI Badge | Judging Guarantee |
|---|---|---|---|---|
| **`LIVE`** | Real-time HTTP/DOM scraping | Production index generation | `[LIVE DATA]` (Green) | 100% authentic scraped quotes |
| **`HISTORICAL`** | Archived 30-day scraped database | Backtesting & time-series analysis | `[HISTORICAL DATA]` (Blue) | Preserves original collection timestamps |
| **`SYNTHETIC`** | Programmatically generated test records | Demonstration fallback & load tests | `[SYNTHETIC MOCK]` (Amber Alert) | **NEVER PRESENTED AS LIVE DATA** |

---

## 2. Ethical Judging Guardrails

> [!CAUTION]
> **STRICT JUDGING ETHICS MANDATE:**  
> 1. Synthetic or simulated mock data MUST NEVER be badged, labeled, or passed off as "Live Scraped Data".
> 2. Presenting synthetic data as live data during SIH judge evaluation is grounds for immediate disqualification.
> 3. If live network access fails during judging, the system MUST be explicitly toggled to `[MODE: HISTORICAL]` or `[MODE: SYNTHETIC]` with full UI badge visibility.

---

## 3. End-to-End Traceability Schema

Every price observation record in the database maintains an immutable **Provenance Block**:

```json
{
  "observation_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "provenance": {
    "source_portal": "MakeMyTrip",
    "source_url": "https://www.makemytrip.com/flight/search?itinerary=DEL-BOM-01/10/2026",
    "collection_timestamp": "2026-09-15T02:00:00.124Z",
    "travel_date": "2026-10-01",
    "route_id": "DEL-BOM",
    "airline_code": "6E",
    "flight_number": "6E-2131",
    "booking_horizon": "T+15",
    "collection_mode": "LIVE",
    "parser_version": "v1.4.2",
    "normalization_version": "v2.1.0",
    "payload_sha256_hash": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    "validation_status": "PASSED_NORMALIZATION"
  }
}
```

This provenance block allows NSO statisticians to inspect the exact target URL and raw HTML payload SHA-256 hash for any price quote entering the index.
