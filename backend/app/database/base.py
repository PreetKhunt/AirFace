"""
Import all SQLAlchemy models for Alembic metadata discovery.
"""
from app.database.session import Base
from app.models.route import Route
from app.models.observation import RawAirfareObservation, ParsedAirfareObservation, NormalizedIndexObservation
from app.models.index import ElementaryRouteIndex, NationalAggregateIndex
from app.models.log import DataQualityLog, ProvenanceAuditTrail

__all__ = [
    "Base",
    "Route",
    "RawAirfareObservation",
    "ParsedAirfareObservation",
    "NormalizedIndexObservation",
    "ElementaryRouteIndex",
    "NationalAggregateIndex",
    "DataQualityLog",
    "ProvenanceAuditTrail"
]
