# Backtesting & Validation Specification

---

## 1. Audit of Benchmark Datasets & Taxonomy

To preserve 100% scientific honesty and prevent misleading claims regarding DGCA data:

```
                          [ Validation System Benchmarks ]
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
[ DGCA Traffic Data ]         [ Historical Scraped Archive ]   [ Engineering Benchmark ]
Official DGCA monthly pax     30-day internal time-series      30-day calibrated reference
volume shares (for weights)   database of scraped fares        dataset (for backtest metrics)
```

### Benchmark Taxonomy

| Concept Name | Publisher / Source | Status Tag | System Role |
|---|---|---|---|
| **DGCA Passenger Traffic Data** | DGCA (`dgca.gov.in`) | `[OFFICIAL FIRST-PARTY]` | Provides monthly route volume weights $w_r$ |
| **Historical Scraped Archive** | Internal Database | `[DERIVED ENG REQ]` | 30-day stored scraped fare observation stream |
| **External Airfare Benchmark** | MoCA / PIB Press Releases | `[VERIFIED FACT]` | Aggregate macro fare trend benchmarks |
| **Engineering Validation Benchmark**| Calibrated Reference Baseline| `[PROPOSED METHODOLOGY]` | Reference dataset for pipeline metric testing |

> [!CAUTION]
> **NO MANUFACTURED DGCA GROUND TRUTH:**  
> The system MUST NOT describe our internal scraped historical database as "DGCA Ground Truth". DGCA does not publish a public route-by-route daily fare API.

---

## 2. Validation Metrics & Classification Status

`[PROPOSED PROJECT ACCEPTANCE CRITERIA]`

The validation metrics defined below are **proposed engineering targets** for system evaluation. They are NOT official MoSPI mandates.

| Metric Name | Mathematical Formula | Proposed Target | Classification Status |
|---|---|---|---|
| **Mean Absolute Percentage Error (MAPE)** | $\text{MAPE} = \frac{100\%}{N} \sum_{t=1}^N \left\| \frac{I_{Ref, t} - I_{Scraped, t}}{I_{Ref, t}} \right\|$ | **$\le 5.0\%$** | `[PROPOSED ACCEPTANCE CRITERIA]` |
| **Root Mean Square Error (RMSE)** | $\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^N (I_{Ref, t} - I_{Scraped, t})^2}$ | **$\le 3.0$ Pts** | `[PROPOSED ACCEPTANCE CRITERIA]` |
| **Pearson Correlation ($r$)** | $r = \frac{\sum (I_S - \bar{I}_S)(I_R - \bar{I}_R)}{\sqrt{\sum (I_S - \bar{I}_S)^2 \sum (I_R - \bar{I}_R)^2}}$ | **$r \ge 0.85$** | `[PROPOSED ACCEPTANCE CRITERIA]` |
| **Mean Percentage Bias** | $\text{Bias} = \frac{100\%}{N} \sum_{t=1}^N \left( \frac{I_{Scraped, t} - I_{Ref, t}}{I_{Ref, t}} \right)$ | **$\le \pm 2.0\%$** | `[PROPOSED ACCEPTANCE CRITERIA]` |
| **Directional Accuracy (DA)** | $\text{DA} = \frac{1}{N-1} \sum_{t=2}^N \mathbb{I}(\operatorname{sgn}(\Delta I_S) == \operatorname{sgn}(\Delta I_R))$ | **$\ge 80.0\%$** | `[PROPOSED ACCEPTANCE CRITERIA]` |

---

## 3. Backtest Design & Observation Pair Definition

### 3.1 Observation Pair Definition
An **Observation Pair** $(I_{Scraped, t}, I_{Ref, t})$ consists of the calculated price index value and its aligned reference benchmark value for the exact same temporal period $t$ and route-horizon stratum.

### 3.2 Sample Size Guardrails & Limitations

> [!IMPORTANT]
> **SAMPLE SIZE GUARDRAIL FOR PEARSON CORRELATION:**  
> A single 30-day daily collection window compared against ONE monthly DGCA traffic report yields $N=1$ monthly observation pair, which is **statistically insufficient to compute a valid Pearson correlation ($r$)**.
> 
> *   **Daily Validation ($N=30$ Pairs):** Pearson $r$ is evaluated across 30 daily index observation pairs ($t = 1 \dots 30$).
> *   **Monthly Validation ($N \ge 15$ Pairs):** Monthly Pearson $r$ requires a multi-month historical archive spanning at least 15 consecutive months.
