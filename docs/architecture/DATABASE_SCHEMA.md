# Database Schema Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Entity Relationship Overview

```
 ┌───────────────┐        ┌─────────────────────────────┐        ┌─────────────────────────────┐
 │    routes     │        │  raw_airfare_observations   │        │ parsed_airfare_observations │
 ├───────────────┤        ├─────────────────────────────┤        ├─────────────────────────────┤
 │ PK route_id   │◄───────┤ PK raw_id                   │◄───────┤ PK observation_id           │
 │ origin        │        │ collection_timestamp        │        │ FK raw_id                   │
 │ destination   │        │ source_name                 │        │ flight_number               │
 │ dgca_weight   │        │ collection_mode             │        │ raw_total_fare              │
 └───────────────┘        └─────────────────────────────┘        │ base_fare, taxes            │
                                                                 └──────────────┬──────────────┘
                                                                                │
 ┌─────────────────────────────┐        ┌─────────────────────────────┐         │
 │  elementary_route_indices   │        │normalized_index_observations│◄────────┘
 ├─────────────────────────────┤        ├─────────────────────────────┤
 │ PK elementary_id            │◄───────┤ PK index_obs_id             │
 │ FK route_id                 │        │ FK observation_id           │
 │ booking_horizon             │        │ comparable_index_fare       │
 │ jevons_index_value          │        │ valid_for_index             │
 └──────────────┬──────────────┘        └─────────────────────────────┘
                │
                ▼
 ┌─────────────────────────────┐        ┌─────────────────────────────┐
 │ national_aggregate_indices  │        │     data_quality_logs       │
 ├─────────────────────────────┤        ├─────────────────────────────┤
 │ PK aggregate_id             │        │ PK log_id                   │
 │ calculation_date            │        │ calculation_date            │
 │ national_index_value        │        │ dq_score                    │
 │ dq_score                    │        │ completeness_pct, etc.      │
 └─────────────────────────────┘        └─────────────────────────────┘
```

---

## 2. PostgreSQL DDL SQL Specifications

