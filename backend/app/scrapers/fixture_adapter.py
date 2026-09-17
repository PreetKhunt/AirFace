"""
FixtureAdapter -- SIH26056 Phase B

Reads fixture CSV files (historical or synthetic) and returns RawObservationRecord list.
This adapter is the primary path for Phase B verification (no external website needed).

Data mode must match the CSV collection_mode column exactly -- never converted silently.
"""
from __future__ import annotations

import csv
import logging
from datetime import date, time, datetime, timezone, timedelta
from typing import Optional
from pathlib import Path

from app.core.enums import DataMode
from app.scrapers.base import BaseScraperAdapter, RawObservationRecord
from app.core.index_config import VALID_ROUTES, VALID_BOOKING_WINDOW_DAYS

logger = logging.getLogger(__name__)

# Resolve project root dynamically so this works whether CWD is repo root or backend/
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent

# Canonical fixture paths relative to project root
FIXTURE_PATHS = {
    DataMode.HISTORICAL: PROJECT_ROOT / "data" / "fixtures" / "historical" / "airfare_historical.csv",
    DataMode.SYNTHETIC:  PROJECT_ROOT / "data" / "fixtures" / "synthetic" / "airfare_synthetic.csv",
}


def _parse_time(val: str) -> Optional[time]:
    """Parse HH:MM:SS or HH:MM string to time object. Returns None on failure."""
    if not val:
        return None
    try:
        parts = val.strip().split(":")
        h, m = int(parts[0]), int(parts[1])
        s = int(parts[2]) if len(parts) > 2 else 0
        return time(h, m, s)
    except Exception:
        return None


def _parse_float(val: str) -> Optional[float]:
    """Parse a string to float, return None on failure."""
    try:
        return float(val.replace(",", "").strip())
    except Exception:
        return None


