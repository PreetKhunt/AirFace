from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, func
from app.database.session import Base

class Route(Base):
    """
    Route Basket Registry Table: `routes`
    Stores domestic city-pair directional corridors and DGCA passenger volume weights.
    """
    __tablename__ = "routes"

    route_id = Column(String(7), primary_key=True)  # e.g. 'DEL-BOM'
    origin_iata = Column(String(3), nullable=False)
    destination_iata = Column(String(3), nullable=False)
    corridor_region = Column(String(32), nullable=False)
    dgca_passenger_volume = Column(Integer, default=0)
    dgca_volume_weight = Column(Numeric(8, 6), nullable=False, default=0.0)  # w_r
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
