import pytest
from datetime import date, datetime, timezone
from app.core.enums import DataMode
from app.scrapers.base import RawObservationRecord
from app.services.parser import parse_record, ParseError
from app.models.observation import RawAirfareObservation, ParsedAirfareObservation
from app.models.log import ProvenanceAuditTrail


def test_parser_valid_record(db_session):
    record = RawObservationRecord(
        source_name="fixture_historical",
        source_url="fixture://DEL-BOM/6E/2026-01-15",
        collection_timestamp=datetime(2026, 1, 14, tzinfo=timezone.utc),
        collection_mode=DataMode.HISTORICAL,
        origin="DEL",
        destination="BOM",
        airline_code="6E",
        airline_name="IndiGo",
        flight_number="6E101",
        travel_date=date(2026, 1, 15),
        booking_window_days=1,
        raw_total_fare=4500.0,
        raw_displayed_price_text="INR 4,500.00",
        base_fare=3800.0,
        udf_fee=250.0,
        asf_fee=30.0,
        gst_tax=190.0,
        yq_surcharge=230.0,
        convenience_fee=0.0,
        comparable_fare=4500.0,
    )

    raw_obs, parsed_obs = parse_record(record, db_session)
    db_session.flush()

    assert raw_obs.raw_id is not None
    assert raw_obs.collection_mode == DataMode.HISTORICAL
    assert parsed_obs.origin == "DEL"
    assert parsed_obs.destination == "BOM"
    assert parsed_obs.booking_window_days == 1
    assert parsed_obs.convenience_fee == 0.0

    # Check audit trail was created
    audit = db_session.query(ProvenanceAuditTrail).filter_by(observation_id=parsed_obs.observation_id).first()
    assert audit is not None
    assert audit.payload_sha256_hash == record.compute_sha256()


def test_parser_rejects_invalid_booking_window(db_session):
    record = RawObservationRecord(
        source_name="fixture_historical",
        source_url="fixture://DEL-BOM/6E/2026-01-15",
        collection_timestamp=datetime.now(timezone.utc),
        collection_mode=DataMode.HISTORICAL,
        origin="DEL",
        destination="BOM",
        airline_code="6E",
        airline_name="IndiGo",
        flight_number="6E101",
        travel_date=date(2026, 1, 15),
        booking_window_days=3,  # Invalid! Not in {1, 7, 15, 30, 45}
        raw_total_fare=4500.0,
    )

    with pytest.raises(ParseError, match="booking_window_days=3"):
        parse_record(record, db_session)


def test_parser_rejects_non_positive_fare(db_session):
    record = RawObservationRecord(
        source_name="fixture_historical",
        source_url="fixture://DEL-BOM/6E/2026-01-15",
        collection_timestamp=datetime.now(timezone.utc),
        collection_mode=DataMode.HISTORICAL,
        origin="DEL",
        destination="BOM",
        airline_code="6E",
        airline_name="IndiGo",
        flight_number="6E101",
        travel_date=date(2026, 1, 15),
        booking_window_days=7,
        raw_total_fare=0.0,  # Invalid fare
    )

    with pytest.raises(ParseError, match="must be > 0"):
        parse_record(record, db_session)
