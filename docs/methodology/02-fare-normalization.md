# Fare Normalization Specification

---

## 1. Executive Purpose & Constant Quality Mandate

In accordance with IMF/ILO CPI guidelines (2020), price indexes must measure pure price changes over time for a constant-utility commodity. For air travel, the commodity is defined as a **Standard Economy One-Way Ticket with 15kg Check-in Baggage and Mandatory Passenger Taxes Included**.

---

## 2. Fare Component Definitions

| Component Code | Component Name | Inclusion Status | Classification Tag | Description |
|---|---|---|---|---|
| `BF` | Base Fare | **INCLUDED** | `[OFFICIAL REQUIREMENT]` | Carrier base transport tariff |
| `UDF` | User Development Fee | **INCLUDED** | `[OFFICIAL REQUIREMENT]` | Mandatory airport facility tax |
| `ASF` | Aviation Security Fee | **INCLUDED** | `[OFFICIAL REQUIREMENT]` | Mandatory government security tariff |
| `GST` | Goods & Services Tax | **INCLUDED** | `[OFFICIAL REQUIREMENT]` | Mandatory statutory indirect tax (5% economy) |
| `YQ` | Fuel Surcharge | **INCLUDED** | `[OFFICIAL REQUIREMENT]` | Mandatory carrier fuel surcharge |
| `CF` | Convenience Fee | **EXCLUDED** | `[DERIVED ENG REQ]` | OTA/Airline credit card processing charge |
| `SEAT` | Seat Selection Fee | **EXCLUDED** | `[PROPOSED METHODOLOGY]` | Optional ancillary amenity fee |
| `BAGG` | Extra Baggage Fee | **EXCLUDED** | `[PROPOSED METHODOLOGY]` | Excess check-in baggage charge (>15kg) |
| `MEAL` | In-flight Meal Fee | **EXCLUDED** | `[PROPOSED METHODOLOGY]` | Optional food/beverage purchase |
| `INS` | Travel Insurance | **EXCLUDED** | `[PROPOSED METHODOLOGY]` | Optional insurance product |
| `DISC` | Bank Card Discount | **EXCLUDED** | `[PROPOSED METHODOLOGY]` | Conditional promotion requiring specific card |

---

## 3. Mathematical Formula & Double-Counting Prevention

### 3.1 Mathematical Definition of `comparable_index_fare`

$$P_{comparable} = BF + UDF + ASF + GST + YQ$$

When explicit component breakdown is parsed:

$$P_{comparable} = P_{raw\_total} - CF - SEAT - BAGG - MEAL - INS + \operatorname{Abs}(DISC_{conditional})$$

### 3.2 Precedence Rules for Parsing

Target portals present fare data in two primary modes:

```
                          [ Raw Scraped Payload ]
                                     │
                 Is Explicit Fare Component Breakdown Present?
                                   ╱   ╲
                                  ╱     ╲
                                YES      NO
                                ╱         ╲
                               ▼           ▼
                   [ Apply Mode A ]     [ Apply Mode B ]
```

#### Mode A: Explicit Breakdown Mode (Preferred)
Used when the target DOM exposes `base_fare`, `taxes_and_fees`, and ancillary fees separately.
1.  Verify whether `raw_total_fare` equals $BF + \text{Taxes} + CF$.
2.  Subtract `convenience_fee` ($CF$), optional seat fee ($SEAT$), meal fee ($MEAL$), and insurance ($INS$).
3.  Set $P_{comparable} = BF + UDF + ASF + GST + YQ$.

#### Mode B: Displayed Total Only Mode (Fallback)
Used when OTAs display only a single combined total figure $P_{raw\_total}$ on search result summary pages.
1.  Assume $P_{raw\_total}$ includes mandatory taxes ($BF + UDF + ASF + GST + YQ$).
2.  If an OTA automatically appends a standard convenience fee (e.g. ₹350 per passenger) on the search result page, subtract the flat convenience fee:
    $$P_{comparable} = P_{raw\_total} - CF_{flat}$$
3.  Log `normalization_flag = TOTAL_ONLY_FALLBACK`.

---

## 4. Normalization Algorithm (Pseudocode)

```python
def normalize_airfare(raw_obs: RawObservation) -> NormalizedObservation:
    """
    Computes comparable_index_fare while preventing double-counting.
    """
    if raw_obs.has_explicit_breakdown:
        mandatory_taxes = raw_obs.udf + raw_obs.asf + raw_obs.gst + raw_obs.fuel_surcharge
        comparable_fare = raw_obs.base_fare + mandatory_taxes
    else:
        # Subtract known flat payment fee if present in displayed total
        flat_convenience_fee = raw_obs.source_metadata.default_convenience_fee or 0.0
        comparable_fare = raw_obs.raw_displayed_total - flat_convenience_fee
    
    # Enforce minimum economic threshold bound
    if comparable_fare < 500.0:
        raise InvalidFareException("Normalized fare below absolute domestic floor ₹500")

    return NormalizedObservation(
        comparable_index_fare=round(comparable_fare, 2),
        normalization_mode="EXPLICIT" if raw_obs.has_explicit_breakdown else "TOTAL_FALLBACK"
    )
```
