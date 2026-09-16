from app.models.route import Route
from app.models.observation import RawAirfareObservation
from app.core.enums import DataMode
import datetime
import uuid

def test_route_model_creation(db_session):
    route = Route(
        route_id="DEL-BOM",
        origin_iata="DEL",
        destination_iata="BOM",
        corridor_region="North-West",
        dgca_passenger_volume=450000,
        dgca_volume_weight=0.142000
    )
    db_session.add(route)
    db_session.commit()

    saved_route = db_session.query(Route).filter_by(route_id="DEL-BOM").first()
    assert saved_route is not None
    assert saved_route.origin_iata == "DEL"
    assert float(saved_route.dgca_volume_weight) == 0.142

def test_raw_observation_data_mode(db_session):
    raw_obs = RawAirfareObservation(
        raw_id=uuid.uuid4(),
        collection_timestamp=datetime.datetime.now(datetime.timezone.utc),
        source_name="MakeMyTrip",
        source_url="https://www.makemytrip.com/flight/search?itinerary=DEL-BOM-01/10/2026",
        raw_displayed_price_text="₹ 5,420 (incl. taxes)",
        collection_mode=DataMode.LIVE
    )
    db_session.add(raw_obs)
    db_session.commit()

    saved_obs = db_session.query(RawAirfareObservation).first()
    assert saved_obs is not None
    assert saved_obs.collection_mode == DataMode.LIVE
