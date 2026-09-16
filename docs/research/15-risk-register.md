# Comprehensive Risk Register (Data, Statistical, Legal, Engineering, Judging)

---

## 1. Risk Matrix Overview

This risk register evaluates operational, scientific, legal, and presentation risks for SIH26056, establishing proactive mitigation strategies for each.

---

## 2. Detailed Risk Register

| Risk ID | Risk Category | Risk Description | Probability | Impact | Risk Severity | Mitigation Strategy |
|---|---|---|---|---|---|---|
| **RSK-DAT-01** | Data Risk | Target airline/OTA website implements aggressive Cloudflare bot blocking | HIGH | HIGH | **CRITICAL** | Implement polite rate limiting ($\ge 2.0$s delay), rotation of user agents, and fallback to pre-collected historical fixture datasets. |
| **RSK-DAT-02** | Data Risk | Target portal redesigns DOM structure, breaking CSS selectors | HIGH | MEDIUM | **HIGH** | Build resilient parsing selectors (XPath/regex fallback) and automated DOM drift alerts; fallback to mock fixture. |
| **RSK-DAT-03** | Data Risk | Sold-out or unavailable flight slots cause missing fare observations | MEDIUM | MEDIUM | **MEDIUM** | Apply cell-mean imputation using active operating flights on the same route stratum. |
| **RSK-STA-01** | Statistical Risk | Choice of unweighted Carli index causes severe upward inflation bias | LOW | HIGH | **HIGH** | Enforce Jevons Geometric Mean Index for elementary route strata as mandated by IMF CPI Manual. |
| **RSK-STA-02** | Statistical Risk | Unrepresentative route basket leads to skewed national index | MEDIUM | HIGH | **HIGH** | Deriving route basket & weights from DGCA Monthly City-Pair Traffic volume reports covering >60% of national pax traffic. |
| **RSK-STA-03** | Statistical Risk | Evaluating correlation on small sample size ($N<15$) produces invalid metrics | MEDIUM | MEDIUM | **MEDIUM** | Enforce statistical guardrails; only report Pearson correlation when $N \ge 15$ aligned observation pairs exist. |
| **RSK-LEG-01** | Legal Risk | Web scraping violates target site Terms of Service or IT Act 2000 | MEDIUM | HIGH | **HIGH** | Comply strictly with `robots.txt`, limit requests, identify with honest User-Agent headers, and use public fixture data when blocked. |
| **RSK-ENG-01** | Engineering Risk | Headless browser instances (Playwright) consume excessive RAM | HIGH | MEDIUM | **HIGH** | Use pool recycling, headless context isolation, and fall back to lightweight HTTP requests where possible. |
| **RSK-ENG-02** | Engineering Risk | Raw price observation database expands uncontrollably | MEDIUM | LOW | **LOW** | Implement time-series database retention policies (partition daily raw records, compress after 90 days). |
| **RSK-JDG-01** | Judging Risk | Presenting synthetic or mock data as "live scraped data" to SIH judges | LOW | CRITICAL | **CRITICAL** | Enforce explicit UI badge labeling (`[MODE: LIVE]`, `[MODE: HISTORICAL]`, `[MODE: SYNTHETIC]`) with 100% data mode isolation. |
| **RSK-JDG-02** | Judging Risk | Inability to explain mathematical index formula during evaluation | LOW | HIGH | **HIGH** | Provide interactive "Index Formula Transparency / Explainability Mode" on dashboard showing exact Jevons/Young step breakdown. |
| **RSK-JDG-03** | Judging Risk | Live Wi-Fi failure during SIH final judge presentation | HIGH | CRITICAL | **CRITICAL** | Implement offline demo toggle mode using pre-cached 30-day historical scraped database with zero external network dependency. |
