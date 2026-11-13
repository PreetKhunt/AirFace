from datetime import date, datetime, time, timezone
from decimal import Decimal

from app.api.v1.pipeline import _historical_collection_dates, _historical_dates_by_horizon
from app.core.enums import DataMode
from app.models.observation import (
    NormalizedIndexObservation,
    ParsedAirfareObservation,
    RawAirfareObservation,
)
from app.models.route import Route


def test_historical_collection_dates_are_dates_and_exclude_other_modes(db_session):
    db_session.add_all([
        RawAirfareObservation(
            collection_timestamp=datetime(2026, 1, 20, tzinfo=timezone.utc),
            source_name="historical-a",
            source_url="fixture://historical/a",
            raw_displayed_price_text="INR 5000",
            collection_mode=DataMode.HISTORICAL,
        ),
        RawAirfareObservation(
            collection_timestamp=datetime(2026, 1, 14, tzinfo=timezone.utc),
            source_name="historical-b",
            source_url="fixture://historical/b",
            raw_displayed_price_text="INR 5000",
            collection_mode=DataMode.HISTORICAL,
        ),
        RawAirfareObservation(
            collection_timestamp=datetime(2026, 1, 10, tzinfo=timezone.utc),
            source_name="synthetic",
            source_url="fixture://synthetic/a",
            raw_displayed_price_text="INR 5000",
            collection_mode=DataMode.SYNTHETIC,
        ),
    ])
    db_session.commit()

    result = _historical_collection_dates(db_session)

    assert result == [date(2026, 1, 14), date(2026, 1, 20)]
    assert all(isinstance(value, date) for value in result)


def test_historical_index_dates_are_grouped_by_valid_horizon(db_session):
    db_session.add(Route(
        route_id="DEL-BOM",
        origin_iata="DEL",
        destination_iata="BOM",
        corridor_region="METRO",
        dgca_volume_weight=Decimal("1.0"),
    ))
    observations = [
        (date(2026, 1, 14), 1, DataMode.HISTORICAL, True),
        (date(2026, 1, 29), 1, DataMode.HISTORICAL, True),
        (date(2025, 12, 13), 45, DataMode.HISTORICAL, True),
        (date(2026, 1, 10), 1, DataMode.SYNTHETIC, True),
        (date(2026, 1, 30), 7, DataMode.HISTORICAL, False),
    ]
    for collection_date, booking_window, mode, valid in observations:
        raw = RawAirfareObservation(
            collection_timestamp=datetime.combine(collection_date, time.min, tzinfo=timezone.utc),
            source_name="fixture",
            source_url="fixture://historical/test",
            raw_displayed_price_text="INR 5000",
            collection_mode=mode,
        )
        db_session.add(raw)
        db_session.flush()
        parsed = ParsedAirfareObservation(
            raw_id=raw.raw_id,
            origin="DEL",
            destination="BOM",
            airline_code="6E",
            flight_number="6E-100",
            travel_date=collection_date,
            booking_window_days=booking_window,
            raw_total_fare=Decimal("5000"),
        )
        db_session.add(parsed)
        db_session.flush()
        db_session.add(NormalizedIndexObservation(
            observation_id=parsed.observation_id,
            route_id="DEL-BOM",
            booking_horizon=f"T+{booking_window}",
            comparable_index_fare=Decimal("5000"),
            valid_for_index=valid,
        ))
    db_session.commit()

    result = _historical_dates_by_horizon(db_session)

    assert result == {
        "T+1": [date(2026, 1, 14), date(2026, 1, 29)],
        "T+45": [date(2025, 12, 13)],
    }


def test_pipeline_calculates_all_historical_horizons(client):
    response = client.post("/api/v1/pipeline/run")

    assert response.status_code == 200, response.text
    index_result = response.json()["index"]
    assert index_result["horizons_processed"] == 5
    assert index_result["elementary_indices_generated"] > 0
    assert index_result["national_indices_generated"] > 0

    summary = client.get("/api/v1/index/horizons")
    assert summary.status_code == 200
    horizons = summary.json()["horizons"]
    assert {item["horizon"] for item in horizons} == {"T+1", "T+7", "T+15", "T+30", "T+45"}
    assert all(item["availability_state"] == "AVAILABLE" for item in horizons)
