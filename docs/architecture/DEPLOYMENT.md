# Deployment Architecture Specification
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Containerized Infrastructure Stack

The complete platform is packaged using Docker Compose for zero-dependency local and cloud deployment across Windows, Linux, and macOS.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER COMPOSE STACK                              │
│                                                                             │
│  ┌───────────────────────┐   ┌───────────────────────┐                      │
│  │ frontend              │   │ backend               │                      │
│  │ (Next.js Node 20)     │──►│ (FastAPI Python 3.11) │                      │
│  │ Port 3000             │   │ Port 8000             │                      │
│  └───────────────────────┘   └───────────┬───────────┘                      │
│                                          │                                  │
│             ┌────────────────────────────┼────────────────────────────┐     │
│             ▼                            ▼                            ▼     │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌──────────────────┐│
│  │ db                    │   │ redis                 │   │ celery_worker    ││
│  │ (PostgreSQL 16)       │   │ (Redis 7)             │   │ (Scraper Worker) ││
│  │ Port 5432             │   │ Port 6379             │   │ Playwright Headless│
│  └───────────────────────┘   └───────────────────────┘   └──────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Docker Compose Configuration (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  db:
    image: timescale/timescaledb:latest-pg16
    container_name: sih_db
    environment:
      POSTGRES_DB: sih_airfare
      POSTGRES_USER: mospi_admin
      POSTGRES_PASSWORD: mospi_secure_password_2026
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: sih_redis
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    container_name: sih_backend
    environment:
      DATABASE_URL: postgresql://mospi_admin:mospi_secure_password_2026@db:5432/sih_airfare
      REDIS_URL: redis://redis:6379/0
      DATA_MODE: LIVE
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sih_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```
