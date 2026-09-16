# Non-Functional Requirements (NFR) Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Performance & Throughput Requirements

| NFR ID | Area | Metric / Target | Detailed Specification |
|---|---|---|---|
| **NFR-PERF-01** | Index Computation Speed | **$< 5.0$ Seconds** | Calculation of Tier 1 Jevons and Tier 2 Young indices across 15 routes $\times$ 5 horizons must complete in $<5.0$ seconds. |
| **NFR-PERF-02** | Dashboard Page Load Time | **$< 2.0$ Seconds** | Dashboard UI page load and initial chart rendering must complete in $<2.0$ seconds on standard broadband. |
| **NFR-PERF-03** | API Response Latency | **$< 500$ ms** | REST API endpoints returning index series for CPI export must respond in $<500$ ms ($p95$). |
| **NFR-PERF-04** | Scraper Pacing Delay | **$\ge 2.0$ Seconds** | Scraping engine must enforce a minimum delay of $\ge 2.0$ seconds between requests per domain. |

---

## 2. Scalability Requirements

| NFR ID | Area | Target Capacity | Detailed Specification |
|---|---|---|---|
| **NFR-SCAL-01** | Route Capacity | **$100+$ Corridors** | System database and calculation pipeline must scale to support 100+ domestic and international city pairs. |
| **NFR-SCAL-02** | Daily Observation Volume | **$100,000+$ Obs/Day** | Database schema and indexing must comfortably ingest and process $>100,000$ raw fare observations daily. |
| **NFR-SCAL-03** | Time-Series Data Retention | **$36+$ Months** | Historical database must store and index 36+ months of daily price observation records for longitudinal research. |

---

## 3. Security & Legal Compliance Requirements

| NFR ID | Area | Regulation / Standard | Detailed Specification |
|---|---|---|---|
| **NFR-SEC-01** | Legal Scraping Compliance | **IT Act 2000 (Section 43)** | Scraping MUST NOT engage in illegal unauthorized access, CAPTCHA cracking, or paywall bypassing. |
| **NFR-SEC-02** | Robots.txt Adherence | **Web Scraping Ethics** | Scrapers MUST parse and strictly obey `robots.txt` disallow directives on target portals. |
| **NFR-SEC-03** | Transparent Bot Identification| **HTTP Header Standard** | Requests MUST present honest User-Agent headers identifying MoSPI research context and contact email. |
| **NFR-SEC-04** | API Access Security | **OAuth2 / API Key** | MoSPI data export REST API endpoints MUST require valid API key authentication. |

---

## 4. Reliability & Availability Requirements

| NFR ID | Area | Target Metric | Detailed Specification |
|---|---|---|---|
| **NFR-REL-01** | Pipeline Availability | **$99.9\%$ Uptime** | Processing pipeline and dashboard API must achieve $99.9\%$ operational availability. |
| **NFR-REL-02** | Scraper Outage Fallback | **Automated Fallback** | Target portal blocks or 403 errors MUST trigger immediate fallback to historical fixture mode with alert logging. |
| **NFR-REL-03** | Database Disaster Recovery | **Daily Automated Backup** | PostgreSQL / Time-series database MUST execute daily automated backups with $<1$ hour Recovery Point Objective (RPO). |

---

## 5. Auditability & Maintainability Requirements

| NFR ID | Area | Standard / Mechanism | Detailed Specification |
|---|---|---|---|
| **NFR-AUD-01** | Cryptographic Provenance | **SHA-256 Hash Audit** | Every observation record MUST store target URL, scraper timestamp, parser version, and SHA-256 payload hash. |
| **NFR-AUD-02** | Mathematical Auditability | **100% Deterministic Core** | Core price index calculations MUST use pure deterministic formulas (Jevons/Young); no black-box ML in index path. |
| **NFR-AUD-03** | System Configuration Isolation| **YAML Config Files** | Route weights, horizon weights, and base dates MUST be stored in external `config/*.yaml` files without code edits. |
