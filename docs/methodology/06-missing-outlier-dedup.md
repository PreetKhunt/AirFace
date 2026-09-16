# Missing Data, Outlier & Deduplication Specification

---

## 1. Classification & Treatment of Data Absence Modes

Data absence occurs due to distinct technical and commercial reasons. Imputation MUST NOT be applied blindly across all cases.

| Absence Code | Absence Mode | Root Cause | Treatment & Imputation Rule | Imputation Allowed? | Official Index Eligible? |
|---|---|---|---|---|---|
| **ABS-01** | `SCRAPER_FAILURE` | Target portal timeout, 5xx server error | Cell-mean imputation for max 3 days | YES (Short-term) | YES (with DQ penalty) |
| **ABS-02** | `MISSING_PRICE_COMPONENT` | Tax breakdown unparsed | Fallback to Mode B (Displayed Total) | NO | YES |
| **ABS-03** | `SOLD_OUT_INVENTORY` | Flight operating, but ticket inventory sold out | Impute price relative using active cell flights | YES | YES (Marked `IS_IMPUTED`) |
| **ABS-04** | `CANCELLED_FLIGHT` | Scheduled flight cancelled by airline | Exclude from cell observation set $N_{r,h,t}$ | NO | NO |
| **ABS-05** | `SOURCE_UNAVAILABLE` | Domain IP blocked / 403 Forbidden | Halt domain requests; switch to fixture mode | NO | NO (Fixture mode only) |
| **ABS-06** | `NO_SERVICE_ROUTE` | No flight scheduled for targeted date | Exclude cell from day $t$ calculation | NO | NO |
| **ABS-07** | `MALFORMED_OBS` | Regex extraction pattern match failure | Drop observation record | NO | NO |

### Imputation Guardrails
1.  **Method:** Cell-mean price relative imputation:
    $$\hat{p}_{i,t} = p_{i,t-1} \times \left( \frac{\sum_{j \in Active} p_{j,t}}{\sum_{j \in Active} p_{j,t-1}} \right)$$
2.  **Max Limit:** Maximum 3 consecutive days. On day 4, drop observation.
3.  **Threshold Rule:** If $>20\%$ of observations in cell $(r, h)$ are imputed, flag cell status as `HIGH_IMPUTATION_WARNING`.

---

## 2. Outlier Handling: Technical Glitches vs Genuine Surges

`[PROPOSED METHODOLOGY]`

```
                       [ Candidate Outlier Flagged ]
                                     │
                  Is Value Physically Impossible (<₹500 / >₹100,000)?
                                   ╱   ╲
                                  ╱     ╲
                                YES      NO
                                ╱         ╲
                               ▼           ▼
                      [ Technical Drop ]  Is Price Spike Validated Across Multi-Source/OTAs?
                                                           ╱   ╲
                                                          ╱     ╲
                                                        YES      NO (DOM Regex Glitch)
                                                        ╱         ╲
                                                       ▼           ▼
                                            [ Genuine Surge ]  [ Technical Drop ]
                                            (RETAIN IN INDEX)  (DROP FROM INDEX)
```

### 2.1 Outlier Rules
*   **Technical / Parsing Anomalies (DROPPED):** Fares resulting from text concatenation (e.g. `52005200`), regex parsing errors, or stale cached pages.
*   **Genuine Market Price Surges (RETAINED):** High prices during Diwali, Dussehra, or emergency weather surges verified across multiple OTAs are **RETAINED in Tier 1 Jevons calculations** to accurately measure retail price inflation.

---

## 3. Multi-Channel Deduplication Strategy

`[DERIVED ENG REQ]`

### 3.1 Preserving Commercial Fare Variations

> [!IMPORTANT]
> **ANTI-OVERDEDUPLICATION MANDATE:**  
> Observations from different booking channels or OTAs MUST NOT be merged if they represent materially different commercial fare conditions (e.g. `Hand-Baggage Only` vs `Flexi Fare`). Merging all quotes to a single minimum price destroys valuable channel pricing data.

### 3.2 Deduplication Matching Key

Two scraped observation records are defined as **Strict Duplicates** if and only if all of the following match exactly:

$$\text{Match Key} = (\text{origin}, \text{destination}, \text{airline\_code}, \text{flight\_number}, \text{travel\_date}, \text{departure\_time}, \text{fare\_family})$$

### 3.3 Deduplication Rules
1.  **Strict Duplicates (Same Source):** If exact Match Key appears multiple times from the same scraper run $\rightarrow$ Keep first record, drop duplicates.
2.  **Cross-Channel Identical Quotes (Multi-Source):** If exact Match Key appears across IndiGo.in (₹5,200) and MakeMyTrip (₹5,200) with identical fare rules $\rightarrow$ Retain minimum mandatory price, set `source_type = MULTI_SOURCE`, and increment multi-source validation score.
