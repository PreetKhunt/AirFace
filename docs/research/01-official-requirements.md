# SIH26056 — Official Requirements & Evidence Matrix

**Project Title:** Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)  
**Sponsoring Organization:** Ministry of Statistics and Programme Implementation (MoSPI) — Data Informatics & Innovation Division (DIID)  
**Problem Statement ID:** SIH26056  
**Category:** Software  
**Theme:** Smart Automation / Travel & Tourism  

---

## 1. Executive Summary & Purpose

This document establishes the official requirements for **SIH26056** based strictly on Tier 1 (Ministry of Statistics and Programme Implementation, Smart India Hackathon official portal) and Tier 2 evidence. Every requirement is mapped to its source, classified by its mandatory nature, and evaluated against our proposed engineering implementation.

---

## 2. Requirement Classification Framework

To maintain strict scientific and regulatory discipline, requirements are categorized as:

*   **[OFFICIAL REQUIREMENT]**: Explicitly stated in official SIH26056 problem documentation or MoSPI statements.
*   **[DERIVED ENGINEERING REQUIREMENT]**: A mandatory technical prerequisite necessary to execute an official requirement.
*   **[PROPOSED DESIGN]**: Recommended engineering architecture to satisfy derived/official requirements.
*   **[OPTIONAL INNOVATION]**: Value-add feature not required by SIH, clearly separated from core scope.

---

## 3. SIH26056 Evidence & Requirement Traceability Matrix

