# Data Architecture Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. End-to-End Data Pipeline Architecture

Data flows through 6 distinct states within the system, ensuring complete data lineage, quality filtering, and cryptographic auditability:

```
[ Stage 1: Ingestion ] ──► [ Stage 2: Raw Storage ] ──► [ Stage 3: Normalization ]
(Playwright DOM Scrape)     (PostgreSQL JSONB)          (Base+Tax Component Ext)
                                                                │
                                                                ▼
[ Stage 6: Presentation ] ◄── [ Stage 5: Index Store ] ◄── [ Stage 4: Index Engine ]
(Next.js UI & REST API)       (TimescaleDB Hypertable)    (Jevons & Young Formulas)
```

---

## 2. Detailed Data Lifecycle Stages

### Stage 1: Raw Ingestion
* **Inputs:** HTML DOM payloads and JSON API responses from airline/OTA portals.
* **Outputs:** `raw_airfare_observation` records containing raw displayed total, price text, source URL, collection timestamp, and raw HTML snippet.

### Stage 2: Parsing & Structuring
* **Process:** Regex patterns and DOM CSS selectors extract structured fields: `origin`, `destination`, `airline_code`, `flight_number`, `travel_date`, `departure_time`, `raw_total_fare`, `base_fare`, `taxes`.

### Stage 3: Normalization & Quality Filtering
* **Process:** Computes $P_{comparable} = BF + UDF + ASF + GST + YQ$, excluding convenience fees and optional add-ons. Applies multi-OTA deduplication and Tukey IQR outlier bounds.

### Stage 4: Elementary & National Index Calculation
* **Process:** Computes Tier 1 Jevons Geometric Mean $I_{r,h}^{t_0:t}$ per cell $(r, h)$ on day $t$. Aggregates nationally via Tier 2 Jevons and Young methodologies weighted by DGCA passenger volume shares ($w_r$).

### Stage 5: Data Quality & Provenance Attachment
* **Process:** Calculates 8-factor Data Quality Score ($DQ \in [0, 100]$) and attaches immutable cryptographic provenance block (SHA-256 payload hash, URL, timestamp, parser version).

### Stage 6: Persistence & API Serving
* **Process:** Persists index time-series into TimescaleDB hypertables, serving the Next.js Dashboard and FastAPI REST endpoints.

---

## 3. Data Mode Isolation Architecture

To maintain strict data integrity and guarantee 100% presentation resilience:

```
                      [ Data Ingestion Router ]
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  [ MODE: LIVE ]          [ MODE: HISTORICAL ]     [ MODE: SYNTHETIC ]
  Real-time scraped DOM   Stored 30-day scraped    Calibrated test mock
  quotes from target      time-series database     dataset (Demo fallback)
```

* **Storage Tag:** Every observation record contains mandatory column `collection_mode VARCHAR(16) CHECK (collection_mode IN ('LIVE', 'HISTORICAL', 'SYNTHETIC'))`.
* **API Isolation:** API endpoints filter by `collection_mode`. Synthetic data is NEVER mixed into live calculations and carries explicit UI warning badges.
