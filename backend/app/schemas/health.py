from pydantic import BaseModel, Field
from app.core.enums import DataMode

class HealthResponse(BaseModel):
    """
    Response schema for GET /api/v1/health
    """
    status: str = Field("ok", json_schema_extra={"example": "ok"})
    service: str = Field("airfare-index-api", json_schema_extra={"example": "airfare-index-api"})
    version: str = Field("1.0.0", json_schema_extra={"example": "1.0.0"})

class SystemStatusResponse(BaseModel):
    """
    Response schema for system & database status dashboard widget.
    """
    status: str = Field("ok", json_schema_extra={"example": "ok"})
    service: str = Field("airfare-index-api", json_schema_extra={"example": "airfare-index-api"})
    version: str = Field("1.0.0", json_schema_extra={"example": "1.0.0"})
    database_connected: bool = Field(True, json_schema_extra={"example": True})
    redis_connected: bool = Field(True, json_schema_extra={"example": True})
    data_mode: DataMode = Field(DataMode.LIVE, json_schema_extra={"example": DataMode.LIVE})