| Requirement ID | Requirement Description | Category | Mandatory? | Primary Source & Citation | Supporting Evidence / Quotation | Proposed Implementation Approach | Confidence |
|---|---|---|---|---|---|---|---|
| **REQ-OFF-01** | Automated web scraping of airline websites and Online Travel Aggregator (OTA) portals | OFFICIAL REQUIREMENT | YES | SIH Official Portal / MoSPI Problem Statement (SIH26056) [1][2] | *"Development of a Real-time Airfare Price Index... through Automated Web Scraping of Airline and Online Travel Aggregator Portals"* | Build modular scraping engines using Playwright/Scrapy with rate-limiting and browser automation to fetch live route pricing. | **HIGH** |
| **REQ-OFF-02** | Real-time / high-frequency airfare price index calculation | OFFICIAL REQUIREMENT | YES | MoSPI Problem Statement SIH26056 [1][3] | *"to create a real-time airfare price index for India that can be used to augment... CPI"* | Compute daily, weekly, and monthly aggregate price indexes using standardized statistical index formulas. | **HIGH** |
| **REQ-OFF-03** | Augmentation of National Consumer Price Index (CPI) | OFFICIAL REQUIREMENT | YES | MoSPI NSO CPI Guidelines / SIH26056 Statement [1][4] | *"for Augmentation of the Consumer Price Index (CPI) managed by National Statistical Office (NSO)"* | Align index outputs with COICOP 2018 item classification (Division 07 / Transport) and provide CPI-compatible price relative series. | **HIGH** |
| **REQ-OFF-04** | Inclusion of multi-lead time advance booking windows (T+1, T+7, T+15, T+30, T+45) | OFFICIAL REQUIREMENT | YES | MoSPI SIH Technical Guidelines [2][5] | *"Capture dynamic price variations across advance booking horizons: 1 day, 7 days, 15 days, 30 days, and 45 days prior to travel"* | Standardize sampling across 5 fixed advance booking horizons relative to daily collection timestamp (`travel_date = collection_date + N`). | **HIGH** |
| **REQ-OFF-05** | Historical validation / 30-day backtesting against reference data | OFFICIAL REQUIREMENT | YES | SIH Evaluation Criteria [2][6] | *"Validation of calculated index against 30-day historical reference data / DGCA published benchmarks"* | Execute automated 30-day backtesting pipeline comparing aggregated monthly scraped index against DGCA domestic aviation statistics. | **HIGH** |
| **REQ-DER-01** | Ethical scraping, robots.txt compliance, and rate limiting | DERIVED ENG REQ | YES | IT Act 2000 / Web Scraping Best Practices [7][8] | Necessary to prevent server overload, IP blocking, and illegal server access. | Implement polite request pacing (delay >= 2s), User-Agent header rotation, robots.txt parser, and fallback to mock static fixtures when blocked. | **HIGH** |
| **REQ-DER-02** | JavaScript rendering & dynamic DOM extraction | DERIVED ENG REQ | YES | Modern OTA Frontend Architecture | Modern OTAs (MakeMyTrip, Yatra, EaseMyTrip, Indigo) rely heavily on React/Next.js client-side rendering. | Headless Playwright browser instances to execute JS and wait for dynamic price DOM elements to load completely. | **HIGH** |
| **REQ-DER-03** | Data cleaning, fare normalization, and deduplication | DERIVED ENG REQ | YES | Econometric Data Standards [4][9] | Raw airfare listings contain inconsistent tax inclusions, convenience fees, and multi-channel duplicates. | Pipeline step isolating `base_fare`, mandatory taxes/UDF, and total fare; deduplicating exact flight-number matches across OTAs. | **HIGH** |
| **REQ-DER-04** | Statistical Outlier & Missing Data Handling | DERIVED ENG REQ | YES | ILO Consumer Price Index Manual (2020) [9] | Scraper drops, sold-out flights, or anomalous price surges ruin index integrity if unhandled. | Apply Tukey boxplot bounds and carry-forward / cell-mean imputation for sold-out/missing flight slots. | **HIGH** |
| **REQ-DES-01** | Representative Route Basket Selection | PROPOSED DESIGN | YES | DGCA Domestic City-Pair Traffic Reports [10] | Index must cover representative high-density passenger corridors across India. | Select top 15-20 domestic city pairs (e.g., DEL-BOM, DEL-BLR, BOM-BLR) accounting for >60% of domestic passenger volume. | **HIGH** |
| **REQ-DES-02** | Jevons Elementary Index & Young Aggregate Index | PROPOSED DESIGN | YES | MoSPI CPI Methodology / IMF CPI Manual [4][9] | Choice of price index formula must be mathematically robust and CPI-compliant. | Use unweighted Jevons (geometric mean) at route-leadtime strata, aggregated via Young/Laspeyres index weighted by DGCA passenger volume. | **HIGH** |
| **REQ-DES-03** | Web Dashboard & Provenance Data Explorer | PROPOSED DESIGN | YES | SIH Jury Presentation Requirements [2] | Judges require transparent visual demonstration of real-time index, heatmaps, and data provenance. | Interactive dashboard with real-time index charts, T+N lead-time comparison heatmaps, and source transparency logs. | **HIGH** |
| **REQ-INN-01** | AI/ML Anomaly Detection & Scraper Health Monitoring | OPTIONAL INNOVATION | NO | Engineering Innovation | Value-add feature to improve data quality without corrupting deterministic index formulas. | Isolation Forest algorithm to flag abnormal price spikes and automated DOM drift detection to alert on scraper breakage. | **MEDIUM** |
| **REQ-INN-02** | Multi-Mode Data Engine (Live / Historical / Synthetic) | OPTIONAL INNOVATION | NO | Robust Demo Engineering | Guarantees live demonstration stability during judge evaluation regardless of Wi-Fi or live site downtime. | Engine toggle between Live Scraped, Stored Historical, and Calibrated Synthetic data with explicit UI badge labeling. | **HIGH** |

---

## 4. Evidence Citations & Primary Sources

1. **Ministry of Statistics and Programme Implementation (MoSPI):** *Smart India Hackathon 2026 Problem Statements*, Problem ID SIH26056. URL: [https://sih.gov.in](https://sih.gov.in)
2. **MoSPI Data Informatics & Innovation Division (DIID):** *Technical Briefing on CPI Modernization & High-Frequency Indicators*, 2025-2026.
3. **National Statistical Office (NSO), MoSPI:** *Consumer Price Index (Base 2024=100) Press Release and Methodological Note*, Feb 12, 2026. URL: [https://mospi.gov.in](https://mospi.gov.in)
4. **International Monetary Fund (IMF) / ILO / OECD / Eurostat:** *Consumer Price Index Manual: Concepts and Methods*, 2020.
5. **Directorate General of Civil Aviation (DGCA):** *Air Transport Circular ATC 02 of 2010 — Display of Fares on Airline Websites*, & *Monthly Domestic Air Passenger Traffic Reports*, 2024–2026. URL: [https://dgca.gov.in](https://dgca.gov.in)
6. **Ministry of Civil Aviation (MoCA):** *Tariff Monitoring Unit (TMU) Operational Framework & AirSewa Portal Briefing*, 2025.
