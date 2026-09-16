# Data Observation Model Specification

---

## 1. Executive Data Architecture

This document specifies the exact schemas, data types, nullability constraints, and validation rules for airfare data observations throughout the processing pipeline.

---

## 2. Classification Schema Tags

To maintain strict scientific and regulatory discipline, every field and structural rule is tagged as follows:

*   **`[OFFICIAL REQUIREMENT]`**: Explicitly mandated by SIH26056 problem statement or MoSPI CPI guidelines.
*   **`[VERIFIED FACT]`**: Established empirical or legal fact.
*   **`[DERIVED ENGINEERING REQUIREMENT]`**: Technically necessary prerequisite to implement an official requirement.
*   **`[PROPOSED METHODOLOGY]`**: Recommended engineering design choice frozen for implementation.
*   **`[ASSUMPTION]`**: Documented working assumption.
*   **`[OPTIONAL INNOVATION]`**: Value-add feature not strictly required by SIH.
*   **`[UNRESOLVED]`**: Area requiring further empirical collection.

---

## 3. Observation Pipeline Stages

Data moves through three progressive observation states:

```
[ Raw Observation ] ──► [ Parsed Observation ] ──► [ Normalized Observation ]
 (Unstructured DOM)      (Structured Components)     (Comparable Index Fare)
```

---

## 4. Field Specification Tables

### 4.1 Stage 1: Raw Observation Schema (`raw_airfare_observation`)

| Field Name | Data Type | Nullable? | Status Tag | Description & Validation Constraint |
|---|---|---|---|---|
| `raw_id` | UUIDv4 | NO | `[DERIVED ENG REQ]` | Primary key generated at ingestion |
| `collection_timestamp` | DateTime (UTC) | NO | `[OFFICIAL REQUIREMENT]` | ISO 8601 timestamp (`2026-09-15T02:00:00Z`) |
| `source_name` | String(64) | NO | `[DERIVED ENG REQ]` | Target portal name (`MakeMyTrip`, `IndiGo_Direct`) |
| `source_url` | String(2048) | NO | `[PROPOSED METHODOLOGY]` | Target URL scraped |
| `raw_html_snippet` | Text | YES | `[PROPOSED METHODOLOGY]` | Extracted DOM HTML container for audit trail |
| `raw_displayed_price_text`| String(128) | NO | `[DERIVED ENG REQ]` | Unparsed price text (e.g. `"₹ 5,420 (incl. taxes)"`) |
| `collection_mode` | Enum | NO | `[PROPOSED METHODOLOGY]` | Values: `LIVE`, `HISTORICAL`, `SYNTHETIC` |

### 4.2 Stage 2: Parsed Observation Schema (`parsed_airfare_observation`)

