# Executive Research Summary & Synthesis — SIH26056 Dossier

---

## 1. Core Synthesis & Key Questions Answered

### Q1: What exactly does SIH26056 require?
SIH26056 requires an automated web scraping and price index computation platform to track domestic airfares across Indian airline websites and OTAs. Key mandated capabilities include high-frequency (daily) collection, multi-lead time advance booking horizons ($T+1, T+7, T+15, T+30, T+45$), 30-day historical backtesting against reference benchmarks, fare normalization/cleaning, and integration-ready outputs to augment MoSPI's Consumer Price Index (CPI).

### Q2: What data do we actually have?
*   **DGCA First-Party Data:** Monthly domestic city-pair passenger traffic volume reports and airline market share statistics from `dgca.gov.in` (used to construct empirical route weights $w_r$).
*   **Scraped Target Web Portals:** Publicly accessible flight search DOM listings on airline sites (IndiGo, Air India) and major OTAs (MakeMyTrip, Yatra, EaseMyTrip).
*   **MoSPI CPI Framework Data:** COICOP 2018 item classification, 2024 Base Year weighting structures, and NSO methodological guidelines.

### Q3: What data are we missing?
*   **Downloadable DGCA Historical Airfare Micro-CSV:** **NOT VERIFIED AT FIRST-PARTY DGCA LEVEL**. DGCA monitors fare bands via its Tariff Monitoring Unit (TMU) but does not publish a downloadable time-series CSV of raw historical ticket purchase fares.
*   **Real-Time Flight-Level Ticket Sales Quantities ($q_{i,t}$):** Impossible to extract via web scraping (necessitating an unweighted elementary index formula like Jevons).

### Q4: What methodology should we use?
A **Two-Tiered Price Index Architecture**:
1.  **Tier 1 (Elementary Stratum):** Unweighted **Jevons Geometric Mean Index** calculated per Route $\times$ Booking Horizon $T+N$ cell.
2.  **Tier 2 (National Aggregation):** **Young / Modified Laspeyres Index** using DGCA monthly domestic city-pair passenger volume weights ($w_r$).

### Q5: Why?
*   **Jevons Index:** Satisfies time-reversal and transitivity tests, prevents upward price volatility bias (which corrupts arithmetic means like Carli), and is explicitly mandated by the IMF/ILO CPI Manual (2020) for e-commerce web scraping.
*   **Young Aggregate Index:** Directly accommodates DGCA monthly passenger traffic weights, providing a statistically defensible national airfare price relative without requiring unavailable real-time sales quantities ($q_{i,t}$).

### Q6: What assumptions are we making?
1.  **Advance Booking Horizon Weights ($\alpha_h$):** Assigned as $T+15: 40\%, T+7: 25\%, T+30: 20\%, T+1: 10\%, T+45: 5\%$ based on empirical Indian booking distributions.
2.  **Constant Utility Economy Seat:** Scraped fares are normalized to standard economy cabin with mandatory taxes included, excluding optional add-on amenities (seat selection, meals, baggage over 15kg).
3.  **Representative Route Basket:** Top 15 directional city pairs represent overall Indian domestic air travel price inflation.

### Q7: What remains uncertain?
*   Target website anti-bot policy changes during live competition judging.
*   Exact official baseline month NSO will select when formally integrating high-frequency air travel indices.

### Q8: What must the PRD include?
*   Multi-mode data ingestion pipeline (`LIVE`, `HISTORICAL`, `SYNTHETIC`).
*   Automated Playwright/Scrapy scraper modules with rate limiting ($\ge 2.0$s) and robots.txt parsing.
*   Fare normalization engine (isolating `base_fare`, taxes, UDF; dropping convenience fees).
*   Jevons & Young index calculation microservice.
*   30-day automated backtesting and metric validation engine (MAPE, RMSE, Pearson $r$, Bias).
*   Web dashboard with interactive index charts, lead-time heatmaps, data quality scores, and provenance inspector.

### Q9: What must NOT be claimed to judges?
1.  **DO NOT** claim that DGCA provides a public historical average fare CSV API. (State clearly: "DGCA provides passenger volume weights; historical fare benchmark is derived from our 30-day scraped reference database.")
2.  **DO NOT** claim our prototype replaces the official NSO CPI. (State: "It is an experimental augmentation system providing high-frequency leading indicators.")
3.  **DO NOT** present synthetic data as live scraped data. (Always display explicit UI badges).
4.  **DO NOT** claim black-box AI calculates the index. (State: "The index is 100% deterministic statistical math; AI is used strictly for anomaly detection and forecasting.")

### Q10: What are the highest-risk components?
1.  **Scraper Blocking / Anti-Bot Controls:** Target site IP blocks or dynamic DOM structure changes. (Mitigated via rate limiting, User-Agent rotation, and offline historical fixture fallback).
2.  **Live Wi-Fi Outage During Judging:** Presentation failure if live scrapers time out. (Mitigated via Multi-Mode Data Engine toggle).
