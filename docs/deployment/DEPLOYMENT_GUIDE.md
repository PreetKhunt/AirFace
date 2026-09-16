# SIH26056 Production Deployment Guide

This guide describes how to deploy the Next.js frontend, FastAPI backend, Celery worker, Redis, and PostgreSQL for a production environment like Render and Vercel.

## A. PostgreSQL Setup
1. Provision a managed PostgreSQL instance (e.g., Render Managed PostgreSQL or AWS RDS).
2. Note the internal connection string if deploying within the same VPC, or the external connection string if accessing remotely.
3. Example format: `postgresql://user:password@hostname:5432/sih_airfare`

## B. Redis Setup
1. Provision a Redis instance (e.g., Upstash, Redis Labs, or Render external Redis).
2. Ensure you have the `REDIS_URL`.
3. Example format: `rediss://default:password@hostname:6379/0`

## C. Render Backend Deployment
1. Connect your repository to Render.
2. In your Render Dashboard, click **New > Blueprint** or manually create a **Web Service**.
3. We have provided a `render.yaml` at the root of the repository. Render will automatically detect the Web Service and Worker.
4. If deploying manually:
   - **Environment**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Provide the necessary environment variables (see Section E).

## D. Render Celery Worker Deployment
1. If using `render.yaml`, the worker is automatically created.
2. If deploying manually, create a **Background Worker** in Render.
3. **Build Command**: `cd backend && pip install -r requirements.txt`
4. **Start Command**: `cd backend && celery -A app.core.celery_app worker --loglevel=info`

## E. Environment Variables
You must set these in your Render and Vercel environments:

### Backend (Render Web Service & Worker)
- `ENVIRONMENT=production`
- `DATABASE_URL=postgresql://...`
- `REDIS_URL=redis://...`
- `CORS_ORIGINS=https://your-vercel-domain.vercel.app` (Comma-separated)
- `SCRAPER_ENABLED=True`

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL=https://your-render-domain.onrender.com/api/v1`

## F. Vercel Deployment
1. Connect your repository to Vercel.
2. Set the Framework Preset to **Next.js**.
3. Root Directory: `frontend`
4. Set the Environment Variable `NEXT_PUBLIC_API_URL` to your Render backend URL.
5. Deploy.

## G. CORS Configuration
The FastAPI backend uses the `CORS_ORIGINS` environment variable to securely whitelist domains.
Never use `*` in production. Pass multiple domains as a comma-separated string:
`CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com`

## H. Database Migration
Migrations run automatically on deployment via the build command:
`alembic upgrade head`

## I. Demo Data Initialization
To prime the production database with historical demo data:
1. Connect to your Render Web Service shell.
2. Run `cd backend && python reset_demo.py`
This script uses safe, synchronous HTTP endpoints to trigger the ingestion and index compilation pipeline.

## J. Health Checks
The backend exposes `/api/v1/health`.
Use this URL in Render's Health Check Path configuration to ensure zero-downtime deployments.

## K. Troubleshooting
- **Celery errors**: Ensure `REDIS_URL` is identical across both Web Service and Worker.
- **PostgreSQL SSL errors**: Render's PostgreSQL requires TLS/SSL. SQLAlchemy handles this, but verify `?sslmode=require` if issues persist.
- **CORS blocked**: Ensure the Next.js production domain is exactly matching what is in `CORS_ORIGINS` without trailing slashes.

## L. Rollback Procedure
1. In Render, go to the **Deploys** tab.
2. Select a previous healthy deploy and click **Rollback to this deploy**.
3. If database schema was altered, you must manually run `alembic downgrade -1` before rolling back the application code.