| Field Name | Data Type | Nullable? | Status Tag | Description & Validation Constraint |
|---|---|---|---|---|
| `observation_id` | UUIDv4 | NO | `[DERIVED ENG REQ]` | Unique observation identifier |
| `raw_id` | UUIDv4 | NO | `[DERIVED ENG REQ]` | Foreign key to `raw_airfare_observation` |
| `origin` | String(3) | NO | `[OFFICIAL REQUIREMENT]` | Origin IATA airport code (`DEL`) |
| `destination` | String(3) | NO | `[OFFICIAL REQUIREMENT]` | Destination IATA airport code (`BOM`) |
| `airline_code` | String(2) | NO | `[OFFICIAL REQUIREMENT]` | 2-letter airline code (`6E`, `AI`, `QP`, `SG`) |
| `flight_number` | String(16) | NO | `[DERIVED ENG REQ]` | Carrier flight code (`6E-2131`) |
| `travel_date` | Date | NO | `[OFFICIAL REQUIREMENT]` | Scheduled flight date (`YYYY-MM-DD`) |
| `departure_time` | Time | YES | `[DERIVED ENG REQ]` | Scheduled departure time (`HH:MM`) |
| `arrival_time` | Time | YES | `[DERIVED ENG REQ]` | Scheduled arrival time (`HH:MM`) |
| `booking_window_days` | Integer | NO | `[OFFICIAL REQUIREMENT]` | Days to travel ($T+1, T+7, T+15, T+30, T+45$) |
| `raw_total_fare` | Decimal(10,2) | NO | `[OFFICIAL REQUIREMENT]` | Total displayed fare in INR |
| `base_fare` | Decimal(10,2) | YES | `[DERIVED ENG REQ]` | Airline base fare component in INR |
| `udf_fee` | Decimal(10,2) | YES | `[DERIVED ENG REQ]` | User Development Fee component |
| `asf_fee` | Decimal(10,2) | YES | `[DERIVED ENG REQ]` | Aviation Security Fee component |
| `gst_tax` | Decimal(10,2) | YES | `[DERIVED ENG REQ]` | Goods & Services Tax component |
| `convenience_fee` | Decimal(10,2) | YES | `[DERIVED ENG REQ]` | OTA payment gateway charge |
| `cabin_class` | Enum | NO | `[PROPOSED METHODOLOGY]` | Default: `ECONOMY` |
| `fare_family` | String(64) | YES | `[PROPOSED METHODOLOGY]` | Fare tier (`Saver`, `Flexi`, `SuperSaver`) |
| `included_baggage_kg` | Integer | NO | `[PROPOSED METHODOLOGY]` | Standard check-in baggage (`15`) |
| `is_refundable` | Boolean | NO | `[PROPOSED METHODOLOGY]` | Default: `false` |

### 4.3 Stage 3: Normalized Index Observation (`normalized_index_observation`)

| Field Name | Data Type | Nullable? | Status Tag | Description & Validation Constraint |
|---|---|---|---|---|
| `index_obs_id` | UUIDv4 | NO | `[DERIVED ENG REQ]` | Primary key for index calculation pipeline |
| `observation_id` | UUIDv4 | NO | `[DERIVED ENG REQ]` | Foreign key to `parsed_airfare_observation` |
| `route_id` | String(7) | NO | `[OFFICIAL REQUIREMENT]` | Directional route code (`DEL-BOM`) |
| `booking_horizon` | String(4) | NO | `[OFFICIAL REQUIREMENT]` | Horizon tag (`T+1`, `T+7`, `T+15`, `T+30`, `T+45`) |
| `comparable_index_fare`| Decimal(10,2) | NO | `[OFFICIAL REQUIREMENT]` | Cleaned, comparable fare in INR |
| `is_imputed` | Boolean | NO | `[PROPOSED METHODOLOGY]` | `true` if imputed for missing/sold-out slot |
| `imputation_method` | Enum | YES | `[PROPOSED METHODOLOGY]` | Values: `CELL_MEAN`, `CARRY_FORWARD`, `NONE` |
| `is_outlier` | Boolean | NO | `[PROPOSED METHODOLOGY]` | `true` if flagged as Tukey IQR outlier |
| `valid_for_index` | Boolean | NO | `[PROPOSED METHODOLOGY]` | `true` if used in core Jevons calculation |

---

## 5. Formal JSON Schema Definitions

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "NormalizedIndexObservation",
  "type": "object",
  "required": [
    "index_obs_id",
    "observation_id",
    "route_id",
    "booking_horizon",
    "comparable_index_fare",
    "is_imputed",
    "valid_for_index"
  ],
  "properties": {
    "index_obs_id": { "type": "string", "format": "uuid" },
    "observation_id": { "type": "string", "format": "uuid" },
    "route_id": { "type": "string", "pattern": "^[A-Z]{3}-[A-Z]{3}$" },
    "booking_horizon": { "type": "string", "enum": ["T+1", "T+7", "T+15", "T+30", "T+45"] },
    "comparable_index_fare": { "type": "number", "minimum": 500.0 },
    "is_imputed": { "type": "boolean" },
    "imputation_method": { "type": ["string", "null"], "enum": ["CELL_MEAN", "CARRY_FORWARD", "NONE", null] },
    "is_outlier": { "type": "boolean" },
    "valid_for_index": { "type": "boolean" }
  }
}
```
