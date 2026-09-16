"""
Celery Normalization Tasks -- SIH26056 Phase C
"""
import logging
from app.core.celery_app import celery_app
from app.database.session import SessionLocal
from app.services.phase_c_pipeline import run_phase_c_normalization

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.normalization_tasks.normalize_observations_task")
def normalize_observations_task() -> dict:
    """
    Background Celery task to execute Phase C normalization pipeline.
    """
    logger.info("Executing Celery Phase C normalization task...")
    db = SessionLocal()
    try:
        result = run_phase_c_normalization(db)
        return result.model_dump()
    finally:
        db.close()
