# Frontend Dashboard Architecture Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. UI Layout & Component Wireframe Specification

The frontend application is a modern Next.js/React dark-theme dashboard designed to present real-time airfare index data, lead-time curves, collection monitor status, data quality metrics, 30-day backtest reports, and step-by-step provenance explainability.

### 1.1 Wireframe Layout (Matching Official Competition Mockup)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AIRFARE PRICE INDEX — INDIA                                  [LIVE DATA]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  National Index              Daily Change              Monthly Change       │
│      103.42                     +1.24%                     +3.18%           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                         National Airfare Trend                              │
│                      /\        /\                                           │
│                  /\ /  \______/  \___                                       │
│                                                                             │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  Top Routes                          │  Booking Horizons                    │
│                                      │                                      │
│  DEL ➔ BOM    108.2                  │  T+1   ████████                      │
│  DEL ➔ BLR    105.7                  │  T+7   ████████████                  │
│  BOM ➔ BLR    102.4                  │  T+15  ██████████████                │
│  DEL ➔ CCU    101.8                  │  T+30  ██████████                    │
│                                      │  T+45  ███████                       │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. Seven Core Dashboard Modules

### Module 1: Overview Header & National Trend
* **Metrics:** National Index ($103.42$), Daily Change ($+1.24\%$), Weekly Change ($+1.85\%$), Monthly Change ($+3.18\%$).
* **Data Mode Badge:** Prominent top-right badge (`[LIVE DATA]`, `[HISTORICAL DEMO]`, or `[SYNTHETIC MOCK]`).
* **Visualizer:** Recharts dynamic line chart displaying national airfare price index trends.

### Module 2: Route Explorer
* **Table Views:** List of 15 top domestic routes (`DEL -> BOM`, `DEL -> BLR`, `BOM -> BLR`, etc.).
* **Data Columns:** Route Code, Current Price, Jevons Index Value, Operating Airlines, Scheduled Departure Date.

### Module 3: Booking Window Lead-Time Analysis
* **Lead-Time Bar Chart:** Compares price levels across $T+1, T+7, T+15, T+30, T+45$ horizons.
* **Escalation Curve:** Visualizes advance-booking price surge curves.

### Module 4: Collection Monitor
* **Scraper Fleet Status Table:** Displays Target Portal Name (IndiGo, MakeMyTrip, EaseMyTrip), Last Collection Timestamp, Success %, Total Scraped Records, Error Count, and Active Source Mode.

### Module 5: Data Quality Score Widget
* **Gauge & Sub-Metrics:** Displays Composite $DQ$ Score ($92.4$, Green Band) alongside sub-metrics: Completeness ($98\%$), Missing % ($2\%$), Duplicate % ($1\%$), Outlier % ($0.5\%$), Provenance % ($100\%$).

### Module 6: 30-Day Backtesting Panel
* **Validation Benchmark Comparison:** Dual-line chart comparing Scraped Index vs Engineering Reference Baseline.
* **Metric Summary Cards:** MAPE ($3.42\%$), RMSE ($1.85$), Pearson $r$ ($0.912$), Bias ($+0.45\%$), Directional Accuracy ($86.2\%$).

### Module 7: Provenance & Explainability Explorer (Judge Inspection Flow)
Allows judges to click any index number and trace its complete lineage step-by-step:

```
Index = 103.42
   ↓
Route = DEL-BOM (DGCA Weight w_r = 14.2%)
   ↓
Horizon = T+7 (Departure Date: 2026-10-08)
   ↓
Airline = IndiGo (Flight 6E-2131)
   ↓
Observation ID = 9a8b7c6d-5e4f...
   ↓
Source = MakeMyTrip (Timestamp: 2026-09-15 02:00 UTC)
   ↓
Raw Price (₹5,420) ➔ Cleaned Taxes ➔ Normalized Comparable Fare (₹5,030)
   ↓
Payload Audit Trail: SHA-256 Hash Verified (a1b2c3d4e5f6...)
```
