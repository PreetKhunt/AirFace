# MoSPI Context & CPI Airfare Methodology Deep Dive

**Authoritative Sources:**  
1. Ministry of Statistics and Programme Implementation (MoSPI), National Statistical Office (NSO) — *Consumer Price Index (Base Year 2024=100) Revision Release (Feb 12, 2026)*  
2. MoSPI / NSO — *Changes in Item Basket & Weighting Diagram (COICOP 2018 Alignment)*  
3. ILO / IMF / Eurostat — *Consumer Price Index Manual: Concepts and Methods (2020)*  

---

## 1. Executive Context: Why MoSPI Wants Real-Time Airfare Indexing

The National Statistical Office (NSO) under MoSPI releases India's official Consumer Price Index (CPI) on a monthly basis. Historically:
*   Airfare pricing was collected manually or periodically from a small sample of ticketing offices.
*   Airline pricing in India has evolved into dynamic algorithmic pricing, where ticket prices fluctuate rapidly based on demand, lead time, day of the week, and remaining seat inventory.
*   Manual monthly collection misses high-frequency price swings, holiday surges, and advance-purchase discounting curves.

To address these limitations, MoSPI's February 2026 CPI Base Year Revision (Base 2024=100) introduced:
1.  **Digital Price Collection:** Explicit adoption of web-scraped and e-commerce prices for dynamic services (air travel, telecom, digital media).
2.  **Expanded Basket:** Inclusion of international air travel alongside domestic air travel under Division 07 (Transport).
3.  **Increased Weightage:** Transport & Communication weight expanded from **8.59% (in 2012=100)** to **12.41% (in 2024=100)**.

---

## 2. Official CPI Methodology vs SIH26056 Prototype

| Dimension | Current Official MoSPI CPI Practice | SIH26056 Proposed Solution | Our SIH Prototype Scope |
|---|---|---|---|
| **Data Collection** | Monthly physical/online field survey by NSO enumerators | Fully automated web scraping engines targeting airline portals & OTAs | Automated Playwright/Scrapy scrapers collecting daily pricing for selected city pairs |
| **Frequency** | Monthly index release (12th of every month) | Real-time / Daily price index computation | Daily, Weekly, and Monthly aggregated index calculations |
| **Lead Times** | Single point-in-time fare quote (typically 1–7 days before flight) | Multi-horizon advance booking tracking (T+1, T+7, T+15, T+30, T+45) | Explicit sampling across T+1, T+7, T+15, T+30, and T+45 booking windows |
| **Elementary Aggregation** | Jevons (Geometric Mean) or Carli at local quote level | Unweighted Jevons Geometric Mean across route-leadtime strata | Unweighted Jevons formula at (Route x Lead Time) level |
| **Higher-Level Aggregation** | Modified Laspeyres / Young Index with fixed expenditure weights | Traffic-weighted aggregate index using DGCA city-pair passenger volume | Young Index weighted by DGCA monthly passenger traffic volume |
| **Institutional Status** | Official macroeconomic metric (Repo rate, DA calculation) | Augmentation layer / Experimental high-frequency statistical index | Research prototype / Proof-of-concept for DIID / NSO evaluation |

> [!IMPORTANT]
> **Regulatory Disclaimer:** Our SIH prototype does NOT replace the official NSO CPI. It serves as an experimental augmentation tool providing high-frequency (daily) leading indicators to NSO statistician teams.

---

## 3. Elementary & Higher-Level Index Formula Analysis

### 3.1 Elementary Level (Formula: Jevons Index)
At the elementary route stratum level (e.g., DEL $\rightarrow$ BOM for $T+7$ advance booking), price observations are unweighted because individual ticket transaction volumes per specific flight code are unobservable from web scraping.

Following IMF/ILO CPI guidelines, the **Jevons Elementary Index** $I_J^{0:t}$ is defined as:

$$I_J^{0:t} = \prod_{i=1}^{n} \left( \frac{p_{i,t}}{p_{i,0}} \right)^{\frac{1}{n}} = \frac{\left( \prod_{i=1}^{n} p_{i,t} \right)^{\frac{1}{n}}}{\left( \prod_{i=1}^{n} p_{i,0} \right)^{\frac{1}{n}}}$$

*   **Why Jevons?**
    *   Satisfies the **Time Reversal Test** and **Transitivity Test**.
    *   Unbiased against price volatility (unlike the Carli arithmetic mean, which overstates inflation when prices bounce).
    *   Officially endorsed by NSO / Eurostat for e-commerce and web-scraped dynamic prices.

### 3.2 Higher-Level Aggregation (Formula: Young / Modified Laspeyres Index)
To aggregate route-level indexes into a single national domestic airfare index, route weights $w_r$ derived from DGCA annual/monthly passenger traffic shares are applied:

$$I_{National}^t = \sum_{r \in Routes} w_r \cdot I_{r, J}^{0:t} \quad \text{where } \sum_{r} w_r = 1$$

---

## 4. Methodological Adaptations for Airfare

1.  **Fixed-Horizon Sampling:** Standard CPI tracks fixed physical items over time. For air travel, the "item" is defined as a **(City Pair, Airline, Flight Time Slot, Advance Booking Horizon T+N)** tuple.
2.  **Constant Utility Assumption:** To prevent quality bias (e.g., comparing a hand-baggage-only fare to a 15kg baggage fare), scraped fares are normalized to include mandatory taxes and standard economy seat privileges.
