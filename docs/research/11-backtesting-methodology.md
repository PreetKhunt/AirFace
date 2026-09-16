# 30-Day Backtest Pipeline Design

---

## 1. Backtest Pipeline Architecture

To fulfill **SIH Requirement REQ-OFF-05** ("Validation of calculated index against 30-day historical reference data"), we design an automated, end-to-end backtesting pipeline.

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Ingest 30-Day Observation Stream               │
│ (Raw Scraped Records / Historical Calibrated Baseline) │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Data Cleaning & Normalization Engine            │
│ - Base fare + UDF extraction                            │
│ - Exclude convenience & ancillary fees                  │
│ - Deduplicate multi-OTA identical flight listings       │
│ - Filter Tukey IQR outliers                             │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Compute Daily Elementary Jevons Index           │
│ I_{r,h}^t = Geometric Mean of Price Relatives           │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: National Basket Aggregation (Young Index)        │
│ Apply DGCA Passenger Traffic Weights w_r                │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 5: Benchmark Alignment & Metric Evaluation         │
│ Compute MAPE, RMSE, Pearson r, Bias vs Reference Data   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 6: Generate Automated Backtest Audit Report        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Standardized Backtest Audit Report Schema

Upon execution, the backtest pipeline generates a machine-readable JSON evaluation report:

```json
{
  "backtest_run_id": "BT-2026-09-15-001",
  "evaluation_period": {
    "start_date": "2026-08-01",
    "end_date": "2026-08-30",
    "total_days": 30
  },
  "dataset_summary": {
    "total_raw_observations": 145000,
    "cleaned_valid_observations": 139200,
    "dropped_outliers": 800,
    "routes_covered": 15
  },
  "validation_results": {
    "mape_percentage": 3.42,
    "rmse_index_points": 1.85,
    "pearson_correlation": 0.912,
    "mean_percentage_bias": 0.45,
    "directional_accuracy_pct": 86.2
  },
  "compliance_status": "PASSED_SIH_BENCHMARK"
}
```
