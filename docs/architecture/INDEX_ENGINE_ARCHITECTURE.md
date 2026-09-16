# Index Engine Architecture Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Mathematical Architecture Summary

The Index Engine Subsystem executes deterministic, reproducible price index computations using a two-tiered architecture compliant with IMF/ILO CPI Manual (2020) guidelines:

1. **Tier 1 (Elementary Stratum):** Unweighted **Jevons Geometric Mean Index** calculated per Route $r$, Horizon $h$, and Date $t$.
2. **Tier 2 (National Aggregation):** **Jevons** (Primary) and **Young / Modified Laspeyres Index** (Secondary/Comparison) aggregating route indices using DGCA Passenger Volume Weights $w_r$.

---

## 2. Vectorized Calculation Pipeline

```python
import numpy as np
import pandas as pd

def calculate_jevons_elementary_index(df_cell: pd.DataFrame, base_prices: pd.Series) -> float:
    """
    Computes Tier 1 Jevons Geometric Mean Index:
    I_J = exp( (1/N) * sum( ln( p_t / p_0 ) ) ) * 100
    """
    price_relatives = df_cell['comparable_index_fare'] / base_prices[df_cell['flight_number']].values
    log_relatives = np.log(price_relatives)
    jevons_index = np.exp(np.mean(log_relatives)) * 100.0
    return float(np.round(jevons_index, 4))

def calculate_young_national_index(route_indices: dict[str, float], dgca_weights: dict[str, float]) -> float:
    """
    Computes Tier 2 National Young Aggregate Index:
    I_National = sum( w_r * I_{r,h} )
    """
    national_index = sum(dgca_weights[route_id] * route_indices[route_id] for route_id in route_indices)
    return float(np.round(national_index, 4))
```

---

## 3. Calculation Execution Workflow

```
[ Ingest Normalized Observations ] ──► [ Partition by (Route r, Horizon h, Date t) ]
                                                        │
                                                        ▼
[ Tier 2 Jevons / Young National Aggregation ] ◄── [ Tier 1 Jevons Geometric Mean ]
 Apply DGCA Pax Weights w_r                I_{r,h} = exp(mean(ln(p_t / p_0))) * 100
            │
            ▼
[ Persist to TimescaleDB & Notify UI ]
```
