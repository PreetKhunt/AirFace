from datetime import date, datetime, timezone

from app.api.v1.pipeline import _historical_collection_dates
from app.core.enums import DataMode
from app.models.observation import RawAirfareObservation


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
