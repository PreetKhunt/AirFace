# REST API Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Overview & Base Configuration

The system exposes a RESTful API built on FastAPI, serving index time-series, data quality metrics, backtesting triggers, and end-to-end provenance traces.

* **Base URL:** `http://localhost:8000/api/v1`
* **Format:** JSON (`application/json`)
* **Authentication:** API Key Header (`X-API-Key: <key>`) for write/admin endpoints; public GET endpoints for dashboard widgets.

---

## 2. API Endpoint Reference Table

| Method | Path | Summary | Access Level |
|---|---|---|---|
| `GET` | `/index/national` | Returns latest national price index, daily/monthly change, and trend series | Public |
| `GET` | `/index/routes` | Returns route-level price index list sorted by DGCA weight | Public |
| `GET` | `/index/horizons` | Returns price index breakdown across booking horizons ($T+1 \dots T+45$) | Public |
| `GET` | `/collection/status` | Returns scraper fleet health, success rates, and active data mode | Public |
| `GET` | `/quality/score` | Returns latest Data Quality Score ($DQ$) and 8 sub-metric breakdown | Public |
| `POST`| `/backtest/run` | Triggers automated 30-day backtest execution pipeline | Authenticated |
| `GET` | `/provenance/trace/{obs_id}` | Traces an index/observation ID back to raw HTML hash & source URL | Public |
| `POST`| `/admin/mode` | Toggles active data ingestion mode (`LIVE`, `HISTORICAL`, `SYNTHETIC`) | Admin |
| `GET` | `/cpi/export` | Downloads CPI-compatible index time-series in JSON/CSV format | Public |

---

## 3. Sample Endpoint Payloads

### 3.1 `GET /api/v1/index/national`

#### Request
`GET /api/v1/index/national?horizon=T+15&frequency=daily`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "data_mode": "LIVE",
  "baseline_period": "2026-01-01",
  "horizon": "T+15",
  "latest_index": {
    "calculation_date": "2026-09-15",
    "national_index_value": 103.42,
    "daily_change_pct": 1.24,
    "monthly_change_pct": 3.18,
    "dq_score": 92.4
  },
  "trend_series": [
    { "date": "2026-09-01", "index": 100.12 },
    { "date": "2026-09-08", "index": 101.85 },
    { "date": "2026-09-15", "index": 103.42 }
  ]
}
```

---

### 3.2 `GET /api/v1/provenance/trace/{obs_id}` (Explainability Endpoint)

#### Request
`GET /api/v1/provenance/trace/9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "trace_chain": {
    "index_summary": {
      "national_index": 103.42,
      "route_id": "DEL-BOM",
      "route_weight": 0.142,
      "booking_horizon": "T+15"
    },
    "observation_details": {
      "observation_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
      "airline_code": "6E",
      "airline_name": "IndiGo",
      "flight_number": "6E-2131",
      "travel_date": "2026-10-01",
      "departure_time": "08:00"
    },
    "fare_normalization_breakdown": {
      "raw_displayed_price": "₹ 5,420 (incl. taxes)",
      "base_fare": 4200.00,
      "udf_fee": 450.00,
      "asf_fee": 170.00,
      "gst_tax": 210.00,
      "convenience_fee_excluded": 350.00,
      "comparable_index_fare": 5030.00
    },
    "provenance_metadata": {
      "source_portal": "MakeMyTrip",
      "source_url": "https://www.makemytrip.com/flight/search?itinerary=DEL-BOM-01/10/2026",
      "collection_timestamp": "2026-09-15T02:00:00.124Z",
      "collection_mode": "LIVE",
      "parser_version": "v1.4.2",
      "payload_sha256_hash": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"
    }
  }
}
```
