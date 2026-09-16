# Acceptance Criteria & Validation Rules
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Quantitative Quality Acceptance Criteria

To achieve project sign-off by MoSPI statisticians and SIH evaluation judges, the system must satisfy the following quantitative performance thresholds:

| Quality Criterion | Metric Target | Method of Verification | Classification Status |
|---|---|---|---|
| **Mean Absolute Percentage Error** | **MAPE $\le 5.0\%$** | Automated 30-day backtest report against reference baseline | `[PROPOSED ACCEPTANCE TARGET]` |
| **Root Mean Square Error** | **RMSE $\le 3.0$ Pts** | Automated 30-day backtest report against reference baseline | `[PROPOSED ACCEPTANCE TARGET]` |
| **Pearson Correlation ($r$)** | **$r \ge 0.85$** | Evaluated on daily index series over $N \ge 15$ observation pairs | `[PROPOSED ACCEPTANCE TARGET]` |
| **Mean Percentage Bias** | **$\le \pm 2.0\%$** | Evaluated on 30-day index deviation series | `[PROPOSED ACCEPTANCE TARGET]` |
| **Directional Accuracy** | **$\ge 80.0\%$** | Evaluated on turn-of-trend directional tracking | `[PROPOSED ACCEPTANCE TARGET]` |
| **Minimum Data Quality Score** | **$DQ \ge 75.0$** | Live Data Quality Score widget evaluation | `[PROPOSED ENGINEERING METRIC]` |

---

## 2. SIH Judge Evaluation Verification Checklist

| Checkpoint ID | Verification Item | Pass Criteria | Verification Method |
|---|---|---|---|
| **CHK-JDG-01** | Automated Scraping Execution | Scraper successfully extracts live fare listings from target portals. | Trigger live run from SIH Judge dashboard view. |
| **CHK-JDG-02** | Rate Limit & Ethics Verification | Requests enforce $\ge 2.0$s delay and identify with honest User-Agent. | Inspect real-time terminal HTTP request logs. |
| **CHK-JDG-03** | Fare Normalization Verification | System correctly isolates base fare and taxes, stripping convenience fees. | Compare raw HTML price text vs `comparable_index_fare`. |
| **CHK-JDG-04** | Horizon Isolation Verification | Separate index series displayed for $T+1, T+7, T+15, T+30, T+45$. | Inspect dashboard horizon filter tabs. |
| **CHK-JDG-05** | 30-Day Backtest Execution | Backtest pipeline runs end-to-end and outputs machine-readable JSON metrics. | Click 'Execute Backtest' and inspect generated JSON. |
| **CHK-JDG-06** | Data Mode Labeling | UI explicitly displays `[MODE: LIVE]`, `[MODE: HISTORICAL]`, or `[MODE: SYNTHETIC]`. | Audit dashboard top bar badge in all 3 operational modes. |
| **CHK-JDG-07** | Cryptographic Provenance Audit | Observation details display raw HTML snippet, URL, timestamp, and SHA-256 hash. | Click 'Inspect Provenance' on arbitrary quote record. |
| **CHK-JDG-08** | Offline Demo Fallback | System functions 100% offline using pre-cached historical database during Wi-Fi failure. | Disconnect network and verify offline demo presentation. |

---

## 3. MoSPI Institutional Integration Acceptance Criteria

| Checkpoint ID | Integration Requirement | Pass Criteria | Verification Method |
|---|---|---|---|
| **CHK-MOS-01** | CPI COICOP 2018 Alignment | Air travel item codes map directly to Division 07 (Transport). | Verify API data schema export formatting. |
| **CHK-MOS-02** | Jevons & Young Formula Compliance | Index calculations match frozen mathematical equations exactly. | Cross-check calculation engine unit tests. |
| **CHK-MOS-03** | DGCA Volume Weight Integration | System accepts and parses official DGCA monthly passenger Excel files. | Upload sample DGCA Excel file and verify weight update. |
| **CHK-MOS-04** | Automated Data Quality Halting | System halts publication if $DQ < 60.0$ and raises Red Alert. | Inject mock corrupt batch and verify publication halt. |
| **CHK-MOS-05** | CPI Data Export Formats | REST API endpoints output compliant JSON, CSV, and Excel tables. | Execute HTTP GET request to `/api/v1/cpi/export`. |
