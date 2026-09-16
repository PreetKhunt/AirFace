# Airfare Data Model & Observation Schema

---

## 1. Executive Data Model Architecture

The airfare observation schema must capture granular ticket attributes required for statistical price normalization, deduplication, and lead-time tracking.

---

## 2. Airfare Observation Schema & Field Categorization

| Field Name | Data Type | Field Category | Description & Example | Rationale & CPI Purpose |
|---|---|---|---|---|
| `observation_id` | UUID | OFFICIALLY REQUIRED | Unique identifier for observation | Database keying & audit trail |
| `origin` | String (IATA) | OFFICIALLY REQUIRED | Departure airport code (`DEL`) | Stratum route isolation |
| `destination` | String (IATA) | OFFICIALLY REQUIRED | Arrival airport code (`BOM`) | Stratum route isolation |
| `airline_code` | String (IATA) | OFFICIALLY REQUIRED | 2-letter carrier code (`6E`, `AI`) | Carrier market share weighting |
| `travel_date` | Date (YYYY-MM-DD) | OFFICIALLY REQUIRED | Scheduled date of flight departure | Lead time calculation |
| `collection_timestamp`| DateTime (UTC) | OFFICIALLY REQUIRED | Exact timestamp of scraper execution | Real-time temporal index tracking |
| `booking_window_days` | Integer | OFFICIALLY REQUIRED | Advance booking horizon ($T+1 \dots T+45$) | Horizon-specific strata ($T+1, T+7, \dots$) |
| `total_fare` | Decimal(10,2) | OFFICIALLY REQUIRED | Final price in INR inclusive of mandatory fees | Core price relative metric ($p_{i,t}$) |
| `currency` | String (ISO) | OFFICIALLY REQUIRED | Currency code (`INR`) | Multi-market normalization |
| `flight_number` | String | RECOMMENDED | Carrier flight code (`6E-2131`) | Multi-source deduplication matching |
| `departure_time` | Time (HH:MM) | RECOMMENDED | Scheduled departure time (`08:00`) | Slot time stratification |
| `arrival_time` | Time (HH:MM) | RECOMMENDED | Scheduled arrival time (`10:15`) | Slot time stratification |
| `base_fare` | Decimal(10,2) | RECOMMENDED | Airline base fare component in INR | Base price breakdown analysis |
| `taxes_and_fees` | Decimal(10,2) | RECOMMENDED | Mandatory taxes (GST, Aviation Security Fee) | Price component analysis |
| `udf_fee` | Decimal(10,2) | RECOMMENDED | User Development Fee charged by airport | Origin airport tax isolation |
| `convenience_fee` | Decimal(10,2) | RECOMMENDED | OTA payment processing charge | Normalization adjustment (excluded) |
| `source_name` | String | RECOMMENDED | Platform scraped (`Indigo_Official`, `MakeMyTrip`) | Multi-channel source provenance |
| `source_type` | Enum | RECOMMENDED | `AIRLINE_DIRECT` or `OTA` | Channel markup analysis |
| `cabin_class` | Enum | RECOMMENDED | Default: `ECONOMY` | Constant quality enforcement |
| `fare_type` | Enum | RECOMMENDED | Default: `SAVER` / `STANDARD` | Non-flex vs Flexible fare filtering |
| `seat_availability` | Integer | OPTIONAL | Remaining seat count in fare bucket | Scarcity surge indicator |
| `baggage_allowance` | String | OPTIONAL | Included hand/check-in luggage (`15kg`) | Constant utility verification |
| `refundability` | Boolean | OPTIONAL | `True` if refundable, `False` if non-refundable | Constant utility verification |
| `collection_mode` | Enum | OPTIONAL | `LIVE`, `HISTORICAL`, `SYNTHETIC` | Strict synthetic isolation flag |
| `provenance_hash` | String (SHA256)| OPTIONAL | Hash of raw HTTP payload & DOM snippet | Forensic auditability for MoSPI |

---

## 3. JSON Schema Definition for Raw Airfare Observation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AirfareObservation",
  "type": "object",
  "required": [
    "observation_id",
    "origin",
    "destination",
    "airline_code",
    "travel_date",
    "collection_timestamp",
    "booking_window_days",
    "total_fare",
    "currency"
  ],
  "properties": {
    "observation_id": { "type": "string", "format": "uuid" },
    "origin": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "destination": { "type": "string", "pattern": "^[A-Z]{3}$" },
    "airline_code": { "type": "string", "pattern": "^[A-Z0-9]{2}$" },
    "travel_date": { "type": "string", "format": "date" },
    "collection_timestamp": { "type": "string", "format": "date-time" },
    "booking_window_days": { "type": "integer", "enum": [1, 7, 15, 30, 45] },
    "total_fare": { "type": "number", "minimum": 500.0 },
    "currency": { "type": "string", "default": "INR" },
    "flight_number": { "type": "string" },
    "base_fare": { "type": "number" },
    "taxes_and_fees": { "type": "number" },
    "source_name": { "type": "string" },
    "source_type": { "type": "string", "enum": ["AIRLINE_DIRECT", "OTA"] },
    "collection_mode": { "type": "string", "enum": ["LIVE", "HISTORICAL", "SYNTHETIC"] }
  }
}
```
