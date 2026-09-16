"""
Ingestion Service -- SIH26056 Phase B

Orchestrates the full ingestion pipeline:
    Adapter.collect()
        -> idempotency check (channel & source-separated duplicate detection)
        -> Parser.parse_record() with nested transaction savepoints
        -> DB commit
        -> SourceHealth update

Key rules:
- Ingestion-level duplicate detection preserves source/channel separation:
    Distinguishes source_name, origin, destination, airline_code, flight_number,
    travel_date, departure_time, booking_window_days, collection_mode,
    fare_family, cabin_class.
- Transaction hardening: uses savepoints (db.begin_nested()) per record so that
  an invalid record C does not erase preceding valid records (A, B) or subsequent ones (D).
- Invalid records are REJECTED with structured errors, not silently repaired.
- DataMode is NEVER silently converted.
- SourceHealth is updated with HEALTHY / DEGRADED / UNAVAILABLE.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.enums import DataMode, SourceHealthStatus
from app.models.source_health import SourceHealth
from app.models.observation import RawAirfareObservation, ParsedAirfareObservation
from app.scrapers.base import BaseScraperAdapter, RawObservationRecord
from app.services.parser import parse_record, ParseError
from app.schemas.observation import IngestionResult

logger = logging.getLogger(__name__)


def _get_or_create_source_health(db: Session, source_name: str, adapter_type: str) -> SourceHealth:
    """Get existing SourceHealth row or create a new one."""
    sh = db.get(SourceHealth, source_name)
    if sh is None:
        sh = SourceHealth(
            source_name=source_name,
            status=SourceHealthStatus.HEALTHY.value,
            adapter_type=adapter_type,
            total_attempts=0,
            total_successes=0,
            consecutive_failures=0,
        )
        db.add(sh)
        db.flush()
    return sh


def _record_exists(db: Session, record: RawObservationRecord) -> bool:
    """
    Check if an identical observation already exists in DB for this source and channel.
    Distinguishes:
        - source_name
        - origin
        - destination
        - airline_code
        - flight_number
        - travel_date
        - departure_time
        - booking_window_days
        - collection_mode
        - fare_family
        - cabin_class
    """
    query = (
        db.query(ParsedAirfareObservation.observation_id)
        .join(RawAirfareObservation, ParsedAirfareObservation.raw_id == RawAirfareObservation.raw_id)
        .filter(
            RawAirfareObservation.source_name == record.source_name,
            RawAirfareObservation.collection_mode == record.collection_mode,
            ParsedAirfareObservation.origin == record.origin.upper(),
            ParsedAirfareObservation.destination == record.destination.upper(),
            ParsedAirfareObservation.airline_code == record.airline_code.upper(),
            ParsedAirfareObservation.flight_number == record.flight_number.upper(),
            ParsedAirfareObservation.travel_date == record.travel_date,
            ParsedAirfareObservation.booking_window_days == record.booking_window_days,
            ParsedAirfareObservation.fare_family == record.fare_family,
            ParsedAirfareObservation.cabin_class == record.cabin_class,
        )
    )
    if record.departure_time is not None:
        query = query.filter(ParsedAirfareObservation.departure_time == record.departure_time)
    else:
        query = query.filter(ParsedAirfareObservation.departure_time.is_(None))

    return query.first() is not None


def run_ingestion(
    adapter: BaseScraperAdapter,
    db: Session,
) -> IngestionResult:
    """
    Run the full ingestion pipeline for a given adapter.

    Uses nested transaction savepoints per record so that partial errors
    do not roll back valid observations in the same batch.
    """
    start_ts = datetime.now(timezone.utc)
    adapter_type = "LIVE" if adapter.mode == DataMode.LIVE else "FIXTURE"
    sh = _get_or_create_source_health(db, adapter.name, adapter_type)
    sh.last_checked_at = start_ts
    sh.total_attempts += 1

    raw_ingested = 0
    parsed_ingested = 0
    duplicates_skipped = 0
    invalid_rejected = 0
    errors: list[str] = []

    try:
        records: list[RawObservationRecord] = adapter.collect()
    except Exception as exc:
        logger.error("adapter.collect() raised: %s", exc, exc_info=True)
        sh.status = SourceHealthStatus.UNAVAILABLE.value
        sh.consecutive_failures += 1
        sh.status_detail = f"Collection failed: {exc}"
        db.commit()
        return IngestionResult(
            source_name=adapter.name,
            collection_mode=adapter.mode,
            raw_ingested=0,
            parsed_ingested=0,
            duplicates_skipped=0,
            invalid_rejected=1,
            errors=[str(exc)],
        )

    logger.info(
        "Ingestion[%s] collected %d records from adapter",
        adapter.name, len(records)
    )

    for record in records:
        # --- Channel & source-separated duplicate check ---
        if _record_exists(db, record):
            logger.debug("Duplicate skipped: %s", record.idempotency_key())
            duplicates_skipped += 1
            continue

        # --- Parse and persist with nested transaction savepoint ---
        try:
            with db.begin_nested():
                raw_obs, parsed_obs = parse_record(record, db)
            raw_ingested += 1
            parsed_ingested += 1
        except ParseError as pe:
            logger.warning("Record rejected (ParseError): %s", pe)
            invalid_rejected += 1
            errors.append(str(pe))
        except Exception as exc:
            logger.error("Unexpected parse error: %s", exc, exc_info=True)
            invalid_rejected += 1
            errors.append(str(exc))

    # Commit all successfully parsed records in the batch
    try:
        db.commit()
    except Exception as exc:
        logger.error("Batch DB commit failed: %s", exc, exc_info=True)
        db.rollback()
        errors.append(f"DB commit failed: {exc}")

    # --- Update SourceHealth status ---
    sh = _get_or_create_source_health(db, adapter.name, adapter_type)
    elapsed_ms = (datetime.now(timezone.utc) - start_ts).total_seconds() * 1000

    if invalid_rejected == 0 and len(errors) == 0:
        sh.status = SourceHealthStatus.HEALTHY.value
        sh.consecutive_failures = 0
        sh.last_success_at = datetime.now(timezone.utc)
        sh.total_successes += 1
        sh.status_detail = f"OK: {parsed_ingested} ingested, {duplicates_skipped} dupes"
    elif parsed_ingested > 0:
        sh.status = SourceHealthStatus.DEGRADED.value
        sh.status_detail = f"{invalid_rejected} rejected, {parsed_ingested} ingested, {duplicates_skipped} dupes"
    else:
        sh.status = SourceHealthStatus.UNAVAILABLE.value
        sh.consecutive_failures += 1
        sh.status_detail = f"All {invalid_rejected} records failed: {'; '.join(errors[:3])}"

    sh.avg_latency_ms = elapsed_ms
    if sh.total_attempts > 0:
        sh.success_rate_pct = (sh.total_successes / sh.total_attempts) * 100.0

    try:
        db.commit()
    except Exception as exc:
        logger.error("SourceHealth commit failed: %s", exc)
        db.rollback()

    logger.info(
        "Ingestion[%s] complete: raw=%d parsed=%d dupes=%d invalid=%d errors=%d",
        adapter.name, raw_ingested, parsed_ingested,
        duplicates_skipped, invalid_rejected, len(errors)
    )

    return IngestionResult(
        source_name=adapter.name,
        collection_mode=adapter.mode,
        raw_ingested=raw_ingested,
        parsed_ingested=parsed_ingested,
        duplicates_skipped=duplicates_skipped,
        invalid_rejected=invalid_rejected,
        errors=errors,
    )
