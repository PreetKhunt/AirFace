# Production & Container Deployment Guide
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Quick Docker Compose Deployment

```bash
# Clone repository
git clone https://github.com/mospi-sih26056/airfare-price-index.git
cd airfare-price-index

# Build and launch container stack
docker-compose up --build -d

# Verify container status
docker-compose ps
```

---

## 2. Ports & Exposed Services

* **Next.js Web Dashboard:** `http://localhost:3000`
* **FastAPI Backend API:** `http://localhost:8000`
* **PostgreSQL / TimescaleDB:** `localhost:5432`
* **Redis Cache:** `localhost:6379`
