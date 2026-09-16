# Security & Compliance Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Compliance & Legal Framework

1. **Information Technology Act 2000 (Section 43):** Scraping MUST NOT engage in unauthorized access, server overload, or circumvention of security controls.
2. **Robots.txt Adherence:** All target portal scraping engines MUST fetch and strictly respect `robots.txt` disallow rules.
3. **Pacing Delay:** Enforce minimum $\ge 2.0$s delay between HTTP requests per domain to prevent Denial of Service (DoS) impact.

---

## 2. Ethical Scraping Security Rules

```http
User-Agent: MoSPI-AirfareIndex-ResearchBot/1.0 (+https://mospi.gov.in/sih26056; research@mospi.gov.in)
```

* **No CAPTCHA Bypassing:** Automatic CAPTCHA cracking or bypass services are strictly forbidden. When blocked, the system flags `SOURCE_BLOCKED` and switches gracefully to historical fixture mode.
* **No Authentication Paywall Bypassing:** Only public search result listings are accessed.

---

## 3. Data Integrity & Provenance Protection

* **Immutable Provenance Logs:** Raw payloads are hashed using SHA-256 upon ingestion and stored in `provenance_audit_trail`.
* **Data Mode Guardrails:** Synthetic test data is tagged `collection_mode = 'SYNTHETIC'` at database constraint level, preventing corrupt data from entering production index calculations.
