import logging
import sys
from app.config import settings

def setup_logging():
    """
    Configures structured logging for the application.
    """
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)]
    )

logger = logging.getLogger("sih_airfare_index")
