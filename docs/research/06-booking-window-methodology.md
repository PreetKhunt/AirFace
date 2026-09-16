# Booking Window (Lead-Time) Methodology (T+1, T+7, T+15, T+30, T+45)

---

## 1. Mathematical Definitions & Core Logic

Advance booking window (lead time) measures the number of calendar days between ticket collection and scheduled departure:

$$\text{booking\_window\_days} = \text{travel\_date} - \text{collection\_date}$$

### Advance Booking Horizons & Market Purpose

| Horizon Code | Lead Time | Consumer Segment Captured | Dynamic Pricing Behavior | CPI Implication |
|---|---|---|---|---|
| **$T+1$** | 1 Day Prior | Emergency / Business Travel | Peak yield management price (highest surge) | Captures spot inflation shocks |
| **$T+7$** | 7 Days Prior | Short-term Business & Leisure | High demand escalation zone | Standard corporate advance purchase |
| **$T+15$** | 15 Days Prior | Regular Leisure / Family Travel | Moderate base pricing + early surge | Highest volume consumer booking window |
| **$T+30$** | 30 Days Prior | Early Vacation / Holiday Planner | Discounted saver fare bucket | Core leisure base fare trend |
| **$T+45$** | 45 Days Prior | Ultra-early Planner / Festival | Lowest published saver fare bucket | Baseline carrier capacity pricing |

---

## 2. Worked Execution Example

Suppose collection occurs on **2026-10-01 at 02:00 UTC**:

*   **$T+1$ Target Departure Date:** `2026-10-02` (Scraped for flight `6E-2131 DEL->BOM`)
*   **$T+7$ Target Departure Date:** `2026-10-08` (Scraped for flight `6E-2131 DEL->BOM`)
*   **$T+15$ Target Departure Date:** `2026-10-16` (Scraped for flight `6E-2131 DEL->BOM`)
*   **$T+30$ Target Departure Date:** `2026-10-31` (Scraped for flight `6E-2131 DEL->BOM`)
*   **$T+45$ Target Departure Date:** `2026-11-15` (Scraped for flight `6E-2131 DEL->BOM`)

Every single collection run queries all 5 departure horizons concurrently across all routes in the basket.

---

## 3. Structural Index Representation: Sub-Indices vs Composite

To prevent mixing apples and oranges, price observations across different lead times are **never mixed within an elementary index**.

1.  **Independent Horizon Sub-Indices:**
    For each horizon $h \in \{T+1, T+7, T+15, T+30, T+45\}$, compute a standalone route index $I_{r, h}^t$.
2.  **Composite Horizon-Weighted Index:**
    Aggregate horizon sub-indices using empirical Indian advance-booking propensities (e.g., 40% weight on $T+15$, 25% on $T+7$, 20% on $T+30$, 10% on $T+1$, 5% on $T+45$).

---

## 4. Handling Exceptional Booking Window Scenarios

*   **Sold-Out Flight at $T+1$:** If flight `6E-2131` was visible at $T+7$ but sold out at $T+1$, do not enter a price of 0. Treat as an unobserved item and impute using the average price movement of remaining operating flights in the same route cell.
*   **Schedule Change:** If departure time shifts by $>2$ hours, match by flight code rather than exact departure time.
