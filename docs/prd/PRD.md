# Product Requirements Document (PRD)
## SIH26056 — Real-Time Airfare Price Index for India

**Sponsoring Organization:** Ministry of Statistics and Programme Implementation (MoSPI)  
**Division:** Data Informatics & Innovation Division (DIID) / National Statistical Office (NSO)  
**Problem Statement ID:** SIH26056  
**Document Version:** 1.0.0-PRD  
**Status:** APPROVED FOR ARCHITECTURE & IMPLEMENTATION  

---

## 1. Executive Summary & Problem Context

The National Statistical Office (NSO) under MoSPI publishes India's official **Consumer Price Index (CPI)** on a monthly basis. In modern aviation markets, airline pricing is governed by dynamic yield management algorithms, causing prices to fluctuate rapidly based on lead time, demand surges, and seat inventory.

Historically, air travel price data was collected manually or periodically from a small sample of ticketing offices. This traditional approach misses high-frequency price swings and advance-booking discount curves. In February 2026, MoSPI's CPI Base Year Revision (Base 2024=100) expanded the Transport division weight to **12.41%** and formally adopted digital price collection from e-commerce and Online Travel Aggregators (OTAs).

**SIH26056** requires an automated web scraping and price index platform to calculate a high-frequency (daily) airfare price index across major Indian domestic corridors and 5 advance booking horizons ($T+1, T+7, T+15, T+30, T+45$), augmented with a 30-day historical backtesting pipeline.

---

## 2. Product Vision & Strategic Goals

### Product Vision
To establish a robust, transparent, and statistically defensible real-time airfare price index platform for MoSPI that augments national CPI statistics with high-frequency leading indicators, empowering policy planners with automated data intelligence.

### Strategic Goals
1. **Automated High-Frequency Collection:** Scrape live domestic fare listings daily across major airlines and OTAs without violating target site terms or rate limits.
2. **Methodological Rigor:** Execute a Two-Tiered Index Structure (**Jevons Geometric Mean** at elementary route-horizon strata; **Young Aggregate Index** weighted by DGCA passenger volumes).
3. **Multi-Horizon Lead Time Tracking:** Maintain separate index series for $T+1, T+7, T+15, T+30,$ and $T+45$ advance booking windows.
4. **Automated Backtesting:** Provide a 30-day backtest engine evaluating index performance (MAPE, RMSE, Pearson $r$, Bias) against engineering benchmarks.
5. **Data Quality & Provenance Transparency:** Display real-time Data Quality Scores ($DQ$) and full cryptographic payload audit trails (SHA-256) for every price quote.
6. **Multi-Mode Demo Resilience:** Enforce strict structural isolation between `LIVE`, `HISTORICAL`, and `SYNTHETIC` data modes to guarantee 100% demo uptime.

---

## 3. Target User Personas

| Persona | Role & Organization | Primary Goals | Key Workflows |
|---|---|---|---|
| **Dr. Aris (NSO Statistician)** | Senior Statistician, NSO MoSPI | Verify statistical index integrity; export monthly CPI augmentation series. | Inspect daily Jevons/Young index movements; audit data quality scores; export CPI JSON/CSV data. |
| **Priya (Policy Analyst)** | Macroeconomic Analyst, MoSPI DIID | Track real-time air travel inflation; analyze holiday price surges. | View national & route-level heatmaps; inspect lead-time price curves; review AI short-term forecasts. |
| **Vikram (SIH Judge)** | Jury Member, SIH 2026 | Evaluate software compliance, technical depth, and backtesting proof. | Test live scrapers; run 30-day backtesting pipeline; verify payload provenance & data mode tags. |
| **Rohan (System Admin)** | Lead Engineer, Platform Team | Monitor scraping fleet health, manage route basket, maintain system uptime. | Review scraper success rates; update DGCA route weights; inspect DOM drift alerts. |

---

## 4. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      1. SCRAPING FLEET LAYER                            │
│  Playwright / Scrapy Engines ──► Rate Limiting (>=2s) ──► Robots.txt    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   2. NORMALIZATION & CLEANING LAYER                     │
│ Base Fare + UDF/ASF/GST Normalizer ──► Deduplication ──► Outlier Filter │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    3. PRICE INDEX MICROSERVICE                          │
│ Tier 1: Jevons Geometric Mean (Unweighted)                              │
│ Tier 2: Young Aggregation (DGCA Pax Volume Weights w_r)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 4. BACKTESTING & QUALITY ENGINE                         │
│ 30-Day Backtesting Engine ──► Metric Evaluator ──► Data Quality Score   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   5. DASHBOARD & API EXPONENT                           │
│ Interactive Web Dashboard ──► Provenance Inspector ──► MoSPI REST API   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Traceability to Research & Methodology Freeze

This PRD derives all requirements strictly from:
* **Research Dossier (`docs/research/`):** 18 source-backed research documents.
* **Methodology Freeze (`docs/methodology/`):** Frozen mathematical specifications, data observation models, and decision tables.
