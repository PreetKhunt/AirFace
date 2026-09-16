# Role of AI/ML in Airfare Price Index System

---

## 1. Architectural Boundary Directive

> [!IMPORTANT]
> **DETERMINISTIC STATISTICAL CORE BOUNDARY:**  
> AI/ML models MUST NOT replace the core price index calculation. The official CPI index must remain 100% deterministic, auditable, and mathematically transparent (using Jevons and Young formulas). Black-box neural networks or machine learning regressors are strictly prohibited from calculating index numbers.

---

## 2. Valid AI/ML Application Domains

AI/ML is leveraged exclusively as an **auxiliary operational intelligence layer** to enhance data quality, system resilience, and predictive insights:

```
[ Deterministic Index Core (Jevons / Young Index) ] ── (Pure Statistical Math)
                      │
                      ├──────────────────────────┐
                      ▼                          ▼
        [ Auxiliary AI Module 1 ]    [ Auxiliary AI Module 2 ]
        Anomaly & DOM Drift          Short-Term Forecasting
        Detection (Isolation Forest) (Prophet / ARIMA)
```

### Valid AI/ML Use Cases & Frameworks

| AI/ML Application | Model / Algorithm | Purpose | Inputs | Output | Rationale |
|---|---|---|---|---|---|
| **Data Quality Anomaly Detection** | Isolation Forest / One-Class SVM | Detect scraper DOM parsing errors vs real price spikes | `base_fare`, `tax_ratio`, `booking_window` | Anomaly Score (0.0 to 1.0) | Filters out corrupt HTML extraction glitches without manual rules |
| **DOM Drift & Layout Change Alerts** | Structural HTML Tree Comparison | Detect when target portal redesign breaks CSS selectors | Target HTML DOM snippets | Scraper Breakage Alert | Prevents silent scraper failure and empty data pipelines |
| **Short-Term Index Forecasting** | Prophet / SARIMAX / LSTM | Provide 7-day to 30-day forward price trend projections | Historical daily index series | $I_{t+7 \dots t+30}$ forecast interval | Provides policy planners at MoSPI with early inflation warnings |
| **Automated Natural Language Reports** | Template NLG / LLM Summarizer | Generate human-readable monthly inflation driver reports | Index movement & route contribution vectors | Textual Executive Briefing | Assists NSO statisticians in drafting monthly press releases |

---

## 3. Evaluation of Proposed AI Models

1.  **Isolation Forest for Anomaly Detection:**
    *   *Training:* Fit on clean 30-day historical scraped fare distributions per route.
    *   *Inference:* Fares with anomaly score $>0.75$ are flagged for manual verification or secondary source check.
2.  **Prophet Time-Series Forecasting:**
    *   Captures weekly seasonality (weekend travel surges) and yearly holiday spikes (Diwali, Christmas).
