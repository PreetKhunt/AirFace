"""
IndiGoAdapter -- SIH26056 Phase B (LIVE adapter SHELL)

This is a conservative, fail-safe shell for IndiGo live scraping.
It is NOT fully implemented in Phase B -- the shell exists to validate
the BaseScraperAdapter contract and provide a safe placeholder.

PROHIBITED (hard-coded guards):
  - CAPTCHA bypass of any kind
  - Authentication bypass
  - Credential theft
  - Deceptive identity rotation
  - More than 1 request per 2 seconds (rate_limit_seconds >= 2.0)

In Phase B this adapter ALWAYS returns [] and logs a warning.
Full Playwright scraping will be implemented in a future phase.
"""
from __future__ import annotations

import logging
import time

from app.core.enums import DataMode
from app.scrapers.base import BaseScraperAdapter, RawObservationRecord

logger = logging.getLogger(__name__)

# Minimum inter-request delay (seconds). Hard floor: never go below 2.0.
_MIN_RATE_LIMIT_SECONDS = 2.0


class IndiGoAdapter(BaseScraperAdapter):
    """
    LIVE adapter shell for IndiGo (6E) airfare scraping.

    Phase B status: SHELL ONLY -- collect() always returns [].
    Playwright integration is deferred to Phase C/D.

    Guards:
        - rate_limit_seconds < 2.0 raises ValueError at init
        - CAPTCHA / auth bypass is NEVER implemented
        - collect() catches all exceptions and returns []
    """

    def __init__(self, rate_limit_seconds: float = 3.0, scraper_enabled: bool = False):
        if rate_limit_seconds < _MIN_RATE_LIMIT_SECONDS:
            raise ValueError(
                f"rate_limit_seconds must be >= {_MIN_RATE_LIMIT_SECONDS}. "
                f"Got: {rate_limit_seconds}"
            )
        self._rate_limit = rate_limit_seconds
        self._scraper_enabled = scraper_enabled

    @property
    def name(self) -> str:
        return "indigo_live"

    @property
    def mode(self) -> DataMode:
        return DataMode.LIVE

    def is_enabled(self) -> bool:
        return self._scraper_enabled

    def collect(self) -> list[RawObservationRecord]:
        """
        Phase B: SHELL -- always returns empty list.
        Playwright integration deferred. No external requests are made.
        """
        if not self._scraper_enabled:
            logger.info(
                "IndiGoAdapter: scraper_enabled=False. "
                "Returning empty collection (Phase B shell)."
            )
            return []

        logger.warning(
            "IndiGoAdapter.collect() called with scraper_enabled=True "
            "but Playwright integration is not yet implemented (Phase B shell). "
            "Returning []."
        )
        return []
