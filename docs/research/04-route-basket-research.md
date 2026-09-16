# Representative Route Basket & Traffic-Based Selection

**Primary References:**  
1. DGCA Monthly Domestic City-Pair Passenger Traffic Reports (2024–2026)  
2. Ministry of Civil Aviation (MoCA) Annual Aviation Statistics  

---

## 1. Route Basket Selection Methodology

To ensure the Airfare Price Index accurately reflects price changes experienced by Indian consumers, routes must be selected based on **passenger volume density** and **geographical dispersion**.

### Selection Criteria
1.  **High Passenger Density:** Top city pairs by annual passenger volume (accounting for >60% of national domestic traffic).
2.  **Geographical Coverage:** Core Metro-to-Metro trunks (DEL, BOM, BLR, CCU, MAA, HYD) plus key Metro-to-Regional corridors (DEL-PNQ, BOM-COK, DEL-PAT).
3.  **Carrier Diversity:** Routes served by at least 3 major airlines to capture competitive pricing dynamics.

---

## 2. Directionality & Market Segmentation

> [!IMPORTANT]
> **Directional Isolation Rule:**  
> A route pair $A \rightarrow B$ is treated as a **distinct directional market** from $B \rightarrow A$.
> *   **Reason 1 (Airport User Development Fees):** Origin airport UDF tariffs differ (e.g., DEL origin UDF $\neq$ BOM origin UDF).
> *   **Reason 2 (Demand Asymmetry):** Flight departure timing, business travel flow, and weekend return surge curves differ by direction.
> *   **Reason 3 (Flight Numbers & Slots):** Airline slot availability and operational aircraft routing are non-symmetric.

---

## 3. Representative Top-15 Domestic Route Basket & Traffic Weighting

The table below illustrates top domestic city pairs derived from DGCA passenger volume statistics:

| Route Code | Origin Airport | Destination Airport | Region Corridor | Illustrative DGCA Traffic Weight ($w_r$) | Weight Classification |
|---|---|---|---|---|---|
| **DEL-BOM** | Delhi (DEL) | Mumbai (BOM) | North $\rightarrow$ West | 14.2% | ILLUSTRATIVE — NOT OFFICIAL |
| **BOM-DEL** | Mumbai (BOM) | Delhi (DEL) | West $\rightarrow$ North | 13.8% | ILLUSTRATIVE — NOT OFFICIAL |
| **DEL-BLR** | Delhi (DEL) | Bengaluru (BLR) | North $\rightarrow$ South | 9.5% | ILLUSTRATIVE — NOT OFFICIAL |
| **BLR-DEL** | Bengaluru (BLR) | Delhi (DEL) | South $\rightarrow$ North | 9.2% | ILLUSTRATIVE — NOT OFFICIAL |
| **BOM-BLR** | Mumbai (BOM) | Bengaluru (BLR) | West $\rightarrow$ South | 7.8% | ILLUSTRATIVE — NOT OFFICIAL |
| **BLR-BOM** | Bengaluru (BLR) | Mumbai (BOM) | South $\rightarrow$ West | 7.6% | ILLUSTRATIVE — NOT OFFICIAL |
| **DEL-CCU** | Delhi (DEL) | Kolkata (CCU) | North $\rightarrow$ East | 6.1% | ILLUSTRATIVE — NOT OFFICIAL |
| **CCU-DEL** | Kolkata (CCU) | Delhi (DEL) | East $\rightarrow$ North | 5.9% | ILLUSTRATIVE — NOT OFFICIAL |
| **DEL-HYD** | Delhi (DEL) | Hyderabad (HYD) | North $\rightarrow$ South | 5.4% | ILLUSTRATIVE — NOT OFFICIAL |
| **HYD-DEL** | Hyderabad (HYD) | Delhi (DEL) | South $\rightarrow$ North | 5.2% | ILLUSTRATIVE — NOT OFFICIAL |
| **BOM-MAA** | Mumbai (BOM) | Chennai (MAA) | West $\rightarrow$ South | 4.1% | ILLUSTRATIVE — NOT OFFICIAL |
| **MAA-BOM** | Chennai (MAA) | Mumbai (BOM) | South $\rightarrow$ West | 3.9% | ILLUSTRATIVE — NOT OFFICIAL |
| **DEL-PNQ** | Delhi (DEL) | Pune (PNQ) | North $\rightarrow$ West | 2.8% | ILLUSTRATIVE — NOT OFFICIAL |
| **DEL-PAT** | Delhi (DEL) | Patna (PAT) | North $\rightarrow$ East | 2.3% | ILLUSTRATIVE — NOT OFFICIAL |
| **BOM-COK** | Mumbai (BOM) | Kochi (COK) | West $\rightarrow$ South | 2.2% | ILLUSTRATIVE — NOT OFFICIAL |

> [!NOTE]
> **Data Provenance Label:** All weights in the table above are labeled as `ILLUSTRATIVE — NOT OFFICIAL`. During execution, weights are dynamically computed from the latest uploaded DGCA monthly city-pair Excel file.

---

## 4. Route Weight Updating Protocol

1.  **Baseline Weights:** Fixed annually based on DGCA Annual Traffic Reports.
2.  **Monthly Weight Adjustment (Young Index):** When monthly DGCA traffic reports are published, route shares are updated to prevent basket obsolescence during seasonal shifts (e.g., holiday surge to COK/GOI in December).
