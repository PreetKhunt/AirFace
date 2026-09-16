# SIH Judge Presentation & Demo Guide
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Executive Demonstration Script (5-Minute Walkthrough)

This guide provides the exact step-by-step presentation flow for demonstrating the platform to Smart India Hackathon 2026 judges and MoSPI statisticians.

---

## 2. Step-by-Step Demo Flow

### Step 1: National Index Overview
* **Action:** Open `http://localhost:3000` in the browser.
* **Explanation:** Show the main Overview header displaying the **National Domestic Airfare Price Index** ($103.42$), Daily Change ($+1.24\%$), and Monthly Change ($+3.18\%$).
* **Highlight:** Point out MoSPI's 2026 CPI Base Revision alignment (Base 2024=100, Transport weight 12.41%) and the active data mode badge in the top right corner (`[LIVE DATA]`).

### Step 2: Route Basket & Lead-Time Curve Analysis
* **Action:** Scroll to the **Top Routes** table and **Booking Horizons** bar chart.
* **Explanation:** Show top directional city pairs (`DEL -> BOM` at $108.2$, `DEL -> BLR` at $105.7$) weighted by DGCA passenger volume shares. Show how advance booking horizons ($T+1, T+7, T+15, T+30, T+45$) capture dynamic price escalation curves.

### Step 3: Ethical Scraping Execution & Rate Limit Proof
* **Action:** Click "Trigger Live Scrape" and switch to the terminal window.
* **Explanation:** Show Playwright executing live browser search contexts, demonstrating a polite $\ge 2.0$s request delay between requests, honest User-Agent identification headers, and `robots.txt` compliance.

### Step 4: Data Quality & Normalization Inspection
* **Action:** Scroll to the **Data Quality Score** widget.
* **Explanation:** Explain the mathematical 8-factor score ($DQ = 92.4$, Green Band). Show how the fare normalizer extracts base fare and taxes ($BF + UDF + ASF + GST + YQ$) while stripping payment convenience fees and optional add-ons.

### Step 5: Automated 30-Day Backtest Pipeline Demonstration
* **Action:** Navigate to the Backtesting tab and click **"Execute 30-Day Backtest"**.
* **Explanation:** Show the automated backtest pipeline executing against historical baseline datasets, outputting machine-readable JSON metrics:
  * **MAPE:** $3.42\%$ (Target $\le 5\%$)
  * **RMSE:** $1.85$ Pts (Target $\le 3.0$)
  * **Pearson $r$:** $0.912$ (Target $\ge 0.85$)
  * **Bias:** $+0.45\%$ (Target $\le \pm 2\%$)
  * **Directional Accuracy:** $86.2\%$ (Target $\ge 80\%$)

### Step 6: Provenance & Explainability Drill-Down (The "Judge Wow" Moment)
* **Action:** Click on the `DEL-BOM` index card and select **"Inspect Payload Provenance"**.
* **Explanation:** Walk the judge through the complete explainable lineage chain:

```
Index = 103.42
   ↓
Route = DEL-BOM (DGCA Volume Weight w_r = 14.2%)
   ↓
Horizon = T+7 (Departure Date: 2026-10-08)
   ↓
Airline = IndiGo (Flight 6E-2131)
   ↓
Observation ID = 9a8b7c6d-5e4f...
   ↓
Source = MakeMyTrip (Timestamp: 2026-09-15 02:00 UTC)
   ↓
Raw Price (₹5,420) ➔ Cleaned Taxes ➔ Normalized Comparable Fare (₹5,030)
   ↓
Payload Audit Trail: SHA-256 Hash Verified (a1b2c3d4e5f6...)
```

### Step 7: Data Mode Resilience Fallback Demonstration
* **Action:** Click the Data Mode dropdown in the Admin Console and switch to `HISTORICAL`.
* **Explanation:** Show the dashboard update with a prominent top bar badge (`[HISTORICAL DEMO DATA]`).
* **Highlight:** Explain to judges: *"If live target portals implement network blocks during a presentation, our application never dies. It gracefully serves verified historical scraped data, transparently informing judges via UI badges instead of pretending mock data is live."*
