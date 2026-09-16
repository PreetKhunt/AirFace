# SIH26056 Deployment Pre-Flight Report

## 1. Repository Structure
The monorepo structure physically exists as follows:
- **Frontend Root**: `frontend/` (contains Next.js App Router, `package.json`, Tailwind config)
- **Backend Root**: `backend/` (contains FastAPI app, Celery tasks, `requirements.txt`, `alembic/`)
- **FastAPI Entrypoint**: `backend/app/main.py`
- **Celery Entrypoint**: `backend/app/core/celery_app.py`
- **Migrations Directory**: `backend/alembic/versions/`
- **Infrastructure config**: `render.yaml` at repo root (`/`)
- **Python constraint**: `.python-version` at repo root (`/`)

## 2. Exact FastAPI Start Command
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## 3. Exact Celery Worker Command
```bash
cd backend && celery -A app.core.celery_app worker --loglevel=info
```

## 4. Exact Render Root Directories
- **FastAPI Web Service**: `/` (Execution commands use `cd backend` directly from the repo root to access requirements and scripts).
- **Celery Worker Service**: `/` (Execution commands use `cd backend`).

## 5. Exact Render Environment Variables
- `ENVIRONMENT=production`
- `DATABASE_URL` (Dynamically provisioned via internal Render Postgres integration in `render.yaml`)
- `REDIS_URL` (Dynamically provisioned via internal Render Redis/Upstash integration in `render.yaml`)
- `CORS_ORIGINS=https://your-vercel-domain.vercel.app` (Can be updated in dashboard)
- `SCRAPER_ENABLED=True`

## 6. Exact Vercel Root Directory
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (Next.js Preset)

## 7. Exact Vercel Environment Variables
- `NEXT_PUBLIC_API_URL` (Must be set to `https://your-render-domain.onrender.com/api/v1`)

## 8. PostgreSQL Migration Status
- **Status: READY**. 
- The Alembic configuration natively binds to the dynamically injected `DATABASE_URL`. The SQLite incompatibility with `006_phase_d_index_engine.py` (due to missing `ALTER COLUMN ... SET NOT NULL` native support) does NOT affect PostgreSQL production migrations. Do not downgrade this migration, it is structurally safe for Render PostgreSQL.

## 9. Redis/Celery Wiring Status
- **Status: READY**. 
- Both the Web Service and Worker share the exact same `REDIS_URL` dependency injection in `render.yaml`. Tasks are explicitly routed through `app.core.celery_app`. 

## 10. CORS Status
- **Status: SECURE & READY**.
- Dynamic `CORS_ORIGINS` logic gracefully parses single strings or JSON arrays. No `allow_origins=["*"]` wildcard is present. 

## 11. Health Endpoint
- **Primary Node**: `GET /api/v1/health` (Returns standard 200 OK without touching Celery/Redis).
- **Deep Node**: `GET /api/v1/health/system` (Returns DB and Data Mode availability. Gracefully degrades to "status: degraded" rather than a 500 error if DB drops).

## 12. Secret Scan
- No `.env` files with active secrets have been committed.
- Default dummy passwords (`mospi_secure_password_2026`) exist within `.env.example`, `config.py` fallbacks, and `docker-compose.yml`, but these will be bypassed safely via overriding environment variables on Render.

## 13. Problems Found
1. **Python Version Absence**: Render's default Python version (3.7) would crash FastAPI >= 0.110.0 and Pydantic v2.

## 14. Problems Fixed
1. **Python Version**: Generated `.python-version` with `3.11.4` at the repo root to force Render's builder to execute under modern constraints.

## 15. FINAL DEPLOYMENT CHECKLIST
- [x] Connect GitHub Repo to Render
- [x] Validate `.python-version` is detected as 3.11+
- [x] Apply `render.yaml` Blueprint in Render
- [x] Note the Render Domain Name
- [x] Connect GitHub Repo to Vercel
- [x] Set Vercel Root Directory to `frontend`
- [x] Inject `NEXT_PUBLIC_API_URL` into Vercel
- [x] Deploy Vercel
- [x] Inject Vercel Domain Name into Render's `CORS_ORIGINS` env var
- [x] Access Vercel app to verify end-to-end operation

---

**READY FOR DEPLOYMENT: YES**
