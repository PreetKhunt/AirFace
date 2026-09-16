"""
Commercial-Equivalence Deduplication Engine -- SIH26056 Phase C

Resolves multiple observations representing the same underlying commercial ticket across
different sources (e.g. direct airline vs OTA portal) and across execution batches:
    (origin, destination, airline_code, flight_number, travel_date,
     departure_time, booking_window_days, cabin_class, fare_family)

Canonical Selection Policy (documented, configurable):
    Tier 1: Direct airline source (source_name contains 'direct')
    Tier 2: Verified OTA source (source_name contains 'ota')
    Fallback (within same tier): Lowest comparable_index_fare (price transparency)
    Disqualification: Records with valid_for_index=False are never selected as primary.

Rules:
- Database-aware: compares new observations against existing persisted records in DB.
- Does NOT delete or overwrite original parsed records (preserves full provenance).
- Designates one PRIMARY_CANONICAL observation for index eligibility.
- Marks duplicate observations as COMMERCIAL_DUPLICATE with valid_for_index=False.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.enums import CommercialDedupStatus
from app.models.observation import (
    ParsedAirfareObservation,
    NormalizedIndexObservation,
)
from app.services.normalization import NormalizedRecord


# ---------------------------------------------------------------------------
# Canonical Selection Policy Configuration
# ---------------------------------------------------------------------------
# Source-type priority: lower integer = higher priority.
# 'direct' = airline own website; 'ota' = online travel aggregator portal.
# Any source not listed here defaults to priority 99.
SOURCE_PRIORITY: Dict[str, int] = {
    "direct": 0,   # Airline direct portal -- highest trust, primary source
    "ota": 1,      # Verified OTA (MakeMyTrip, EaseMyTrip, etc.) -- secondary
}


def _source_priority_key(source_name: Optional[str]) -> int:
    """Return numeric priority for a source name string.

    Checks whether the source_name contains a tier keyword.
    E.g. 'direct_indigo' -> 'direct' (tier 0), 'makemytrip_ota' -> 'ota' (tier 1).
    Unknown -> 99.
    """
    if not source_name:
        return 99
    lower = source_name.lower()
    for keyword, priority in SOURCE_PRIORITY.items():
        if keyword in lower:
            return priority
    return 99


def _build_commercial_key(parsed: ParsedAirfareObservation) -> tuple:
    """Extract deterministic commercial identity tuple from a ParsedAirfareObservation."""
    dep_str = parsed.departure_time.isoformat() if parsed.departure_time else "NONE"
    return (
        parsed.origin.upper(),
        parsed.destination.upper(),
        parsed.airline_code.upper(),
        parsed.flight_number.upper(),
        str(parsed.travel_date),
        dep_str,
        parsed.booking_window_days,
        parsed.cabin_class.upper(),
        parsed.fare_family.upper(),
    )


def deduplicate_commercial_records(
    parsed_records: List[ParsedAirfareObservation],
    normalized_records: List[NormalizedRecord],
    db: Optional[Session] = None,
) -> List[Tuple[NormalizedRecord, CommercialDedupStatus, str]]:
    """
    Groups observations by commercial flight identity and resolves duplicates,
    both within the current batch and against previously persisted records in the database.

    Canonical selection uses the configurable SOURCE_PRIORITY policy:
      1. Records with valid_for_index=False are never selected as primary.
      2. Among valid records, direct airline sources are preferred over OTA.
      3. Within the same source tier, the lowest comparable_index_fare is selected
         (deterministic tiebreaker for index transparency).
    """
    parsed_map = {str(p.observation_id): p for p in parsed_records}

    # Build source_name lookup keyed by observation_id (from raw_id context if available)
    source_name_map: Dict[str, str] = {
        str(p.observation_id): getattr(p, "source_name", None) or ""
        for p in parsed_records
    }

    # 1. Fetch existing commercial keys from DB if session provided
    existing_comm_map: Dict[tuple, str] = {}
    if db:
        existing_rows = (
            db.query(
                NormalizedIndexObservation.observation_id,
                NormalizedIndexObservation.valid_for_index,
                ParsedAirfareObservation,
            )
            .join(
                ParsedAirfareObservation,
                NormalizedIndexObservation.observation_id == ParsedAirfareObservation.observation_id
            )
            .filter(NormalizedIndexObservation.valid_for_index == True)
            .all()
        )
        for obs_id, is_valid, parsed_obj in existing_rows:
            key = _build_commercial_key(parsed_obj)
            existing_comm_map[key] = str(obs_id)

    # 2. Group current batch by commercial identity
    clusters = defaultdict(list)
    for norm in normalized_records:
        parsed = parsed_map.get(str(norm.observation_id))
        if not parsed:
            continue
        comm_key = _build_commercial_key(parsed)
        clusters[comm_key].append(norm)

    results: List[Tuple[NormalizedRecord, CommercialDedupStatus, str]] = []

    for comm_key, group in clusters.items():
        # Check if an existing primary canonical record already exists in the DB
        if comm_key in existing_comm_map:
            existing_primary_id = existing_comm_map[comm_key]
            # All new records in this cluster are duplicates of the existing primary
            for duplicate in group:
                duplicate.valid_for_index = False
                results.append((
                    duplicate,
                    CommercialDedupStatus.COMMERCIAL_DUPLICATE,
                    f"COMMERCIAL_DUPLICATE_OF_EXISTING_{existing_primary_id}"
                ))
            continue

        # If no existing record in DB, resolve within the current batch
        if len(group) == 1:
            norm = group[0]
            results.append((norm, CommercialDedupStatus.UNIQUE, norm.normalization_reason))
        else:
            # Canonical selection policy:
            #   (a) Disqualified records (valid_for_index=False) never become primary.
            #   (b) Among index-eligible records, select by source priority tier first.
            #   (c) Within the same tier, select lowest comparable_index_fare (deterministic).
            sorted_group = sorted(
                group,
                key=lambda x: (
                    not x.valid_for_index,                               # Disqualified last
                    _source_priority_key(source_name_map.get(str(x.observation_id))),  # Source tier
                    x.comparable_index_fare,                             # Lowest fare tiebreaker
                )
            )
            primary = sorted_group[0]
            src_name = source_name_map.get(str(primary.observation_id), "unknown")
            results.append((
                primary,
                CommercialDedupStatus.PRIMARY_CANONICAL,
                (
                    f"{primary.normalization_reason}; "
                    f"PRIMARY_CANONICAL (cluster_size={len(group)}, "
                    f"selected_source={src_name}, "
                    f"policy=DIRECT_PREFERRED_THEN_LOWEST_FARE)"
                )
            ))

            for duplicate in sorted_group[1:]:
                duplicate.valid_for_index = False
                results.append((
                    duplicate,
                    CommercialDedupStatus.COMMERCIAL_DUPLICATE,
                    f"COMMERCIAL_DUPLICATE_OF_{primary.observation_id}"
                ))

    return results