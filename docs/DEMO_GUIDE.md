# AIRFACE (SIH26056) — 5-Minute SIH Presentation & Demo Guide

**Problem Statement:** SIH26056 — Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)  
**Brand:** AIRFACE (India's Airfare Intelligence Platform)  
**Evaluation Mode:** Prototype Validation & Demonstration  

---

## 1. Executive Summary & Value Proposition

AIRFACE is an end-to-end data intelligence platform engineered to demonstrate automated airfare collection, fare component normalization, commercial deduplication, empirical data quality scoring, axiomatic Jevons elementary index construction, DGCA traffic volume aggregation, and cryptographic auditability for potential augmentation of the Consumer Price Index (CPI).

---

## 2. Pre-Demo Setup & Preparation

Run the single, deterministic seed command to prepare a pristine, validated environment:

```bash
# In backend virtual environment:
python -m backend.scripts.seed_demo
```

Verify output indicates:
- `571` raw and parsed observations ingested
- `571` normalized index observations generated
- `48` Tier 1 elementary route indices computed
- `64` Tier 2 DGCA traffic-weighted national aggregate indices computed
- `571` cryptographic provenance trails created
- `1` statistical backtest validation run completed (Status: `VALIDATED`)

Start the services:
```bash
# Terminal 1: Backend API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend Dashboard
cd frontend && npm run dev
```

Open `http://localhost:3000` in the browser.

---

## 3. The 5-Minute Coherent Presentation Flow

```
RAW AIRFARE ➔ PARSED RECORD ➔ NORMALIZED FARE ➔ DATA QUALITY ➔ ROUTE INDEX ➔ HORIZONS ➔ DGCA NATIONAL AGGREGATION ➔ VALIDATION ➔ PROVENANCE
```

---

### STEP 1: Overview Dashboard (`/`) — Macroeconomic Signal & Data Mode
- **Action:** Open `http://localhost:3000`.
- **Explain to Judges:**
  - Point to the **DATA MODE Badge** in the top navigation bar (`HISTORICAL DEMO` or `SYNTHETIC DEMO` or `LIVE`).
  - *Key principle:* AIRFACE never fabricates live scraping or presents static hardcoded mocks as live data. The system always clearly identifies its data mode.
  - Review the **National Airfare Price Index** ($100.00$ base), **Coverage** ($100\%$), **Active Domestic Corridors** ($9$), and **Observations Processed** ($571+$).
  - Clarify the macroeconomic definition: *"An experimental airfare price indicator derived from the configured route basket and methodology."*

---

### STEP 2: Booking Horizons (`/booking-horizon`) — Temporal Price Dynamics
- **Action:** Click **HORIZONS** in the navigation bar.
- **Explain to Judges:**
  - Air travel dynamic pricing is fundamentally time-dependent. Comparing booking horizons prevents aggregation bias.
  - Show the 5 mandated booking horizons:
    - **T+1:** Last-minute / emergency / premium business travel
    - **T+7:** Short-lead domestic bookings
    - **T+15:** Mid-window corporate & leisure travel
    - **T+30:** Advance planned travel
    - **T+45:** Early-bird baseline window
  - Highlight the price escalation curve visualization demonstrating how airfare levels evolve as the flight departure date nears.

---

### STEP 3: Route Intelligence (`/route-explorer`) — Tier 1 Elementary Analysis
- **Action:** Click **ROUTES** in the navigation bar. Select `DEL → BOM`.
- **Explain to Judges:**
  - Select high-density trunk routes (e.g., `DEL-BOM`, `DEL-BLR`, `BOM-BLR`).
  - Demonstrate route index level, observation counts, and historical trajectory.
  - Show how individual flight observations across airlines (IndiGo, Air India, Akasa Air, SpiceJet) form an unweighted Jevons elementary cell for each route and horizon.

---

### STEP 4: Index Analytics & DGCA Weights (`/index-analytics`) — Aggregation Methodology
- **Action:** Click **ANALYTICS** in the navigation bar.
- **Explain to Judges:**
  - Show the mathematical comparison between **Tier 2 Jevons Geometric Mean** and **Young / Modified Laspeyres Weighted Formula**.
  - Review the **DGCA Passenger Traffic Reference Weights Basket Table**:
    - Explain that passenger volume shares published by DGCA (e.g., `DEL-BOM` at $24.5\%$, `DEL-BLR` at $18.2\%$) serve as traffic-based reference weights.
    - Transparently disclose that traffic shares are volume references rather than exact household consumer expenditure weights.

---

### STEP 5: Data Cleaning & Quality Engine (`/data-cleaning` & `/data-quality`) — Pipeline Integrity
- **Action:** Click **CLEANING** and **QUALITY** in the navigation bar.
- **Explain to Judges:**
  - Walk the judges through the five-stage pipeline counters:
    $$\text{RAW} \longrightarrow \text{PARSED} \longrightarrow \text{NORMALIZED} \longrightarrow \text{DQ EVALUATION} \longrightarrow \text{INDEX READY}$$
  - Select an observation to inspect:
    - **Fare Decomposition:** Show that $P_{\text{comparable}} = \text{Base} + \text{UDF} + \text{ASF} + \text{GST} + \text{YQ}$, while convenience fees and optional add-ons (meals, baggage, seat selection) are excluded.
    - **Component Consistency:** Highlight that component sums are strictly validated against raw displayed totals to prevent double-counting.
    - **Outlier Handling:** Explain how Tukey IQR anomaly bounds with a strict $3.5\times$ median ceiling filter transient web scraping glitches while preserving genuine market price surges.
  - Review the **8-Factor Empirical Data Quality Score**: Completeness, Validity, Consistency, Freshness, Reliability, Deduplication, Outlier Cleanliness, and Coverage.

---

### STEP 6: Statistical Validation & Backtesting (`/backtest`) — Empirical Accuracy
- **Action:** Click **VALIDATION** in the navigation bar.
- **Explain to Judges:**
  - Show the 30-day temporal validation results evaluated against version-controlled reference datasets:
    - **Evaluated Pairs:** $30/30$ matched days ($100\%$ sample coverage)
    - **MAPE, RMSE, Pearson $r$, Directional Accuracy**
  - Highlight the prominent methodological disclosure:
    *"Official historical DGCA airfare micro-data was not available for prototype validation; validation baselines represent version-controlled demo reference datasets. Performance benchmarks (e.g. MAPE < 5%) represent proposed project acceptance targets rather than statutory federal mandates."*

---

### STEP 7: Cryptographic Provenance (`/provenance`) — Tamper-Evident Lineage
- **Action:** Click **PROVENANCE** in the navigation bar.
- **Explain to Judges:**
  - Select any observation or route.
  - Demonstrate the unbroken, tamper-evident audit trail:
    $$\text{National Index} \rightarrow \text{Route Cell} \rightarrow \text{Booking Horizon} \rightarrow \text{Normalized Fare} \rightarrow \text{Parsed Observation} \rightarrow \text{Raw Payload URL} \rightarrow \text{SHA-256 Checksum}$$
  - Click **"COPY TO CLIPBOARD"** to show the exact SHA-256 hash.
  - Explain: *"Every single price relative in the AIRFACE index has a permanent cryptographic fingerprint linked back to its original raw payload."*

---

### STEP 8: System Status (`/system-status`) & Methodology (`/methodology`) — Production Telemetry
- **Action:** Click **STATUS** and **METHODOLOGY**.
- **Explain to Judges:**
  - Show live health telemetry across Frontend, Backend API, Database, Redis/Celery, and Scraper Adapters.
  - Conclude with the structured methodology separating Official Requirements, Verified CPI Principles, Project Engineering Decisions, and Prototype Disclosures.

---

## 4. Summary of Key Strengths for Judges

1. **Zero Hardcoded Fake Data:** Every chart, card, metric, and hash is dynamically queried from the live backend API and database.
2. **Mathematical Rigor:** Strict implementation of Jevons elementary index, Young national aggregation, and Tukey IQR outlier bounds.
3. **Double-Counting Protection:** Component arithmetic is verified before inclusion into elementary cells.
4. **Data Mode Transparency:** Clear labeling of `LIVE`, `HISTORICAL DEMO`, and `SYNTHETIC DEMO` modes across the entire UI.
5. **Auditability:** Complete cryptographic provenance with SHA-256 payload checksums.