```sql
-- Extension for UUID generation and TimescaleDB
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Route Basket Registry
CREATE TABLE routes (
    route_id VARCHAR(7) PRIMARY KEY, -- e.g. 'DEL-BOM'
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    corridor_region VARCHAR(32) NOT NULL,
    dgca_passenger_volume INT DEFAULT 0,
    dgca_volume_weight DECIMAL(8, 6) NOT NULL DEFAULT 0.0, -- w_r
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Raw Scraped Observations
CREATE TABLE raw_airfare_observations (
    raw_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source_name VARCHAR(64) NOT NULL, -- e.g. 'MakeMyTrip', 'IndiGo_Direct'
    source_url VARCHAR(2048) NOT NULL,
    raw_html_snippet TEXT,
    raw_displayed_price_text VARCHAR(128) NOT NULL,
    collection_mode VARCHAR(16) NOT NULL CHECK (collection_mode IN ('LIVE', 'HISTORICAL', 'SYNTHETIC')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Parsed & Structured Airfare Observations
CREATE TABLE parsed_airfare_observations (
    observation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_id UUID NOT NULL REFERENCES raw_airfare_observations(raw_id) ON DELETE CASCADE,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    airline_code VARCHAR(2) NOT NULL,
    flight_number VARCHAR(16) NOT NULL,
    travel_date DATE NOT NULL,
    departure_time TIME,
    arrival_time TIME,
    booking_window_days INT NOT NULL CHECK (booking_window_days IN (1, 7, 15, 30, 45)),
    raw_total_fare DECIMAL(10, 2) NOT NULL,
    base_fare DECIMAL(10, 2),
    udf_fee DECIMAL(10, 2),
    asf_fee DECIMAL(10, 2),
    gst_tax DECIMAL(10, 2),
    convenience_fee DECIMAL(10, 2) DEFAULT 0.0,
    cabin_class VARCHAR(16) DEFAULT 'ECONOMY',
    fare_family VARCHAR(64) DEFAULT 'Saver',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Normalized Index Observations
CREATE TABLE normalized_index_observations (
    index_obs_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    observation_id UUID NOT NULL REFERENCES parsed_airfare_observations(observation_id) ON DELETE CASCADE,
    route_id VARCHAR(7) NOT NULL REFERENCES routes(route_id),
    booking_horizon VARCHAR(4) NOT NULL CHECK (booking_horizon IN ('T+1', 'T+7', 'T+15', 'T+30', 'T+45')),
    comparable_index_fare DECIMAL(10, 2) NOT NULL,
    is_imputed BOOLEAN DEFAULT FALSE,
    imputation_method VARCHAR(32),
    is_outlier BOOLEAN DEFAULT FALSE,
    valid_for_index BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: Tier 1 Elementary Route Indices (Jevons Formula)
CREATE TABLE elementary_route_indices (
    elementary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_date DATE NOT NULL,
    route_id VARCHAR(7) NOT NULL REFERENCES routes(route_id),
    booking_horizon VARCHAR(4) NOT NULL,
    jevons_index_value DECIMAL(10, 4) NOT NULL, -- I_{r,h}
    observation_count INT NOT NULL,
    base_date DATE NOT NULL DEFAULT '2026-01-01',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UNIQUE_route_horizon_date UNIQUE (calculation_date, route_id, booking_horizon)
);

-- Table 6: Tier 2 National Aggregate Indices (Young Formula)
CREATE TABLE national_aggregate_indices (
    aggregate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_date DATE NOT NULL,
    booking_horizon VARCHAR(4) NOT NULL,
    national_index_value DECIMAL(10, 4) NOT NULL, -- I_{National}
    daily_change_pct DECIMAL(6, 4),
    monthly_change_pct DECIMAL(6, 4),
    dq_score DECIMAL(5, 2) NOT NULL, -- DQ [0-100]
    base_date DATE NOT NULL DEFAULT '2026-01-01',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UNIQUE_national_horizon_date UNIQUE (calculation_date, booking_horizon)
);

-- Table 7: Data Quality Score Logs
CREATE TABLE data_quality_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_date DATE NOT NULL,
    dq_score DECIMAL(5, 2) NOT NULL,
    completeness_pct DECIMAL(5, 2) NOT NULL,
    freshness_score DECIMAL(5, 2) NOT NULL,
    reliability_pct DECIMAL(5, 2) NOT NULL,
    dedup_pct DECIMAL(5, 2) NOT NULL,
    anomaly_rate DECIMAL(5, 4) NOT NULL,
    imputation_rate DECIMAL(5, 4) NOT NULL,
    provenance_pct DECIMAL(5, 2) NOT NULL,
    synthetic_share DECIMAL(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: Cryptographic Provenance Audit Trail
CREATE TABLE provenance_audit_trail (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    observation_id UUID NOT NULL REFERENCES parsed_airfare_observations(observation_id) ON DELETE CASCADE,
    source_portal VARCHAR(64) NOT NULL,
    source_url VARCHAR(2048) NOT NULL,
    collection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    parser_version VARCHAR(16) NOT NULL DEFAULT 'v1.0.0',
    normalization_version VARCHAR(16) NOT NULL DEFAULT 'v1.0.0',
    payload_sha256_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Database Performance Indexes
CREATE INDEX idx_parsed_route_date ON parsed_airfare_observations(origin, destination, travel_date);
CREATE INDEX idx_normalized_route_horizon ON normalized_index_observations(route_id, booking_horizon, valid_for_index);
CREATE INDEX idx_elementary_date ON elementary_route_indices(calculation_date, route_id);
CREATE INDEX idx_national_date ON national_aggregate_indices(calculation_date);
CREATE INDEX idx_provenance_obs ON provenance_audit_trail(observation_id);
```
