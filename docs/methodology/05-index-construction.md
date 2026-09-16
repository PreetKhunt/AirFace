# Price Index Construction Specification

---

## 1. Executive Summary & Frozen Architecture

The Airfare Price Index is constructed using a **Two-Tiered Index Structure** fully compliant with IMF/ILO CPI Manual (2020) guidelines for web-scraped price data.

```
[ Tier 1: Elementary Stratum Aggregation ]
  Formula: JEVONS GEOMETRIC MEAN INDEX (Unweighted)
  Level: Route r  x  Booking Horizon h (T+1..T+45)  x  Date t
  Inputs: Normalized Comparable Fares (p_{i,t})
  
                      │
                      ▼
[ Tier 2: National Basket Aggregation ]
  Formula: YOUNG / MODIFIED LASPEYRES INDEX (Weighted)
  Level: National Domestic Airfare Price Index
  Inputs: Elementary Jevons Indices  x  DGCA Passenger Volume Weights (w_r)
```

---

## 2. Tier 1: Elementary Route-Horizon Index (Jevons Formula)

For a specific route $r$ and booking horizon $h \in \{T+1, T+7, T+15, T+30, T+45\}$ on day $t$, relative to base period $t_0$:

$$I_{r, h}^{t_0:t} = \left( \prod_{i=1}^{N_{r,h,t}} \frac{p_{i,t}^{r,h}}{p_{i,t_0}^{r,h}} \right)^{\frac{1}{N_{r,h,t}}} \times 100$$

*   $p_{i,t}^{r,h}$: Normalized comparable fare for flight observation $i$ in cell $(r, h)$ on day $t$.
*   $p_{i,t_0}^{r,h}$: Base period price for flight observation $i$ in cell $(r, h)$ at $t_0$.
*   $N_{r,h,t}$: Total number of valid, non-outlier observations in cell $(r, h)$ on day $t$.

### Axiomatic Justification for Jevons Index
1.  **Time Reversal Test:** Satisfied ($I^{0:t} \times I^{t:0} = 1.0$).
2.  **Transitivity Test:** Satisfied ($I^{a:b} \times I^{b:c} = I^{a:c}$).
3.  **Volatility Immunity:** Geometric averaging prevents single dynamic surge prices from distorting the price relative (unlike arithmetic Carli).
4.  **IMF CPI Manual Endorsement:** Section 10.32 explicitly mandates Jevons for web scraping where quantity weights $q_{i,t}$ are unobserved.

---

## 3. Tier 2: National Aggregate Price Index (Young Formula)

The National Domestic Airfare Price Index $I_{National}^{t_0:t}$ on day $t$ aggregates elementary route indices using DGCA Passenger-Volume-Based Reference Weights $w_r$:

$$I_{National, h}^{t_0:t} = \sum_{r \in \mathcal{R}} w_r \cdot I_{r, h}^{t_0:t} \quad \text{where } \sum_{r \in \mathcal{R}} w_r = 1.0$$

Where $\mathcal{R}$ is the active domestic route basket.

---

## 4. Multi-Frequency Index Computation

### 4.1 Daily Index ($I_d^t$)
Computed every 24 hours at 00:00 UTC using daily scraped fare observations.

### 4.2 Weekly Aggregated Index ($I_w^t$)
Arithmetic mean of 7 consecutive daily indices:

$$I_{w}^{W} = \frac{1}{7} \sum_{d=1}^{7} I_{d}^{d \in W}$$

### 4.3 Monthly Aggregated Index ($I_m^M$)
Arithmetic mean of all daily indices in calendar month $M$ (containing $D_M$ days):

$$I_{m}^{M} = \frac{1}{D_M} \sum_{d=1}^{D_M} I_{d}^{d \in M}$$

---

## 5. Index Base & Rebasing Logic

`[DERIVED ENG REQ]`

### 5.1 Base Period Definition
The base period $t_0$ is defined as a configurable reference observation period (e.g. $t_0 = \text{2026-01-01}$ or Day 1 of pipeline execution), where $I^{t_0} = 100.0$.

> [!CAUTION]
> **NO HARDCODED OFFICIAL BASELINE:**  
> The system MUST NOT hardcode an unsupported "official MoSPI baseline month". Base period date $t_0$ is loaded dynamically from `config/index_settings.yaml`.

### 5.2 Chain Rebasing Formula
When updating the index baseline from old base $b_{old}$ to new base $b_{new}$:

$$I_{new}^t = \left( \frac{I_{old}^t}{I_{old}^{b_{new}}} \right) \times 100$$
