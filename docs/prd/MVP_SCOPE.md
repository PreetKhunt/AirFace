# MVP Scope Specification (Hackathon Prototype)
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. MVP Scope Overview & Boundaries

The **Minimum Viable Product (MVP)** represents the complete, fully functional software prototype delivered for the Smart India Hackathon 2026 evaluation. It implements all official requirements and key derived engineering specifications required to prove end-to-end viability to MoSPI statisticians and judges.

---

## 2. In-Scope MVP Features Matrix

| Feature Module | In-Scope MVP Implementation | Target Boundary | Status Tag |
|---|---|---|---|
| **Target Route Basket** | **Top 15 Domestic Directional City Pairs** (`DEL-BOM`, `BOM-DEL`, `DEL-BLR`, `BLR-DEL`, `BOM-BLR`, `BLR-BOM`, `DEL-CCU`, `CCU-DEL`, `DEL-HYD`, `HYD-DEL`, `BOM-MAA`, `MAA-BOM`, `DEL-PNQ`, `DEL-PAT`, `BOM-COK`) | 15 Directional Corridors | `[OFFICIAL REQUIREMENT]` |
| **Booking Horizons** | All 5 Mandated Lead Times ($T+1, T+7, T+15, T+30, T+45$) | 5 Advance Horizons | `[OFFICIAL REQUIREMENT]` |
| **Scraper Targets** | **3 Major Portals:** IndiGo Direct (`indigo.in`), MakeMyTrip (`makemytrip.com`), EaseMyTrip (`easemytrip.com`) | 1 Airline + 2 Major OTAs | `[OFFICIAL REQUIREMENT]` |
| **Scraper Technology** | Playwright Chromium (Headless) + Scrapy Engine | Rate-limited ($\ge 2.0$s delay), Robots.txt compliant | `[DERIVED ENG REQ]` |
| **Fare Normalization** | Base Fare + UDF + ASF + GST calculation; stripping convenience fees and optional add-ons | Automatic component parsing | `[OFFICIAL REQUIREMENT]` |
| **Deduplication Engine** | Multi-OTA deduplication matching on `(origin, dest, airline, flight_no, travel_date, departure_time, fare_family)` | Minimum mandatory price selection for identical fare tiers | `[DERIVED ENG REQ]` |
| **Outlier Cleaning** | Tukey IQR bounds ($1.5 \times IQR$) filtering technical DOM parsing glitches | Preserves multi-source validated market surges | `[PROPOSED METHODOLOGY]` |
| **Price Index Engine** | Tier 1: Unweighted Jevons Geometric Mean ($I_{r,h}^{t_0:t}$); Tier 2: Young Index ($I_{National}^{t_0:t}$) weighted by DGCA passenger volume shares | Daily, Weekly, Monthly aggregated series | `[PROPOSED METHODOLOGY]` |
| **Backtesting Engine** | Automated 30-Day Backtesting Pipeline running against stored historical scraped reference streams | Generates JSON report (MAPE, RMSE, Pearson $r$, Bias, DA) | `[OFFICIAL REQUIREMENT]` |
| **Data Quality Score** | Real-time 8-factor Data Quality Score ($DQ \in [0, 100]$) widget | Live dashboard Quality Indicator | `[PROPOSED ENGINEERING METRIC]` |
| **Multi-Mode Engine** | Strict isolation between `LIVE`, `HISTORICAL`, and `SYNTHETIC` data modes with UI badge labeling | 100% demo resilience toggle | `[PROPOSED METHODOLOGY]` |
| **Provenance Explorer** | Cryptographic payload inspector displaying target URL, scraper timestamp, and SHA-256 payload hash | Full auditability modal | `[PROPOSED METHODOLOGY]` |
| **Web Dashboard UI** | Interactive Web Application featuring line charts, horizon heatmaps, DQ widget, and CPI data export | Responsive React/Next.js UI | `[OFFICIAL REQUIREMENT]` |

---

## 3. Explicit Out-of-Scope Items for MVP

1. Scrapers for international routes or long-haul foreign airlines (Deferred to Finalist Scope).
2. Deep reinforcement learning for automated web selector auto-healing (Deferred to Finalist Scope).
3. Direct production API database write access into NSO's live internal CPI Data Warehouse (Simulated via REST API exports).
