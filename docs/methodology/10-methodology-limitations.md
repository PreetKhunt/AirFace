# Methodology Limitations & Constraints Specification

---

## 1. Technical & Engineering Limitations

1.  **Dynamic DOM Layout Changes:** Target airline and OTA portals frequently update their React/Next.js frontend code. Unannounced DOM selector updates can break scraper extraction rules, requiring fallback to stored historical fixtures.
2.  **Anti-Bot Access Restrictions:** Cloudflare, Akamai, and anti-scraping security tools may issue 403 Forbidden or 429 Rate Limit responses. Because legal compliance forbids unauthorized CAPTCHA bypassing, affected portals cannot be scraped live during active block windows.
3.  **Headless Browser Memory Footprint:** Running multiple Playwright Chromium instances for JavaScript-heavy pages incurs significant CPU and RAM overhead, limiting peak scraping concurrency.

---

## 2. Statistical & Econometric Limitations

1.  **Unobserved Flight Sales Quantities ($q_{i,t}$):** Web scraping extracts published ticket fares ($p_{i,t}$), but cannot observe the exact number of tickets sold at each price point per flight. Consequently, superlative indices (Fisher, Törnqvist) are infeasible for daily computation, necessitating an unweighted Jevons elementary index.
2.  **Volume vs Expenditure Weighting Proxy:** Route weights $w_r$ are derived from DGCA monthly passenger volume shares. While passenger volume is a strong proxy, it does not perfectly equal true consumer expenditure share (which would require multiplying volume by average yield).
3.  **Single-Month Backtest Sample Limits:** A 30-day collection window yields only $N=1$ monthly index observation pair when compared against a single monthly reference release. Evaluating statistical correlation ($r$) on monthly data requires accumulating a multi-month time series.

---

## 3. Data Availability & Benchmark Limitations

1.  **Absence of First-Party DGCA Historical Fare Micro-Data:** DGCA does **NOT** publish a downloadable public time-series CSV of raw historical ticket purchase fares. The 30-day backtest compares calculated index numbers against an internal calibrated historical scraped reference archive.
2.  **Unobserved Sold-Out Fares:** When a flight is completely sold out, its true market clearing price is unobservable. Cell-mean imputation provides an estimate, but cannot capture exact peak demand.

---

## 4. Legal & Regulatory Constraints

1.  **Rate Limiting Delay ($\ge 2.0$s):** Respecting target server capacity requires enforcing a minimum 2.0-second delay between requests, capping maximum daily scraped route sampling density.
2.  **Robots.txt Disallow Directives:** Scraping is strictly restricted to public flight search result pages; checkout and booking paths are bypassed entirely.
