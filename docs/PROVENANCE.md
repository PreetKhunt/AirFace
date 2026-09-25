# AIRFACE (SIH26056) — Cryptographic Provenance Architecture

## 1. Lineage Architecture

Trust in statistical indices requires end-to-end verifiability. AIRFACE implements deterministic cryptographic provenance tracking:

```
[Raw Scraper Payload / HTML]
         │  SHA-256 Checksum computed upon ingestion
         ▼
[raw_airfare_observations] (raw_id, timestamp, source_url, collection_mode)
         │
         ▼
[parsed_airfare_observations] (observation_id, base_fare, udf, asf, gst, yq)
         │
         ▼
[provenance_audit_trail] (audit_id, observation_id, parser_version, payload_sha256_hash)
         │
         ▼
[normalized_index_observations] (index_obs_id, comparable_index_fare, dq_score, valid_for_index)
         │
         ▼
[elementary_route_indices] (elementary_id, route_id, booking_horizon, Jevons Index)
         │
         ▼
[national_aggregate_indices] (aggregate_id, DGCA-Weighted National Price Index)
```

---

## 2. Cryptographic Immutability

1. **Payload Fingerprinting:** Each raw observation record calculates a deterministic SHA-256 digest over normalized payload fields:
   $$\text{Hash} = \text{SHA256}(\text{source} \,\|\, \text{route} \,\|\, \text{flight} \,\|\, \text{date} \,\|\, \text{horizon} \,\|\, \text{fare})$$
2. **Audit Trail Persistence:** Stored in `provenance_audit_trail` table linked by foreign key to `parsed_airfare_observations`.
3. **Traceability API:** Endpoint `GET /api/v1/provenance/{observation_id}` returns the complete cryptographic certificate.
4. **Zero Hardcoded Hashes:** The UI displays actual database UUIDs and SHA-256 strings rather than static illustrative placeholders.
