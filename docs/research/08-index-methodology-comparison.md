# Price Index Methodology Comparison & Evaluation

**References:**  
1. ILO / IMF / OECD / Eurostat — *Consumer Price Index Manual: Concepts and Methods (2020)*  
2. MoSPI NSO — *Methodological Guidelines on Elementary Price Aggregation*  

---

## 1. Mathematical Evaluation of Candidate Index Formulas

The selection of the price index formula is the core statistical foundation of SIH26056. The table below evaluates the primary price index candidates against airfare data characteristics:

| Index Formula | Mathematical Expression | Data & Weight Requirements | Axiomatic Properties Satisfied | Main Advantages | Key Limitations | Suitability for SIH26056 Airfare Index |
|---|---|---|---|---|---|---|
| **Jevons Index** | $I_J^{0:t} = \prod_{i=1}^n \left( \frac{p_{i,t}}{p_{i,0}} \right)^{1/n}$ | Price quotes only (Unweighted) | Time Reversal, Transitivity, Monotonicity, Proportionality | Unbiased by price volatility; robust to dynamic pricing spikes; standard for e-commerce scraping | Cannot incorporate sub-flight quantity weights | **RECOMMENDED FOR ELEMENTARY STRATA** |
| **Carli Index** | $I_C^{0:t} = \frac{1}{n} \sum_{i=1}^n \left( \frac{p_{i,t}}{p_{i,0}} \right)$ | Price quotes only (Unweighted) | Monotonicity, Proportionality (Fails Time Reversal) | Simple arithmetic mean | Severe upward bias when prices fluctuate dynamic baseline | **REJECTED (Biased)** |
| **Laspeyres Index** | $I_L^{0:t} = \frac{\sum p_{i,t} q_{i,0}}{\sum p_{i,0} q_{i,0}}$ | Base period prices & base quantities $q_{i,0}$ | Monotonicity, Proportionality | Standard CPI formula; intuitive base comparison | Upward substitution bias; requires base ticket quantities per flight | **SUITABLE FOR HIGH-LEVEL AGGREGATION** |
| **Paasche Index** | $I_P^{0:t} = \frac{\sum p_{i,t} q_{i,t}}{\sum p_{i,0} q_{i,t}}$ | Current period prices & current quantities $q_{i,t}$ | Monotonicity, Proportionality | Captures real-time consumer substitution | Downward bias; requires real-time ticket sales $q_{i,t}$ (unavailable from scraping) | **INFEASIBLE (Data constraint)** |
| **Fisher Ideal Index** | $I_F^{0:t} = \sqrt{I_L^{0:t} \times I_P^{0:t}}$ | Both base ($q_0$) and current ($q_t$) quantities | Time Reversal, Factor Reversal (Superlative Index) | Eliminates substitution bias completely | Infeasible for daily automated scraping due to missing $q_{i,t}$ | **INFEASIBLE for Daily Scraping** |
| **Young / Modified Laspeyres** | $I_Y^{0:t} = \sum w_r \cdot I_{r, J}^{0:t}$ | Elementary indices + DGCA route traffic weights $w_r$ | Monotonicity, Scale Invariance | Directly compatible with monthly DGCA passenger volume shares | Requires periodic weight updating | **RECOMMENDED FOR NATIONAL AGGREGATION** |

---

## 2. Recommended Two-Tiered Index Architecture

Based on mathematical evaluation and empirical data availability, we recommend a **Two-Tiered Index Structure**:

```
[ Tier 1: Elementary Stratum Aggregation ]
  Formula: JEVONS GEOMETRIC MEAN (Unweighted)
  Level: (Route r  x  Booking Horizon T+N  x  Date t)
  Inputs: Scraped Flight Fares (p_{i,t})
  
                      │
                      ▼
[ Tier 2: National Basket Aggregation ]
  Formula: YOUNG / MODIFIED LASPEYRES INDEX (Weighted)
  Level: National Domestic Airfare Price Index
  Inputs: Route Jevons Indices  x  DGCA Passenger Traffic Weights (w_r)
```

### Tier 1 Formula (Elementary Route-Leadtime Jevons Index)
For a specific route $r$ and advance booking window $h \in \{T+1, T+7, T+15, T+30, T+45\}$ on day $t$:

$$I_{r, h}^{0:t} = \left( \prod_{i=1}^{N_{r,h}} \frac{p_{i,t}^{r,h}}{p_{i,0}^{r,h}} \right)^{\frac{1}{N_{r,h}}}$$

### Tier 2 Formula (National Domestic Airfare Index)
Using route passenger weights $w_r$ derived from DGCA monthly passenger statistics:

$$I_{National}^{0:t} = \sum_{r \in Routes} w_r \cdot \left( \sum_{h \in Horizons} \alpha_h \cdot I_{r, h}^{0:t} \right)$$

where $\alpha_h$ represents advance booking horizon weights ($\sum \alpha_h = 1$).

---

## 3. Justification & Alignment with MoSPI CPI Practice

1.  **IMF / ILO CPI Manual Compliance:** Section 10.32 explicitly recommends the unweighted Jevons index for e-commerce and web-scraped price collections where transaction volume per item code is unobserved.
2.  **Robustness to Dynamic Surges:** Unlike arithmetic averages (Carli), Jevons is geometric, preventing single ticket surge anomalies from distorting the route price relative.
3.  **Reproducibility & Auditability:** Fully deterministic, transparent, and non-black-box.
