# Scraper Fleet & Ingestion Adapter Guide
## SIH26056 -- Real-Time Airfare Price Index for India

---

## 1. Compliance & Ethical Scraping Directives

* **Politeness Delay:** Enforce minimum >= 2.0s delay between requests to any single target domain (hard-coded floor in IndiGoAdapter).
* **Robots.txt Adherence:** Parse obots.txt before firing requests; strictly bypass /checkout paths.
* **User-Agent:** Emit transparent User-Agent string with MoSPI research contact details.
* **Prohibited Mechanisms:** No CAPTCHA bypass, authentication bypass, credential theft, or deceptive identity rotation. When blocked, the adapter sets status BLOCKED and the system relies on historical fixture datasets.

---

## 2. Ingestion Adapters Architecture (Phase B)

All source adapters inherit from BaseScraperAdapter in pp.scrapers.base:

`python
from app.scrapers.base import BaseScraperAdapter, RawObservationRecord
from app.core.enums import DataMode

class CustomAdapter(BaseScraperAdapter):
    @property
    def name(self) -> str:
        return "custom_source"

    @property
    def mode(self) -> DataMode:
        return DataMode.HISTORICAL

    def collect(self) -> list[RawObservationRecord]:
        # Collects and returns RawObservationRecord objects
        ...
`

### Available Adapters in Phase B:
1. **FixtureAdapter (pp.scrapers.fixture_adapter)**:
   - ixture_historical: Ingests verified 450-row historical baseline CSV.
   - ixture_synthetic: Ingests 90-row synthetic demo CSV.
2. **IndiGoAdapter (pp.scrapers.indigo_adapter)**:
   - indigo_live: Conservative LIVE scraping shell with safety guards (>= 2.0s rate limit, graceful error handling).

---

## 3. Phase Boundary Note

* **Phase B Scope:** Ingestion pipeline parses raw records (RAW -> PARSED) and preserves source fare components.
* **Phase C Scope:** Performs cross-source commercial-equivalence deduplication and index-ready normalization (PARSED -> NORMALIZED).