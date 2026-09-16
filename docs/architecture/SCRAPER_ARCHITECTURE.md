# Scraper Fleet Architecture Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Executive Purpose & Constraints

The Scraper Fleet Subsystem is responsible for daily extraction of published domestic ticket fares from airline portals (IndiGo, Air India) and OTAs (MakeMyTrip, EaseMyTrip).

### Compliance & Design Constraints
1. **Ethical Pacing:** Enforce a minimum polite request delay of $\ge 2.0$ seconds between requests to any single IP/domain.
2. **Robots.txt Adherence:** Automatically fetch and parse `robots.txt` before firing scraping jobs, strictly bypassing checkout paths (`/booking`, `/checkout`).
3. **Transparent Identification:** Emit an honest `User-Agent` header containing MoSPI research contact details.
4. **No Illegal Bypassing:** Strictly no unauthorized CAPTCHA cracking or paywall breaching.
5. **Static Fixture Fallback:** Automatically switch to stored historical fixture datasets if a target portal returns 403 Forbidden or 429 Rate Limit errors.

---

## 2. Component Pipeline Diagram

```
[ Ingestion Scheduler (Celery/Cron) ]
                  │
                  ▼
[ Robots.txt Compliance Check ] ──► (Disallowed Path? ──► Bypass)
                  │
                  ▼
[ Rate Limiter Middleware (Delay >= 2.0s) ]
                  │
                  ▼
[ Playwright Chromium Context Pool ]
                  │
     Target Portal Response Code?
               ╱    ╲
              ╱      ╲
          200 OK   403/429/Block
            ╱          ╲
           ▼            ▼
[ Parse DOM Listings ]  [ Trigger Static Fixture Fallback ]
           │            (Mark Obs: HISTORICAL_FIXTURE)
           ▼
[ Pipeline Normalization ]
```

---

## 3. Core Scraper Adapter Interface (Python)

```python
from abc import ABC, abstractmethod
from typing import List
from datetime import date
from pydantic import BaseModel

class ScrapedFareItem(BaseModel):
    source_name: str
    source_url: str
    origin: str
    destination: str
    airline_code: str
    flight_number: str
    travel_date: date
    booking_window_days: int
    raw_displayed_price: float
    base_fare: float | None = None
    taxes_and_fees: float | None = None
    raw_html_snippet: str

class BaseScraperAdapter(ABC):
    """
    Abstract Base Class for all portal scrapers.
    """
    def __init__(self, domain: str, delay_seconds: float = 2.0):
        self.domain = domain
        self.delay_seconds = delay_seconds

    @abstractmethod
    async def scrape_route(self, origin: str, destination: str, travel_date: date) -> List[ScrapedFareItem]:
        """Scrapes fare listings for a specific route and travel date."""
        pass
```
