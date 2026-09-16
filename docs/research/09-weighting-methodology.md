# Route & Airline Weighting Systems

---

## 1. Categorization of Weighting Components

To prevent mixing official baseline data with prototype engineering assumptions, weighting components are strictly partitioned:

| Weight Component | Weight Variable | Source | Status / Classification | Formula Role |
|---|---|---|---|---|
| **Route Passenger Share** | $w_r$ | DGCA Monthly Domestic City-Pair Traffic Report | **OFFICIAL REFERENCE DATA** | Higher-level route aggregation weight |
| **Airline Market Share** | $s_a$ | DGCA Monthly Airline Market Share Statistics | **OFFICIAL REFERENCE DATA** | Carrier-level stratum weighting |
| **Booking Horizon Propensity** | $\alpha_h$ | Empirical Aviation Consumer Studies (CAPA India) | **PROTOTYPE ASSUMPTION** | Lead-time composite aggregation weight |

---

## 2. Comparison of Weighting Frameworks

### 2.1 Route Weighting Options
1.  **Passenger Traffic Volume Weighting (RECOMMENDED):**
    $$w_r = \frac{\text{Pax\_Volume}_r}{\sum_{k \in Basket} \text{Pax\_Volume}_k}$$
    *Defensible Rationale:* Directly mirrors consumer expenditure and travel volume share in India. High-density corridors (DEL-BOM, DEL-BLR) drive the index proportionately.
2.  **Equal Weighting (REJECTED for National Index):**
    Assigning $w_r = 1/N$ to all routes.
    *Flaw:* Overstates impact of low-density secondary routes (e.g. DEL-PAT) on national inflation figures.

### 2.2 Lead-Time Horizon Weighting Scheme ($\alpha_h$)
Based on Indian domestic travel booking distributions published by CAPA India and OTA booking studies:

$$\alpha_{T+15} = 0.40, \quad \alpha_{T+7} = 0.25, \quad \alpha_{T+30} = 0.20, \quad \alpha_{T+1} = 0.10, \quad \alpha_{T+45} = 0.05$$

*   **$T+15$ (40%):** Standard advance leisure/family booking window (largest volume segment).
*   **$T+7$ (25%):** Short-term business and urgent personal travel.
*   **$T+30$ (20%):** Early vacation planners.
*   **$T+1$ (10%):** Emergency and last-minute corporate travel (captures price surge volatility).
*   **$T+45$ (5%):** Ultra-early festival / holiday bookings.

---

## 3. Dynamic Weight Update Protocol

*   Weights $w_r$ are updated **monthly** upon publication of DGCA's City-Pair Passenger Traffic PDF/Excel releases.
*   If a new city pair enters the top-15 basket, weights are re-normalized so $\sum w_r = 1.0$.
