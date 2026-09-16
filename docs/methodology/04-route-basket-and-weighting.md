# Route Basket & Weighting Specification

---

## 1. Route Basket Selection Criteria

To ensure national representativeness, the domestic route basket is selected based on **DGCA Annual & Monthly Domestic City-Pair Traffic Statistics** (`https://www.dgca.gov.in`).

### Basket Selection Rules
1.  **High Passenger Volume:** Top domestic city pairs accounting for $>60\%$ of total Indian domestic passenger traffic.
2.  **Geographical Dispersion:** Representative corridors connecting North, West, South, East, and North-East regional hubs.
3.  **Carrier Competition:** Routes served by at least 3 scheduled domestic airlines.

---

## 2. Directional Market Rule

`[VERIFIED FACT]` `[DERIVED ENG REQ]`

> [!IMPORTANT]
> **DIRECTIONAL ISOLATION MANDATE:**  
> A city-pair $A \rightarrow B$ is treated as a **strictly separate directional market** from $B \rightarrow A$.
> 
> *   `DEL-BOM` (Delhi to Mumbai) and `BOM-DEL` (Mumbai to Delhi) are separate route IDs.
> *   **Reasons:** Airport User Development Fees (UDF) differ by origin airport; departure slot schedules differ; business vs return leisure demand curves are asymmetric.

---

## 3. Route Weighting System (DGCA Volume-Based Reference Weights)

`[OFFICIAL REFERENCE DATA]`

### 3.1 Weight Definition

Route weights $w_r$ are defined as the **DGCA Passenger-Volume-Based Reference Weight**, derived from monthly domestic passenger volume counts $V_r$:

$$w_r = \frac{V_r}{\sum_{k \in \mathcal{R}} V_k} \quad \text{where } \sum_{r \in \mathcal{R}} w_r = 1.0$$

> [!CAUTION]
> **TERMINOLOGY REGULATORY AUDIT:**  
> Route weights $w_r$ represent **passenger volume shares**, NOT expenditure shares. They must be explicitly described in documentation as `DGCA Passenger-Volume-Based Reference Weights`.

### 3.2 Representative Top-15 Domestic Route Basket Table

| Route Code | Origin Airport | Destination Airport | Corridor Region | Illustrative DGCA Traffic Weight ($w_r$) | Status Tag |
|---|---|---|---|---|---|
| **DEL-BOM** | Delhi (DEL) | Mumbai (BOM) | North $\rightarrow$ West | 14.2% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **BOM-DEL** | Mumbai (BOM) | Delhi (DEL) | West $\rightarrow$ North | 13.8% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **DEL-BLR** | Delhi (DEL) | Bengaluru (BLR) | North $\rightarrow$ South | 9.5% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **BLR-DEL** | Bengaluru (BLR) | Delhi (DEL) | South $\rightarrow$ North | 9.2% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **BOM-BLR** | Mumbai (BOM) | Bengaluru (BLR) | West $\rightarrow$ South | 7.8% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **BLR-BOM** | Bengaluru (BLR) | Mumbai (BOM) | South $\rightarrow$ West | 7.6% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **DEL-CCU** | Delhi (DEL) | Kolkata (CCU) | North $\rightarrow$ East | 6.1% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **CCU-DEL** | Kolkata (CCU) | Delhi (DEL) | East $\rightarrow$ North | 5.9% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **DEL-HYD** | Delhi (DEL) | Hyderabad (HYD) | North $\rightarrow$ South | 5.4% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **HYD-DEL** | Hyderabad (HYD) | Delhi (DEL) | South $\rightarrow$ North | 5.2% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **BOM-MAA** | Mumbai (BOM) | Chennai (MAA) | West $\rightarrow$ South | 4.1% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **MAA-BOM** | Chennai (MAA) | Mumbai (BOM) | South $\rightarrow$ West | 3.9% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **DEL-PNQ** | Delhi (DEL) | Pune (PNQ) | North $\rightarrow$ West | 2.8% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **DEL-PAT** | Delhi (DEL) | Patna (PAT) | North $\rightarrow$ East | 2.3% | `ILLUSTRATIVE — NOT OFFICIAL` |
| **BOM-COK** | Mumbai (BOM) | Kochi (COK) | West $\rightarrow$ South | 2.2% | `ILLUSTRATIVE — NOT OFFICIAL` |

---

## 4. Airline Weighting Audit & Decision

`[PROPOSED METHODOLOGY]`

### Decision: Unweighted Inside Elementary Strata
Inside an elementary route-horizon cell $(r, h)$, price quotes across operating airlines (IndiGo, Air India, Akasa, SpiceJet) are aggregated using an **unweighted Jevons Geometric Mean**.

### Justification
1.  Daily airline flight booking shares per specific flight number are unobservable via web scraping.
2.  Adding a secondary airline market share weighting layer inside elementary cells introduces noise when airline schedules fluctuate daily.
3.  DGCA national airline market shares are maintained as metadata for analytical dashboards, but are **NOT applied as a weighting layer** inside Tier 1 Jevons calculations.
