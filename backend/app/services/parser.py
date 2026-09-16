"""
Parser Service -- SIH26056 Phase B

Converts RawObservationRecord -> (RawAirfareObservation, ParsedAirfareObservation)
database records.

Phase B Boundary:
- Phase B parses and preserves source fare components (base_fare, udf_fee, asf_fee, gst_tax, yq_surcharge, convenience_fee).
- Phase C performs comparable/index fare normalization and data quality scoring.

Rules:
- No silent repair: any field that fails validation raises ParseError.
- booking_window_days MUST be in {1, 7, 15, 30, 45} (hard check).
- raw_total_fare MUST be > 0.
- SHA-256 payload hash is stamped on ProvenanceAuditTrail row to trace record integrity.
- DataMode is preserved as-is from the source adapter (never converted).
"""
from __future__ import annotations

import uuid
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.core.enums import VALID_BOOKING_WINDOW_DAYS
from app.models.observation import RawAirfareObservation, ParsedAirfareObservation
from app.models.log import ProvenanceAuditTrail
from app.scrapers.base import RawObservationRecord

logger = logging.getLogger(__name__)

PARSER_VERSION = "v1.0.0"
NORMALIZATION_VERSION = "pending_phase_c"


class ParseError(Exception):
    """Raised when a record fails validation during parsing. No silent repair."""
    pass


def parse_record(
    record: RawObservationRecord,
    db: Session,
) -> Tuple[RawAirfareObservation, ParsedAirfareObservation]:
    """
    Parse a RawObservationRecord and persist both raw and parsed rows into DB.

    Phase B parses and preserves source fare components:
        base_fare, udf_fee, asf_fee, gst_tax, yq_surcharge, convenience_fee

    Phase C will perform index fare normalization.
    """
    # --- Validate booking window ---
    if record.booking_window_days not in VALID_BOOKING_WINDOW_DAYS:
        raise ParseError(
            f"booking_window_days={record.booking_window_days} "
            f"not in {VALID_BOOKING_WINDOW_DAYS}"
        )

    # --- Validate fare positivity ---
    if record.raw_total_fare <= 0:
        raise ParseError(
            f"raw_total_fare={record.raw_total_fare} must be > 0"
        )

    # --- Ensure provenance hash ---
    sha256 = record.payload_sha256 or record.compute_sha256()

    # --- Build Raw row ---
    raw_id = uuid.uuid4()
    raw_obs = RawAirfareObservation(
        raw_id=raw_id,
        collection_timestamp=record.collection_timestamp,
        source_name=record.source_name,
        source_url=record.source_url,
        raw_html_snippet=record.raw_html_snippet,
        raw_displayed_price_text=record.raw_displayed_price_text,
        collection_mode=record.collection_mode,
    )
    db.add(raw_obs)

    # --- Build Parsed row ---
    observation_id = uuid.uuid4()
    parsed_obs = ParsedAirfareObservation(
        observation_id=observation_id,
        raw_id=raw_id,
        origin=record.origin.upper(),
        destination=record.destination.upper(),
        airline_code=record.airline_code.upper(),
        flight_number=record.flight_number.upper(),
        travel_date=record.travel_date,
        departure_time=record.departure_time,
        arrival_time=record.arrival_time,
        booking_window_days=record.booking_window_days,
        raw_total_fare=Decimal(str(record.raw_total_fare)),
        base_fare=Decimal(str(record.base_fare)) if record.base_fare is not None else None,
        udf_fee=Decimal(str(record.udf_fee)) if record.udf_fee is not None else None,
        asf_fee=Decimal(str(record.asf_fee)) if record.asf_fee is not None else None,
        gst_tax=Decimal(str(record.gst_tax)) if record.gst_tax is not None else None,
        yq_surcharge=Decimal(str(record.yq_surcharge)) if record.yq_surcharge is not None else None,
        convenience_fee=Decimal(str(record.convenience_fee)) if record.convenience_fee is not None else Decimal("0.00"),
        cabin_class=record.cabin_class,
        fare_family=record.fare_family,
    )
    db.add(parsed_obs)

    # --- Provenance Audit Trail ---
    audit = ProvenanceAuditTrail(
        audit_id=uuid.uuid4(),
        observation_id=observation_id,
        source_portal=record.source_name,
        source_url=record.source_url,
        collection_timestamp=record.collection_timestamp,
        parser_version=PARSER_VERSION,
        normalization_version=NORMALIZATION_VERSION,
        payload_sha256_hash=sha256,
    )
    db.add(audit)

    return raw_obs, parsed_obs
