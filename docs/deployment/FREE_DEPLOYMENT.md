# SIH26056 Free Cloud Deployment Guide

This document describes how to deploy the **AirFace / SIH26056** prototype to a zero-cost cloud architecture using **Render** and **Vercel**.

## Architecture Overview (Zero-Cost Setup)

Because Render does not offer a free Background Worker instance, we have surgically modified the `render.yaml` Blueprint to exclusively provision free-tier resources. The Celery application is safely disabled in this deployment mode, preventing any accidental billing.

1. **Vercel (Free Tier)**
   - Hosts the Next.js frontend dashboard.
   - Automatically builds from the `/frontend` root.

2. **Render Web Service (Free Tier)**
   - Hosts the FastAPI backend.
   - Binds to `0.0.0.0:$PORT` dynamically.
   - Completely handles synchronous API reads (dashboard hydration) and synchronous writes (historical deterministic dataset injection).

3. **Render PostgreSQL (Free Tier)**
   - Native managed database.
   - `DATABASE_URL` is safely injected into the FastAPI service.
   - Alembic runs `upgrade head` seamlessly on deployment.

4. **Render Key Value (Free Tier Redis)**
   - Used for application states requiring Key/Value configuration.
   - Pre-wired to `REDIS_URL`.

## Celery Background Worker
**Status:** Disabled in Zero-Cost Demo
**Why?** Render does not provide free Background Worker instances. The `sih-celery-worker` has been removed from the zero-cost Blueprint (`render.yaml`) to prevent immediate credit card requirements.

**Impact:**
- The frontend dashboard remains **fully operational**. It will query the PostgreSQL database for historical demo data synchronously.
- **Live web scraping** via Celery tasks is bypassed. The `reset_demo.py` orchestrator relies exclusively on FastAPI's synchronous pipeline to generate the deterministic prototype.
- To re-enable the Celery worker for a paid production deployment or local execution, uncomment the worker node in `render.yaml` or run `celery -A app.core.celery_app worker` locally.

## Deployment Steps

1. **Push your code to GitHub.**
2. **Deploy Backend (Render):**
   - Navigate to the Render Dashboard -> Blueprints -> Connect your GitHub repo.
   - Render will detect the `render.yaml` file.
   - Approve the provisioning of the 3 free services (Web Service, PostgreSQL, Key Value).
   - Once deployed, copy your Web Service URL (e.g. `https://sih-backend.onrender.com`).
3. **Deploy Frontend (Vercel):**
   - Connect your GitHub repo in Vercel.
   - Set the Framework to Next.js and the Root Directory to `frontend`.
   - Add the Environment Variable `NEXT_PUBLIC_API_URL` set to `https://sih-backend.onrender.com/api/v1`.
   - Deploy.
4. **Link CORS:**
   - Go back to Render -> Web Service -> Environment Variables.
   - Update `CORS_ORIGINS` to include your new Vercel domain (e.g. `https://airface.vercel.app`).
5. **Prime Database:**
   - In Render, go to your Web Service -> Shell.
   - Run `python reset_demo.py` to synchronously populate the database with 540 phase-complete test observations.

## Render Free Tier Limitations
- **Spin-Down**: The free Web Service spins down after 15 minutes of inactivity. The first request after spin-down will experience a ~50 second cold start delay.
- **PostgreSQL Expiration**: Free PostgreSQL databases are deleted after 30 days unless upgraded.
- **RAM Limits**: Capped at 512 MB. The mathematical Jevons and Young Index matrix logic has been highly optimized to prevent OOM kills.
