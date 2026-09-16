# Airfare Normalization & Data Quality Methodology

---

## 1. Definition of "Comparable Fare" in CPI Theory

To satisfy the **Constant Quality Principle** of Consumer Price Index construction (IMF/ILO CPI Manual 2020), price comparisons over time must measure pure price changes for an identical consumer basket rather than changes caused by quality alterations or optional add-on fees.

### Included vs Excluded Fare Components

| Fare Component | Included in Index Fare? | Econometric Rationale |
|---|---|---|
| **Base Fare** | **INCLUDED** | Core carrier transport charge |
| **User Development Fee (UDF)** | **INCLUDED** | Mandatory airport tax charged to all passengers |
| **Aviation Security Fee (ASF)** | **INCLUDED** | Mandatory government security tariff |
| **Goods & Services Tax (GST)** | **INCLUDED** | Mandatory statutory indirect tax on air travel |
| **Fuel Surcharge / YQ** | **INCLUDED** | Mandatory fuel component of ticket |
| **Convenience Fee (OTA Payment)** | **EXCLUDED** | Optional payment channel fee (varies by UPI/Card/Bank) |
| **Seat Selection Fee** | **EXCLUDED** | Optional ancillary amenity |
| **Extra Checked Baggage Fee** | **EXCLUDED** | Optional service (standard 15kg included in economy) |
| **In-Flight Meal Fee** | **EXCLUDED** | Optional ancillary amenity |
| **Travel Insurance Fee** | **EXCLUDED** | Optional financial product |
| **Bank Credit Card Discounts** | **EXCLUDED** | Conditional promotional pricing not available universally |

$$\text{Normalized\_Fare} = \text{Base\_Fare} + \text{UDF} + \text{ASF} + \text{GST} + \text{Mandatory\_Fuel\_Surcharge}$$

---

## 2. Deduplication Strategy Across Multi-Source Scraping

When scraping both Airline Direct Portals (IndiGo, Air India) and OTAs (MakeMyTrip, Yatra, EaseMyTrip), the same physical flight departure will appear multiple times in raw data.

### Deduplication Classification
1.  **Duplicate Observation:** Scraped from the exact same source with identical flight number, departure time, and fare within a single scraping run. -> *Action: Drop duplicate record.*
2.  **Legitimate Multi-Source Observation:** The exact same physical flight code (`6E-2131 DEL->BOM` departing 08:00) observed concurrently on IndiGo.in (₹5,200) and MakeMyTrip (₹5,350).

### Multi-Source Matching Algorithm
*   Match Key: `(origin, destination, airline_code, flight_number, travel_date, departure_time)`
*   **Resolution Rule:** Select the **minimum mandatory price** available across verified channels (representing consumer search optimization behavior) and mark the observation as `MULTI_SOURCE_VALIDATED`.

---

## 3. Statistical Treatment of Outliers & Missing Observations

### 3.1 Outlier Detection (Tukey's IQR Bound)
For a route-leadtime cell $(r, h)$ on date $t$:

$$IQR = Q_3 - Q_1$$

$$\text{Lower Bound} = Q_1 - 1.5 \times IQR, \quad \text{Upper Bound} = Q_3 + 1.5 \times IQR$$

*   **Parsing Error Outliers:** Fares outside bounds caused by DOM extraction failures (e.g. scraping ₹52,000 due to concatenated text) are flagged and dropped.
*   **Genuine Surge Pricing Outliers:** Fares outside bounds that are verified across multiple OTAs during festival seasons (e.g. Diwali surge) are **retained** as true inflation signals.

### 3.2 Imputation of Sold-Out / Missing Flights
If a flight operating at period $t-1$ becomes sold-out or unobservable at period $t$, missing price relative is imputed using the **overall cell mean movement** of remaining active flights on the same route:

$$\hat{p}_{i,t} = p_{i,t-1} \times \left( \frac{\sum_{j \in Active} p_{j,t}}{\sum_{j \in Active} p_{j,t-1}} \right)$$
