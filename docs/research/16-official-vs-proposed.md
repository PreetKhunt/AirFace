# Official Requirements vs Derived Requirements vs Proposed Innovations

---

## 1. Feature Classification Matrix

This document provides a strict classification of system capabilities to ensure transparency with judges regarding what is officially required versus what represents our engineering innovation.

| Feature / Requirement | Official Requirement | Derived Requirement | Our Innovation | Authoritative Evidence & Source |
|---|---|---|---|---|
| **Automated Web Scraping Engine** | **YES** | — | — | SIH Problem Statement SIH26056 [1] |
| **Real-Time Airfare Price Index** | **YES** | — | — | SIH Problem Statement SIH26056 [1] |
| **Multi-Lead Time Booking (T+1..T+45)** | **YES** | — | — | SIH Technical Specifications [1] |
| **30-Day Historical Backtest Pipeline** | **YES** | — | — | SIH Evaluation Criteria [1] |
| **Augmentation of NSO CPI Basket** | **YES** | — | — | MoSPI DIID Project Objectives [2] |
| **Playwright JS Headless Rendering** | — | **YES** | — | Engineering necessity for React OTAs |
| **Tukey IQR Outlier Cleaning** | — | **YES** | — | IMF CPI Manual Quality Standards [3] |
| **Multi-OTA Minimum Price Deduplication**| — | **YES** | — | Derived to prevent multi-channel double counting |
| **Jevons & Young Two-Tier Index Formula**| — | **YES** | — | Official MoSPI / ILO CPI Methodology [2][3] |
| **DGCA Passenger Volume Weighting** | — | **YES** | — | Derived from DGCA Traffic Statistics [4] |
| **Data Quality Score Indicator** | — | — | **YES** | Proposed feature for data health monitoring |
| **Multi-Mode Data Engine (Live/Hist/Syn)**| — | — | **YES** | Proposed architecture for demo resilience |
| **AI Isolation Forest Anomaly Alerting**| — | — | **YES** | Proposed operational ML innovation |
| **Prophet Short-Term Index Forecasting**| — | — | **YES** | Proposed policy planning innovation |
| **Interactive Provenance Inspector** | — | — | **YES** | Proposed visual transparency explorer |

---

## 2. Summary of Innovations

1.  **Multi-Mode Data Engine:** Guarantees 100% demo uptime regardless of target site blocks or live Wi-Fi outages.
2.  **Data Quality Score:** Evaluates real-time health of scraping inputs based on completeness, outlier percentage, and source agreement.
3.  **Provenance Inspector:** Allows users to trace any index value back to its constituent scraped HTTP response hash.

---

## 3. Citations

1. **Smart India Hackathon 2026:** *Problem Statement SIH26056 Details*, `https://sih.gov.in`
2. **Ministry of Statistics and Programme Implementation (MoSPI):** *CPI Revision Base 2024=100 Note*, Feb 2026.
3. **ILO / IMF:** *Consumer Price Index Manual*, 2020.
4. **Directorate General of Civil Aviation (DGCA):** *Monthly Domestic City-Pair Traffic Statistics*, 2026.