class FixtureAdapter(BaseScraperAdapter):
    """
    CSV Fixture Adapter.

    Reads data/fixtures/{historical|synthetic}/airfare_*.csv and returns
    one RawObservationRecord per valid CSV row.

    Validation (no silent repair -- invalid rows are logged and skipped):
    - origin and destination must be known IATA codes
    - booking_window_days must be in {1, 7, 15, 30, 45}
    - booking_window_days must equal (travel_date - collection_date).days
    - raw_total_fare must be > 0
    - route_id (origin-destination) must be in VALID_ROUTES
    - collection_mode in CSV must match the adapter's declared mode
    """

    def __init__(self, data_mode: DataMode, fixture_path: Optional[Path] = None):
        if data_mode == DataMode.LIVE:
            raise ValueError(
                "FixtureAdapter cannot operate in LIVE mode. "
                "Use HISTORICAL or SYNTHETIC."
            )
        self._mode = data_mode
        self._path = fixture_path or FIXTURE_PATHS[data_mode]

    @property
    def name(self) -> str:
        return f"fixture_{self._mode.value.lower()}"

    @property
    def mode(self) -> DataMode:
        return self._mode

    def collect(self) -> list[RawObservationRecord]:
        """
        Load and validate CSV fixture rows.
        Returns list of RawObservationRecord; invalid rows are skipped with a log.
        Never raises unhandled exceptions.
        """
        records: list[RawObservationRecord] = []
        invalid_count = 0

        if not self._path.exists():
            logger.error(
                "Fixture file not found: %s. "
                "Run data/fixtures/generate_fixtures.py first.", self._path
            )
            return records

        try:
            with open(self._path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row_num, row in enumerate(reader, start=2):  # row 1 = header
                    record, error = self._parse_row(row, row_num)
                    if error:
                        logger.warning("Row %d rejected: %s", row_num, error)
                        invalid_count += 1
                        continue
                    records.append(record)

        except Exception as exc:
            logger.error("FixtureAdapter.collect() failed: %s", exc, exc_info=True)
            return []

        logger.info(
            "FixtureAdapter[%s] loaded %d records, %d invalid/skipped from %s",
            self._mode.value, len(records), invalid_count, self._path,
        )
        return records

    def _parse_row(self, row: dict, row_num: int):
        """
        Parse and validate a single CSV row.
        Returns (RawObservationRecord, None) on success, (None, error_str) on failure.
        No silent repair -- any validation failure is returned as an error.
        """
        origin = row.get("origin", "").strip().upper()
        destination = row.get("destination", "").strip().upper()
        airline_code = row.get("airline_code", "").strip().upper()
        flight_number = row.get("flight_number", "").strip().upper()

        # Validate route
        route_key = f"{origin}-{destination}"
        if route_key not in VALID_ROUTES:
            return None, f"Invalid route '{route_key}'"

        # Validate booking window
        try:
            bw = int(row.get("booking_window_days", ""))
        except (ValueError, TypeError):
            return None, "booking_window_days not parseable as int"
        if bw not in VALID_BOOKING_WINDOW_DAYS:
            return None, f"booking_window_days={bw} not in {VALID_BOOKING_WINDOW_DAYS}"

        # Parse and validate travel_date
        travel_date_str = row.get("travel_date", "").strip()
        try:
            travel_date = date.fromisoformat(travel_date_str)
        except ValueError:
            return None, f"travel_date invalid: '{travel_date_str}'"

        # Parse and validate collection_date
        collection_date_str = row.get("collection_date", "").strip()
        if collection_date_str:
            try:
                collection_date = date.fromisoformat(collection_date_str)
            except ValueError:
                return None, f"collection_date invalid: '{collection_date_str}'"
            # Verify booking_window_days = travel_date - collection_date
            calculated_bw = (travel_date - collection_date).days
            if calculated_bw != bw:
                return None, f"booking_window_days mismatch: travel_date ({travel_date}) - collection_date ({collection_date}) = {calculated_bw} days, but expected {bw}"
        else:
            collection_date = travel_date - timedelta(days=bw)

        # Validate fare
        raw_total = _parse_float(row.get("raw_total_fare", ""))
        if raw_total is None or raw_total <= 0:
            return None, f"raw_total_fare invalid: '{row.get('raw_total_fare')}'"

        # Validate collection_mode matches declared mode (no silent conversion)
        csv_mode_str = row.get("collection_mode", "").strip().upper()
        try:
            csv_mode = DataMode(csv_mode_str)
        except ValueError:
            return None, f"Unknown collection_mode '{csv_mode_str}'"
        if csv_mode != self._mode:
            return None, (
                f"collection_mode mismatch: CSV has '{csv_mode_str}' "
                f"but adapter is '{self._mode.value}'"
            )

        departure_time = _parse_time(row.get("departure_time", ""))
        arrival_time = _parse_time(row.get("arrival_time", ""))

        base_fare = _parse_float(row.get("base_fare", ""))
        udf_fee = _parse_float(row.get("udf_fee", ""))
        asf_fee = _parse_float(row.get("asf_fee", ""))
        gst_tax = _parse_float(row.get("gst_tax", ""))
        yq = _parse_float(row.get("yq_surcharge", ""))
        comp = _parse_float(row.get("comparable_fare", ""))
        conv = _parse_float(row.get("convenience_fee", "0")) or 0.0

        collection_ts = datetime(
            collection_date.year, collection_date.month, collection_date.day,
            tzinfo=timezone.utc
        )

        record = RawObservationRecord(
            source_name=self.name,
            source_url=row.get("source_url", f"fixture://{route_key}/{airline_code}"),
            collection_timestamp=collection_ts,
            collection_mode=self._mode,
            origin=origin,
            destination=destination,
            airline_code=airline_code,
            airline_name=row.get("airline_name", "").strip(),
            flight_number=flight_number,
            travel_date=travel_date,
            departure_time=departure_time,
            arrival_time=arrival_time,
            booking_window_days=bw,
            raw_total_fare=raw_total,
            raw_displayed_price_text=row.get("raw_displayed_price_text", f"INR {raw_total}"),
            base_fare=base_fare,
            udf_fee=udf_fee,
            asf_fee=asf_fee,
            gst_tax=gst_tax,
            yq_surcharge=yq,
            convenience_fee=conv,
            comparable_fare=comp,
            cabin_class=row.get("cabin_class", "ECONOMY").strip(),
            fare_family=row.get("fare_family", "Saver").strip(),
        )
        # Set provenance hash
        record.payload_sha256 = record.compute_sha256()
        return record, None
