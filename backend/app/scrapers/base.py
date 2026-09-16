"""
BaseScraperAdapter -- SIH26056 Phase B

Abstract interface that every source adapter (fixture, airline, OTA) must implement.
The pipeline contract is:
    collect() -> list[RawObservationRecord]
    name       -> str  (unique source identifier)
    mode       -> DataMode

Conformance rules:
- collect() MUST return a list (empty on failure, never raise unhandled).
- MUST NOT silently convert DataMode (e.g. SYNTHETIC -> LIVE).
- MUST record a provenance hash for each record.
- Rate-limit enforcement is the adapter's responsibility (min 2 s between requests).
- CAPTCHA bypass, credential theft, deceptive identity rotation are PROHIBITED.
"""
from __future__ import annotations

import hashlib
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, time, datetime
from typing import Optional

from app.core.enums import DataMode


@dataclass
class RawObservationRecord:
    """
    Intermediate data record produced by a source adapter before DB insertion.
    All fields map 1-to-1 to raw_airfare_observations + parsed_airfare_observations.

    Provenance:
        payload_sha256 is computed from the canonical JSON of the record's
        key fields. This proves integrity/traceability of the captured record.
    """
    # --- Source metadata ---
    source_name: str
    source_url: str
    collection_timestamp: datetime
    collection_mode: DataMode

    # --- Route & flight ---
    origin: str                    # IATA 3-letter code, e.g. "DEL"
    destination: str
    airline_code: str              # 2-letter IATA, e.g. "6E"
    airline_name: str
    flight_number: str
    travel_date: date
    departure_time: Optional[time] = None
    arrival_time: Optional[time] = None
    booking_window_days: int = 1   # must be in {1, 7, 15, 30, 45}

    # --- Fare components ---
    raw_total_fare: float = 0.0
    raw_displayed_price_text: str = ""
    base_fare: Optional[float] = None
    udf_fee: Optional[float] = None
    asf_fee: Optional[float] = None
    gst_tax: Optional[float] = None
    yq_surcharge: Optional[float] = None
    convenience_fee: float = 0.0
    comparable_fare: Optional[float] = None

    # --- Ticket metadata ---
    cabin_class: str = "ECONOMY"
    fare_family: str = "Saver"

    # --- Provenance ---
    raw_html_snippet: Optional[str] = None
    payload_sha256: Optional[str] = None

    def compute_sha256(self) -> str:
        """
        Compute deterministic SHA-256 over canonical key fields.
        Used for integrity tracking and provenance audit trail.
        """
        canonical = json.dumps({
            "airline_code": self.airline_code.upper(),
            "booking_window_days": self.booking_window_days,
            "cabin_class": self.cabin_class,
            "collection_mode": self.collection_mode.value if isinstance(self.collection_mode, DataMode) else str(self.collection_mode),
            "departure_time": self.departure_time.isoformat() if self.departure_time else None,
            "destination": self.destination.upper(),
            "fare_family": self.fare_family,
            "flight_number": self.flight_number.upper(),
            "origin": self.origin.upper(),
            "raw_total_fare": str(self.raw_total_fare),
            "source_name": self.source_name,
            "travel_date": str(self.travel_date),
        }, sort_keys=True)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def idempotency_key(self) -> str:
        """
        Deterministic identity key for duplicate detection.
        Preserves channel/source separation, fare family, cabin class, and horizon.
        """
        dep_time_str = self.departure_time.isoformat() if self.departure_time else ""
        mode_str = self.collection_mode.value if isinstance(self.collection_mode, DataMode) else str(self.collection_mode)
        return (
            f"{self.source_name}|{self.origin.upper()}|{self.destination.upper()}|"
            f"{self.airline_code.upper()}|{self.flight_number.upper()}|"
            f"{self.travel_date}|{dep_time_str}|{self.booking_window_days}|"
            f"{mode_str}|{self.fare_family}|{self.cabin_class}"
        )


class BaseScraperAdapter(ABC):
    """
    Abstract base class for all source adapters.

    Subclasses must implement:
        name   @property -> str
        mode   @property -> DataMode
        collect()        -> list[RawObservationRecord]

    Subclasses MUST NOT:
        - Bypass CAPTCHA or authentication systems
        - Rotate identities deceptively
        - Convert DataMode silently
        - Raise exceptions out of collect() (handle internally, return empty list)
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique source identifier, e.g. 'fixture_historical', 'indigo_live'."""
        ...

    @property
    @abstractmethod
    def mode(self) -> DataMode:
        """Data mode this adapter operates in. Must never be silently converted."""
        ...

    @abstractmethod
    def collect(self) -> list[RawObservationRecord]:
        """
        Collect raw airfare observations from the source.
        Returns a (possibly empty) list of RawObservationRecord.
        Must never raise unhandled exceptions -- catch and return [].
        """
        ...

    def is_enabled(self) -> bool:
        """Override in subclass to implement enable/disable logic."""
        return True
