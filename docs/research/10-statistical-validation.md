# Statistical Validation Framework & Alignment Methodology

---

## 1. Statistical Validation Metrics

To rigorously evaluate the calculated airfare index against reference benchmarks (SIH Requirement REQ-OFF-05), a suite of complementary validation metrics is required.

### Metric Definitions & Acceptable Thresholds

| Validation Metric | Mathematical Expression | Statistical Purpose | Target Threshold | Interpretation & Limitations |
|---|---|---|---|---|
| **Mean Absolute Percentage Error (MAPE)** | $\text{MAPE} = \frac{100\%}{N} \sum_{t=1}^N \left\| \frac{I_{Ref, t} - I_{Scraped, t}}{I_{Ref, t}} \right\|$ | Measures overall percentage divergence | **$\le 5.0\%$** | Industry standard accuracy metric; insensitive to index base scaling |
| **Root Mean Square Error (RMSE)** | $\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^N (I_{Ref, t} - I_{Scraped, t})^2}$ | Penalizes large single-period deviation spikes | **$\le 3.0$ Index Pts** | Sensitive to extreme scraper outage anomalies |
| **Pearson Correlation ($r$)** | $r = \frac{\sum (I_S - \bar{I}_S)(I_R - \bar{I}_R)}{\sqrt{\sum (I_S - \bar{I}_S)^2 \sum (I_R - \bar{I}_R)^2}}$ | Measures co-movement & directional trend sync | **$r \ge 0.85$** | *Warning:* High correlation alone does not prove accuracy if scale bias exists |
| **Mean Percentage Bias** | $\text{Bias} = \frac{100\%}{N} \sum_{t=1}^N \left( \frac{I_{Scraped, t} - I_{Ref, t}}{I_{Ref, t}} \right)$ | Detects systematic over/under-estimation | **$-2.0\% \le \text{Bias} \le +2.0\%$** | Positive bias indicates scraper captures premium non-saver fares |
| **Directional Accuracy** | $\text{DA} = \frac{1}{N-1} \sum_{t=2}^N \mathbb{I}(\operatorname{sgn}(\Delta I_S) == \operatorname{sgn}(\Delta I_R))$ | Evaluates turn-of-trend directional tracking | **$\ge 80.0\%$** | Measures whether index correctly predicts inflation direction shifts |

---

## 2. Temporal Alignment: Daily High-Frequency vs Monthly Reference Data

A major methodological challenge in SIH26056 is that **scraped data is collected daily**, whereas **government reference statistics (DGCA / NSO CPI) are released monthly**.

### Temporal Aggregation Pipeline

```
 [ Daily Scraped Index I_{Scraped}^d ] (d = 1 ... 30)
                    │
                    ▼
 [ Monthly Arithmetic Mean Aggregation ]
    \bar{I}_{Scraped}^M = \frac{1}{D} \sum_{d=1}^{D} I_{Scraped}^d
                    │
                    ▼
 [ Baseline Normalization ]
    Align \bar{I}_{Scraped}^{M_0} = I_{Ref}^{M_0} = 100.0
                    │
                    ▼
 [ Monthly Point-to-Point Comparison against I_{Ref}^M ]
```

1.  **Daily-to-Monthly Averaging:** Compute the unweighted or volume-weighted mean of daily index values across all days in calendar month $M$.
2.  **Base Period Alignment:** Rebase both the calculated index and the reference series to a common baseline month ($M_0 = 100.0$).
3.  **Statistical Test Execution:** Compute MAPE, RMSE, Pearson $r$, and Bias over aligned monthly periods.

---

## 3. Sample Size Warnings & Validity Rules

> [!CAUTION]
> **Statistical Significance Guardrail:**  
> Do **NOT** report Pearson correlation coefficients or claim high statistical confidence if fewer than $N=15$ aligned daily/monthly observation pairs exist. Small-sample correlation is statistically meaningless and will be rejected by MoSPI judges.
