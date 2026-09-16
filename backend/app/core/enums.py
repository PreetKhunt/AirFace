from enum import Enum


class DataMode(str, Enum):
    """
    Data Mode Enumeration:
    - LIVE: Real-time scraped observations directly from target portals.
    - HISTORICAL: Verified scraped observations stored in time-series database.
    - SYNTHETIC: Generated mock observations for demonstration and fallback testing.
    """
    LIVE = "LIVE"
    HISTORICAL = "HISTORICAL"
    SYNTHETIC = "SYNTHETIC"


class BookingHorizon(str, Enum):
    """
    Mandated Advance Booking Horizons: T+1, T+7, T+15, T+30, T+45
    """
    T1 = "T+1"
    T7 = "T+7"
    T15 = "T+15"
    T30 = "T+30"
    T45 = "T+45"


VALID_BOOKING_WINDOW_DAYS = {1, 7, 15, 30, 45}

BOOKING_WINDOW_TO_HORIZON = {
    1: "T+1",
    7: "T+7",
    15: "T+15",
    30: "T+30",
    45: "T+45",
}

VALID_AIRLINE_CODES = {"6E", "AI", "IX", "QP", "SG"}

VALID_ROUTES = {
    "DEL-BOM", "DEL-BLR", "BOM-BLR",
    "DEL-CCU", "DEL-HYD", "BOM-MAA",
    "DEL-PNQ", "DEL-PAT", "BOM-COK",
}


class SourceHealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    BLOCKED = "BLOCKED"
    UNAVAILABLE = "UNAVAILABLE"
    DISABLED = "DISABLED"


class AdapterType(str, Enum):
    FIXTURE = "FIXTURE"
    LIVE = "LIVE"


class NormalizationStatus(str, Enum):
    VALID = "VALID"
    PARTIAL_COMPONENTS = "PARTIAL_COMPONENTS"
    INVALID_COMPONENTS = "INVALID_COMPONENTS"
    MISSING_FARE = "MISSING_FARE"
    INCONSISTENT_TOTAL = "INCONSISTENT_TOTAL"


class AvailabilityStatus(str, Enum):
    VALID = "VALID"
    SOLD_OUT = "SOLD_OUT"
    NO_SERVICE = "NO_SERVICE"
    SCRAPER_FAILURE = "SCRAPER_FAILURE"
    MISSING_FARE = "MISSING_FARE"
    INVALID_OBSERVATION = "INVALID_OBSERVATION"


class OutlierStatus(str, Enum):
    VALID_OBSERVATION = "VALID_OBSERVATION"
    POSSIBLE_MARKET_SURGE = "POSSIBLE_MARKET_SURGE"
    TECHNICAL_OUTLIER = "TECHNICAL_OUTLIER"


class CommercialDedupStatus(str, Enum):
    UNIQUE = "UNIQUE"
    PRIMARY_CANONICAL = "PRIMARY_CANONICAL"
    COMMERCIAL_DUPLICATE = "COMMERCIAL_DUPLICATE"
