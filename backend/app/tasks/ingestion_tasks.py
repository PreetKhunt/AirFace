"""
Celery Ingestion Tasks -- SIH26056 Phase B
"""
import logging
from app.core.celery_app import celery_app
from app.core.enums import DataMode
from app.database.session import SessionLocal
from app.scrapers.fixture_adapter import FixtureAdapter
from app.scrapers.indigo_adapter import IndiGoAdapter
from app.services.ingestion import run_ingestion
from app.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.ingestion_tasks.ingest_fixture_task")
def ingest_fixture_task(mode_str: str) -> dict:
    """
    Background Celery task to execute fixture ingestion (HISTORICAL or SYNTHETIC).
    """
    logger.info(f"Starting Celery fixture ingestion task for mode: {mode_str}")
    mode = DataMode(mode_str.upper())
    adapter = FixtureAdapter(data_mode=mode)
    
    db = SessionLocal()
    try:
        result = run_ingestion(adapter, db)
        return result.model_dump()
    finally:
        db.close()


@celery_app.task(name="app.tasks.ingestion_tasks.collect_live_source_task")
def collect_live_source_task(source_name: str) -> dict:
    """
    Background Celery task to execute live source collection.
    """
    logger.info(f"Starting Celery live source collection task for source: {source_name}")
    if source_name == "indigo_live":
        adapter = IndiGoAdapter(scraper_enabled=settings.SCRAPER_ENABLED)
    else:
        raise ValueError(f"Unknown live source: {source_name}")

    db = SessionLocal()
    try:
        result = run_ingestion(adapter, db)
        return result.model_dump()
    finally:
        db.close()
