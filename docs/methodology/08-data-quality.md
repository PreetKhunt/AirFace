# Data Quality Scoring Specification

---

## 1. Executive Purpose & Status Classification

`[PROPOSED METHODOLOGY]` `[PROPOSED ENGINEERING METRIC]`

To provide MoSPI statisticians with a real-time indicator of scraping pipeline health, the system computes a composite **Data Quality Score ($DQ \in [0.0, 100.0]$)** for every calculated index run.

---

## 2. Mathematical Definition of Data Quality Score

The Data Quality Score $DQ$ is defined as a linear weighted combination of 8 measurable operational metrics:

$$DQ = \sum_{k=1}^{7} w_k \cdot M_k - \text{Penalty}_{Synthetic}$$

$$DQ = w_C \cdot C + w_F \cdot F + w_R \cdot R + w_D \cdot D + w_A \cdot (1 - A) \times 100 + w_M \cdot (1 - M) \times 100 + w_P \cdot P - w_S \cdot S \times 100$$

### Sub-Metric Definitions & Weight Assignments

| Sub-Metric | Symbol | Measurement Definition | Default Weight ($w_k$) |
|---|---|---|---|
| **Completeness** | $C$ | % of target route-horizon slots with valid price quotes | **0.25** (25%) |
| **Freshness** | $F$ | Score based on time delay relative to scheduled run time ($F = \max(0, 100 - \Delta t_{mins})$) | **0.15** (15%) |
| **Source Reliability**| $R$ | Historical 30-day HTTP success rate of target scrapers | **0.15** (15%) |
| **Deduplication Sync**| $D$ | % of observations validated across $\ge 2$ independent OTAs | **0.15** (15%) |
| **Low Anomaly Rate** | $(1 - A)$ | Percentage of observations passing Tukey IQR bounds without outlier flag | **0.10** (10%) |
| **Low Missingness** | $(1 - M)$ | Percentage of observations NOT requiring imputation | **0.10** (10%) |
| **Provenance Complete**| $P$ | % of records containing valid SHA-256 payload hash & target URL | **0.10** (10%) |
| **Synthetic Penalty** | $S$ | Penalty proportional to fraction of synthetic mock data present | **-1.00** (Full Penalty) |

---

## 3. Score Rating Bands & System Actions

| DQ Score Range | Quality Rating | Dashboard Color | System Action & Alert Level |
|---|---|---|---|
| **$90.0 \le DQ \le 100.0$** | **EXCELLENT** | Green | Automatic publication to primary index warehouse |
| **$75.0 \le DQ < 90.0$** | **GOOD** | Blue | Standard publication with minor quality log notice |
| **$60.0 \le DQ < 75.0$** | **FAIR** | Amber Alert | Publish with `QUALITY_WARNING` badge on dashboard |
| **$DQ < 60.0$** | **POOR** | Red Alert | **Halt automatic publishing**; require manual NSO review |

---

## 4. Quality Score Implementation Pseudocode

```python
def compute_data_quality_score(batch_metrics: BatchMetrics) -> float:
    """
    Computes mathematical Data Quality Score [0.0 to 100.0].
    """
    score = (
        0.25 * batch_metrics.completeness_pct +
        0.15 * batch_metrics.freshness_score +
        0.15 * batch_metrics.source_reliability_pct +
        0.15 * batch_metrics.multi_source_dedup_pct +
        0.10 * (1.0 - batch_metrics.anomaly_rate) * 100.0 +
        0.10 * (1.0 - batch_metrics.imputation_rate) * 100.0 +
        0.10 * batch_metrics.provenance_completeness_pct
    )
    
    # Heavy penalty for synthetic mock data intrusion
    synthetic_penalty = batch_metrics.synthetic_fraction * 100.0
    final_score = max(0.0, min(100.0, score - synthetic_penalty))
    
    return round(final_score, 2)
```
