# Golden Demo Script
## SIH26056 — Real-Time Airfare Price Index

**Target Duration**: 5 Minutes

### Preparation
1. Run `python backend/scripts/reset_demo_sync.py` to ensure a deterministic dataset.
2. Start backend (`python -m uvicorn app.main:app`).
3. Start frontend (`npm run dev`).
4. Open `http://localhost:3000`.

---

### [0:00] Step 1: Overview
**Action**: Start on the main Dashboard view.
**Talking Points**:
- "Welcome to the SIH26056 Airfare Price Index prototype."
- Point out the **Data Mode Badge** (DEMO MODE — SYNTHETIC DATA), emphasizing data isolation.
- Highlight the **National Index Chart**, showing the macroscopic view.
- Briefly indicate the **Pipeline Status**, noting that data flows from collection, through normalization, into index computation.

### [0:30] Step 2: Route Explorer
**Action**: Navigate to `Route Explorer`. Select `DEL -> BOM`.
**Talking Points**:
- "Underneath the national index are elementary route indices."
- "Here is the heavily trafficked Delhi-Mumbai corridor."
- "Notice the passenger volume weight applied here, derived from DGCA statistics, ensuring the national average isn't skewed by low-volume routes."

### [1:00] Step 3: Booking Horizon
**Action**: Navigate to `Booking Horizon`.
**Talking Points**:
- "Airfares exhibit extreme temporal volatility based on advance booking."
- "A simple daily average is flawed. We stratify data into Horizons (T+1 to T+45)."
- "Notice the price escalation curve at T+1, representing last-minute purchases."

### [1:30] Step 4: Data Quality
**Action**: Navigate to `Data Quality`, then to `Data Cleaning`.
**Talking Points**:
- "To maintain statistical integrity, data must be pristine."
- Show the **Data Quality Scorecard** (8-factor evaluation).
- Switch to **Data Cleaning**: "Here we see a raw observation. We mathematically strip out optional convenience fees, apply Tukey's IQR to eliminate anomalous price spikes, and drop commercial duplicates."

### [2:15] Step 5: Index Engine (Methodology context)
**Action**: Navigate to `Methodology`.
**Talking Points**:
- "Our engine adheres strictly to the IMF/ILO CPI Manual."
- "We use the Jevons Geometric Mean for Tier 1 routes to satisfy the Time Reversal Test, avoiding the upward bias of the Carli index."
- "Tier 2 uses a Young / Modified Laspeyres aggregation."

### [3:00] Step 6: Validation (Backtest)
**Action**: Navigate to `30-Day Backtest`.
**Talking Points**:
- "We don't just calculate an index; we validate it against historical baselines."
- Point out **MAPE**, **RMSE**, and **Pearson r**.
- "If reference data is insufficient, the system safely halts and displays 'REFERENCE DATA UNAVAILABLE' rather than fabricating a score."

### [3:45] Step 7: Provenance Explorer
**Action**: Navigate to `Provenance Explorer`.
**Talking Points**:
- "Transparency is critical for federal adoption."
- "We can trace any macroscopic index value backwards."
- Read down the chain: National Index $\rightarrow$ Route $\rightarrow$ Horizon $\rightarrow$ Normalized Fare $\rightarrow$ Raw Parse $\rightarrow$ SHA-256 Hash.
- "Every data point is cryptographically auditable."

### [4:30] Step 8: Closing
**Action**: Return to `Overview`.
**Talking Points**:
- "In summary: automated collection, robust normalization, mathematically sound aggregation, and cryptographic transparency."
- "Thank you."
