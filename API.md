# REST API Reference Guide
## SIH26056 -- Real-Time Airfare Price Index for India

---

## 1. Quick Reference Table

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status |
| `GET` | `/api/v1/health/system` | Detailed Redis/Celery/DB operational metrics |
| `POST` | `/api/v1/ingestion/fixtures/historical` | Ingest historical fixture dataset (450 rows) |
| `POST` | `/api/v1/ingestion/fixtures/synthetic` | Ingest synthetic fixture dataset (90 rows) |
| `GET` | `/api/v1/observations` | Paginated parsed observations with query filters |
| `GET` | `/api/v1/observations/{observation_id}` | Detailed parsed observation record by UUID |
| `GET` | `/api/v1/sources` | List all tracked adapters and health statuses |
| `GET` | `/api/v1/sources/{source_name}/health` | Source health metrics and success rates |
| `POST` | `/api/v1/normalization/run` | Execute Phase C normalization pipeline |
| `GET` | `/api/v1/normalized-observations` | Paginated normalized index observations with filters |
| `GET` | `/api/v1/normalized-observations/{index_obs_id}` | Detailed normalized observation by UUID |
| `GET` | `/api/v1/quality/score` | Latest composite Data Quality score & breakdown |
| `GET` | `/api/v1/quality/history` | Historical Data Quality logs time-series |
| `POST` | `/api/v1/index/calculate` | Run Phase D calculations for Tier 1 and 2 |
| `GET` | `/api/v1/index/route` | List all elementary route indices |
| `GET` | `/api/v1/index/route/{route_id}` | Retrieve elementary indices for a route |
| `GET` | `/api/v1/index/national` | List all national aggregate indices |
| `GET` | `/api/v1/index/national/{booking_horizon}` | Retrieve national index by horizon |
| `POST` | `/api/v1/backtest/run` | Execute Phase E validation against a reference dataset |
| `GET` | `/api/v1/backtest/results` | Paginated list of past backtest runs |
| `GET` | `/api/v1/backtest/results/{backtest_id}` | Detailed backtest results and metrics |

---

## 2. Curl Usage Examples

### Execute Normalization Pipeline
```bash
curl -X POST "http://localhost:8000/api/v1/normalization/run" -H "Accept: application/json"
```

### Query Normalized Observations for Route DEL-BOM at Horizon T+7
```bash
curl -X GET "http://localhost:8000/api/v1/normalized-observations?route_id=DEL-BOM&booking_horizon=T%2B7" -H "Accept: application/json"
```

### Fetch Latest Data Quality Score
```bash
curl -X GET "http://localhost:8000/api/v1/quality/score" -H "Accept: application/json"
```