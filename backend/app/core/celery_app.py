from celery import Celery
from app.config import settings
from app.core.logging import logger

celery_app = Celery(
    "sih_airfare_index",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="app.core.celery_app.health_check_task")
def health_check_task() -> dict:
    """
    Celery health check task confirming Redis broker connectivity.
    """
    logger.info("Executing Celery health check task...")
    return {
        "status": "ok",
        "task": "health_check_task",
        "broker": settings.REDIS_URL
    }
