from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database.session import get_db
from app.schemas.health import HealthResponse, SystemStatusResponse
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Basic Health Check Endpoint",
    description="Returns service status as mandated by API specification."
)
def get_health():
    """
    Primary Health Check Endpoint.
    Returns:
    {
        "status": "ok",
        "service": "airfare-index-api",
        "version": "1.0.0"
    }
    """
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
        version=settings.VERSION
    )

@router.get(
    "/health/system",
    response_model=SystemStatusResponse,
    summary="Detailed System & Database Status",
    description="Checks DB and Redis connectivity for dashboard status indicators."
)
def get_system_status(db: Session = Depends(get_db)):
    """
    Checks database connection and reports active data mode.
    """
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_connected = False

    import redis
    redis_connected = False
    try:
        r = redis.from_url(settings.REDIS_URL, socket_timeout=1)
        r.ping()
        redis_connected = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_connected = False

    return SystemStatusResponse(
        status="ok" if db_connected and redis_connected else "degraded",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        database_connected=db_connected,
        redis_connected=redis_connected,
        data_mode=settings.DATA_MODE
    )
