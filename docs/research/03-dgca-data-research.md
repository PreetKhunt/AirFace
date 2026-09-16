# DGCA Datasets & Backtest Data Verification

**Authoritative Source:** Directorate General of Civil Aviation (DGCA), Ministry of Civil Aviation, Govt of India (`https://www.dgca.gov.in`)  
**Regulatory Framework:** Aircraft Rules 1937 (Rule 135), Air Transport Circular (ATC) 02 of 2010  

---

## 1. Executive Summary & Critical Verification Status

| Investigation Item | Official Status | Verification Result |
|---|---|---|
| **DGCA Passenger Traffic Data** | Available on `dgca.gov.in` | **VERIFIED FIRST-PARTY** (Monthly PDF/XLS per city pair) |
| **DGCA Airline Market Share Data** | Available on `dgca.gov.in` | **VERIFIED FIRST-PARTY** (Monthly Passenger Load Factor & Volume) |
| **DGCA Tariff Monitoring Unit (TMU)** | Active Cell monitoring 78 domestic routes | **VERIFIED FIRST-PARTY** (Monitors fare bands under Rule 135) |
| **DGCA Downloadable Route Average Fare Dataset** | NOT published as downloadable CSV/XLS | **NOT VERIFIED AT FIRST-PARTY DGCA LEVEL** |

> [!CAUTION]
> **CRITICAL EMPIRICAL FINDING FOR SIH EVALUATION:**  
> DGCA does **NOT** publish a publicly downloadable, machine-readable (.csv / .xlsx) historical micro-dataset of route-by-route average purchase fares on `dgca.gov.in`. Claims that "DGCA provides a public historical fare CSV API" are **FALSE**. DGCA publishes passenger traffic counts and market share, while its Tariff Monitoring Unit checks fare caps internally.

---

## 2. Detailed Audit of Official DGCA Datasets

### Dataset 1: Monthly Domestic City-Pair Passenger Traffic Statistics
*   **Publisher:** DGCA Directorate of Information & Publication
*   **URL:** `https://www.dgca.gov.in/digigov-portal/?page=4055/4053/servicename`
*   **Format:** PDF / Excel (.xlsx)
*   **Frequency:** Monthly
*   **Data Fields Included:**
    *   `Origin_City`
    *   `Destination_City`
    *   `Monthly_Passenger_Count`
    *   `Scheduled_Airline_Share`
*   **Usefulness for SIH Prototype:** **ESSENTIAL**. Used to calculate exact city-pair passenger traffic weights $w_r$ for aggregate price index calculation.

### Dataset 2: Tariff Monitoring Unit (TMU) Fare Monitoring Reports
*   **Publisher:** DGCA Air Transport Directorate
*   **Regulatory Basis:** Rule 135 of Aircraft Rules 1937; Air Transport Circular 02 of 2010
*   **Coverage:** 78 major domestic routes across India
*   **Mechanism:** DGCA randomly samples route fares across airline websites to ensure ticket prices do not exceed maximum declared fare bands. Fares are reported in parliamentary replies and MoCA press releases (PIB India), but not distributed as raw data files.
*   **Usefulness for SIH Prototype:** Used as regulatory upper/lower bounds for validating scraped price ranges.

---

## 3. Backtesting Strategy for SIH26056 Requirement REQ-OFF-05

Because DGCA does not provide a public daily/monthly raw price feed, the required **30-day historical backtest** must be executed through a dual-benchmark design:

```
                  [ 30-Day Scraped Observation Window ]
                                  │
                                  ▼
                    [ Data Cleaning & Normalization ]
                                  │
                                  ▼
                   [ Daily & Monthly Index Engine ]
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
[ Benchmark A: Traffic Weights ]              [ Benchmark B: Reference Benchmark ]
  DGCA Monthly City-Pair Traffic                30-Day Historical Scraped Archive
  Shares (Official First-Party)                 (Calibrated Ground Truth Dataset)
```

1.  **Traffic Weight Benchmark (First-Party DGCA):** Calculate national index using exact DGCA monthly city-pair passenger traffic weights.
2.  **Price Benchmark (Calibrated Reference Archive):** Compare calculated index against a 30-day historical scraped baseline dataset or published MoCA macro fare trend statistics.

---

## 4. Verification Checklist Table

| Dataset Name | First-Party URL | Available Fields | Machine Readable? | Historical Depth | Supported Backtest Role |
|---|---|---|---|---|---|
| **DGCA Domestic City-Pair Traffic** | `https://www.dgca.gov.in` | Origin, Dest, Pax Volume | Yes (Excel/PDF) | Multi-year | Route Basket Weighting |
| **DGCA Airline Market Share** | `https://www.dgca.gov.in` | Carrier, Pax Share, PLF | Yes (Excel/PDF) | Multi-year | Carrier Weighting |
| **DGCA TMU Fare Bounds** | `https://pib.gov.in` / MoCA | Route, Max/Min Fare Band | Partial (Press Releases) | Selective | Anomaly Thresholding |
| **DGCA Public Fare Micro-Data** | None | N/A | **NO** | N/A | **NOT VERIFIED AT FIRST-PARTY LEVEL** |
