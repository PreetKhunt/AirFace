# Environment Setup Guide
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. System Requirements

* **OS:** Windows 10/11, Linux (Ubuntu 22.04+), macOS 13+
* **Python:** Python 3.11+
* **Node.js:** Node.js 18+ / 20+
* **Database:** PostgreSQL 16+ with TimescaleDB extension
* **Cache:** Redis 7+
* **Docker:** Docker Desktop 25+ with Docker Compose

---

## 2. Local Development Setup (Step-by-Step)

### Step 1: Clone & Environment Variables
```bash
git clone https://github.com/mospi-sih26056/airfare-price-index.git
cd airfare-price-index

# Copy sample environment configuration
cp .env.example .env
```

### Step 2: Python Backend Virtual Environment
```bash
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
playwright install chromium
```

### Step 3: Frontend Setup (Next.js)
```bash
cd frontend
npm install
cd ..
```

### Step 4: Run PostgreSQL & Redis Services
```bash
docker-compose up -d db redis
```

### Step 5: Database Migrations & Initial Seed Data
```bash
python -m src.database.migrate
python -m src.database.seed_routes
```

### Step 6: Launch Development Servers
```bash
# Terminal 1: FastAPI Backend
uvicorn src.main:app --reload --port 8000

# Terminal 2: Next.js Frontend
cd frontend && npm run dev
```

* **Backend OpenAPI Docs:** `http://localhost:8000/docs`
* **Frontend Web Dashboard:** `http://localhost:3000`
