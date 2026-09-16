# Ethical Scraping, Robots.txt, Legal Limits & Technical Constraints

---

## 1. Regulatory & Ethical Compliance Directives

To adhere strictly to Indian law (Information Technology Act 2000, Section 43) and international web scraping standards:

> [!IMPORTANT]
> **HARD COMPLIANCE MANDATE:**  
> The scraping engine MUST NOT engage in illegal unauthorized access, CAPTCHA bypassing, authentication cracking, or distributed IP rotation designed to breach target web server security controls.

---

## 2. Technical Scraping Protocol Rules

### 2.1 Rate Limiting & Server Politeness
*   **Request Delay:** Enforce a minimum polite delay of $\ge 2.0$ seconds between consecutive HTTP requests to any single IP/domain.
*   **Concurrency Limits:** Maximum 2 concurrent browser page contexts per domain.
*   **Off-Peak Execution Schedule:** Schedule high-volume batch collection runs during regional off-peak hours (01:00 AM – 05:00 AM IST) to minimize impact on commercial airline web infrastructure.

### 2.2 User-Agent & Transparency Headers
Every HTTP request emitted by the collection engine must present an honest, traceable identification string:

```http
User-Agent: MoSPI-AirfareIndex-ResearchBot/1.0 (+https://mospi.gov.in/sih26056; research@mospi.gov.in)
Accept: text/html,application/xhtml+xml,application/xml;q=0.9
Accept-Language: en-US,en;q=0.9
```

### 2.3 Robots.txt Compliance Engine
Prior to firing scraping requests against any domain (e.g., `make-my-trip.com/robots.txt` or `indigo.in/robots.txt`), the scraper fetches and parses `robots.txt`. Path segments explicitly disallowed for automated indexing (e.g., `Disallow: /booking/checkout`) are bypassed completely. Scraping is restricted to public search result listings (`/flight/search`).

---

## 3. Handling Anti-Bot & Scraper Outages

When a commercial portal implements cloudflare/bot-guard protection or alters its DOM structure:

```
                  [ Scraper Request Target Portal ]
                                  │
                       Is Access Allowed / 200 OK?
                                 ╱ ╲
                                ╱   ╲
                              YES    NO (403/429/CAPTCHA/DOM Drift)
                              ╱       ╲
                             ▼         ▼
                 [ Parse Fare Data ]  [ Log SOURCE_BLOCKED Alert ]
                                       │
                                       ▼
                          [ Fallback to Static Fixture ]
                          (Mark Observation as HISTORICAL_FIXTURE)
```

1.  **Do NOT Retry Aggressively:** If a 429 (Too Many Requests) or 403 (Forbidden) response is received, halt requests to that domain immediately.
2.  **Fallback to Fixtures:** Automatically switch that source segment to stored historical/fixture data mode, raising a `SOURCE_HEALTH_WARNING` on the monitoring dashboard.
