# Phase G Final Prototype Report
## SIH26056 — Real-Time Airfare Price Index

**Status:** COMPLETED — FINAL PROTOTYPE FREEZE CANDIDATE

### 1. End-to-End Reset & Determinism
A dedicated deterministic demo initialization script (`backend/scripts/reset_demo_sync.py`) was constructed to natively rebuild the database schema from scratch and execute the exact calculation pipeline:
- **Ingestion**: Ingests the 450-row historical fixture and 90-row synthetic fixture.
- **Normalization**: Synchronously computes base fares + taxes.
- **Index Calculation**: Derives the Jevons elementary index per route and the Young/Modified Laspeyres national index deterministically.
- **Validation**: Executes the 30-day temporal backtest against mock baseline benchmarks.
Result: **Determinism achieved**. No random variation occurs across runs.

### 2. Data Mode Isolation Check
- `SYNTHETIC` strictly loads from the `-synthetic.json` file. The frontend correctly badges all routes with "DEMO MODE — SYNTHETIC DATA". 
- `HISTORICAL` strictly loads `-historical.json`. No cross-contamination occurs. 
- The application isolates these contexts via backend filtering clauses.

### 3. Failure Injection & Resilience
- **Backend Unavailable**: Frontend degrades gracefully using the `StateBoundary` layout (displays connection error with retry button).
- **Missing Reference Data**: Backtest correctly halts generation of MAPE/RMSE and clearly renders `REFERENCE DATA UNAVAILABLE`. No fabricated reference strings are generated.
- **Empty Routes/Horizons**: Handled safely in UI via explicit empty state prompts rather than throwing uncaught `TypeError` mapping exceptions.

### 4. Provenance Integrity
The manual Provenance trace correctly outputs:
- Macroscopic (National Index): E.g., `105.20`
- Microscopic (Parsed Obs): E.g., `IndiGo 6E-2131 ₹5420`
- Cryptographic (SHA-256): Resolves perfectly to the backend's `index_obs_id` checksum signature.

### 5. Final Test Results
- **Frontend Test Suite**: 9 Passed, 0 Failed, 0 Skipped (via Jest).
- **Backend Test Suite**: 91 Passed, 0 Failed, 0 Skipped (via Pytest).
- **TypeScript & Linting**: 0 Errors (`npx tsc --noEmit` and `npm run lint`).
- **Production Build**: 0 Errors (`Compiled successfully` via babel override).

### 6. Infrastructure Status
- **Docker / PostgreSQL**: As native Docker & Redis are currently absent from the deployment host, the containerized end-to-end integration remains untested in this phase. The application flawlessly relies on its designed fallback mechanics (SQLite Database, Synchronous task simulation scripts).

### 7. Known Limitations & Remaining Risks
- The frontend Next.js application relies on a `.babelrc` bypass to compensate for a missing Windows x64 SWC binary.
- Live scraping cannot run without Redis/Celery background task broker availability.
- Backtest statistical validity is intrinsically bound to the precision of future DGCA-provided reference data. 
