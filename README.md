# AIRFACE

**SIH26056 - Real-Time Airfare Price Index for India**

AIRFACE is a prototype for collecting, normalizing, and comparing Indian domestic airfare observations across advance-booking windows. It demonstrates a reproducible statistical pipeline and dashboard; it is not an official Consumer Price Index and does not replace publications from NSO/MoSPI.

## Live Demo

- Dashboard: [air-face-rho.vercel.app](https://air-face-rho.vercel.app)
- API: [sih-backend-kvyb.onrender.com](https://sih-backend-kvyb.onrender.com)
- API health: [/api/v1/health](https://sih-backend-kvyb.onrender.com/api/v1/health)
- Interactive API docs: [/docs](https://sih-backend-kvyb.onrender.com/docs)

The repository and Render Blueprint default to `HISTORICAL` mode. Check the dashboard's data-mode badge for the mode currently served by the API. `SYNTHETIC` mode is available for the deterministic demo; synthetic benchmark validation is kept separate from historical-mode dashboard data.

## What It Does

- Ingests deterministic historical and synthetic fixture datasets, with optional live scraper adapters.
- Normalizes comparable fares as base fare + UDF + ASF + GST + mandatory YQ, excluding convenience fees and optional extras.
- Screens commercial duplicates and fare anomalies while retaining valid market surges.
- Calculates separate Jevons route indices for T+1, T+7, T+15, T+30, and T+45, then aggregates route indices using configured traffic reference weights.
- Computes an empirical eight-factor data-quality score and maintains SHA-256 provenance trails.
- Compares synthetic demo indices with a version-controlled synthetic reference series. These validation metrics are illustrative and are not official DGCA/MoSPI accuracy claims.

## Dashboard Sections

- **Market:** pipeline and index overview.
- **Routes:** route-level index trajectories and horizon selection.
- **Horizons:** national comparison across T+1 through T+45.
- **Analytics:** Jevons and Young/Modified Laspeyres comparisons.
- **Quality:** quality history and horizon-specific data-quality events.
- **Cleaning:** normalized observation inspection by horizon.
- **Validation:** benchmark metrics and matching coverage.
- **Provenance:** observation lineage and payload hashes.
- **System Status:** API, database, Redis, and data-mode health.

## Technology

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Pydantic, Alembic
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts
- **Data services:** PostgreSQL and Redis; Celery is available for background tasks
- **Tests:** Pytest and Jest/React Testing Library

## Local Setup

Prerequisites: Python 3.11+, Node.js 18+, npm, and Docker Compose for the local PostgreSQL/Redis services.

1. Start PostgreSQL and Redis from the repository root:

   ```bash
   docker compose up -d db redis
   ```

2. Install and start the backend:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   The backend defaults to the local Compose database and `HISTORICAL` mode. To use synthetic mode, set `DATA_MODE=SYNTHETIC` in `backend/.env` before starting the API.

3. In a second terminal, configure and start the frontend:

   ```powershell
   cd frontend
   npm install
   Set-Content .env.local 'NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1'
   npm run dev
   ```

   Open `http://localhost:3000`. The backend docs are at `http://localhost:8000/docs`.

## Seed Data

For a complete local demo, run this from the repository root against a **disposable local database**:

```bash
python backend/scripts/seed_demo.py
```

**Warning:** the seed script drops and recreates database tables by default. To preserve the current local schema and data, pass `--no-reset`:

```bash
python backend/scripts/seed_demo.py --no-reset
```

The script loads historical, synthetic, and synthetic-validation fixtures and computes normalization, quality, indices, provenance, and benchmark validation. Set `DATA_MODE` before starting the API to choose which observation mode the dashboard reads.

## Configuration

Backend settings are read from environment variables and `.env` in the backend process's working directory. Useful settings:

- `DATABASE_URL`: PostgreSQL connection string. The local Compose defaults are in [docker-compose.yml](docker-compose.yml).
- `REDIS_URL`: Redis connection string.
- `DATA_MODE`: `HISTORICAL`, `SYNTHETIC`, or `LIVE`; defaults to `HISTORICAL`.
- `CORS_ORIGINS`: comma-separated allowed frontend origins.
- `SCRAPER_ENABLED`: enable or disable live scraper adapters.

For Vercel, set `NEXT_PUBLIC_API_URL` to the backend API root, for example `https://sih-backend-kvyb.onrender.com/api/v1`.

## Tests

Run the backend tests from the repository root:

```bash
python -m pytest backend/tests -q
```

Run frontend tests and a production build:

```bash
cd frontend
npm test -- --runInBand
npm run build
```

## Repository Layout

```text
backend/       FastAPI app, Alembic migrations, services, scripts, tests
frontend/      Next.js dashboard and component tests
data/          Historical, synthetic, and reference fixtures
docs/          Architecture, methodology, deployment, and validation docs
docker/        Backend and frontend Dockerfiles
render.yaml    Render Blueprint
```

## Further Reading

- [API Reference](API.md)
- [Setup Guide](SETUP.md)
- [Developer Guide](DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Dataset Specification](docs/DATASET.md)
- [Validation Methodology](docs/VALIDATION.md)
- [Provenance](docs/PROVENANCE.md)
- [Demo Guide](DEMO_GUIDE.md)

## Limitations

- Fixture data is deterministic demo data, not a verified official airfare microdata series.
- The bundled route weights are traffic-based engineering references, not household expenditure weights.
- Synthetic benchmark scores demonstrate the validation pipeline only; they do not establish production accuracy.
- Live scraping depends on source availability, rate limits, and adapter configuration.

Made By Zenith 
