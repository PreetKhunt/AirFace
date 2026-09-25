# AIRFACE (SIH26056) — Statistical Validation & Backtesting Specification

## 1. Objective

The Backtest & Validation Engine evaluates the statistical fidelity, stability, and predictive tracking of the AIRFACE price index against verified reference baselines.

---

## 2. Statistical Metrics & Formulations

Given scraped index series $S_t$ and reference series $R_t$ for $t \in \{1, \dots, N\}$:

### A. Mean Absolute Percentage Error (MAPE)
$$\text{MAPE} = \frac{1}{N} \sum_{t=1}^N \left| \frac{S_t - R_t}{R_t} \right| \times 100\%$$
*Proposed Project Acceptance Target:* $\text{MAPE} < 5.0\%$

### B. Root Mean Square Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^N (S_t - R_t)^2}$$
*Proposed Project Acceptance Target:* $\text{RMSE} < 3.0\text{ index points}$

### C. Pearson Linear Correlation Coefficient ($r$)
$$r = \frac{\sum_{t=1}^N (S_t - \bar{S})(R_t - \bar{R})}{\sqrt{\sum_{t=1}^N (S_t - \bar{S})^2 \sum_{t=1}^N (R_t - \bar{R})^2}}$$
*Proposed Project Acceptance Target:* $r \ge 0.85$ (Evaluated when $N \ge 2$ and sample variation $> 0$)

### D. Mean Percentage Bias
$$\text{Bias} = \frac{1}{N} \sum_{t=1}^N \left( \frac{S_t - R_t}{R_t} \right) \times 100\%$$
*Target:* Directional bias within $\pm 2.0\%$

### E. Directional Accuracy (DA)
$$\text{DA} = \frac{1}{N-1} \sum_{t=2}^N \mathbf{1}_{\{\text{sgn}(S_t - S_{t-1}) = \text{sgn}(R_t - R_{t-1})\}} \times 100\%$$
*Proposed Project Acceptance Target:* $\text{DA} \ge 80.0\%$

---

## 3. Disclosures & Methodological Boundaries

1. **No Fabricated Benchmarks:** AIRFACE never manufactures external historical DGCA micro-data. All validation metrics state the exact sample period, sample size ($N$), matched pairs, and reference dataset identifier.
2. **Clear Origin Separation:** The interface explicitly distinguishes:
   - Official Reference Data (if provided by authorities)
   - Version-controlled Prototype Historical Reference
   - Synthetic Simulation Baselines
3. **Sample Size Awareness:** Pearson correlation and Directional Accuracy are computed only when sufficient consecutive temporal observations exist ($N \ge 2$). Single-point benchmarks display `NOT AVAILABLE — INSUFFICIENT SAMPLE SIZE`.
