# Developer Guide & Workflows
## SIH26056 — Real-Time Airfare Price Index for India

---

## 1. Project Directory Layout

```
SIH/
├── docs/                      # Multi-layer documentation
│   ├── research/              # Layer 1: Research Dossier & Evidence
│   ├── methodology/           # Layer 2: Frozen Math & Specifications
│   ├── prd/                   # Layer 2: PRD Suite & User Flows
│   ├── architecture/          # Layer 2: Architecture Specifications
│   └── implementation/        # Layer 2: Implementation Strategy
├── src/                       # Backend Source Code (FastAPI)
│   ├── api/                   # REST API Controllers & Routes
│   ├── core/                  # Shared Configuration & Logging
│   ├── database/              # DB Schemas, Models & Migrations
│   ├── ingestion/             # Scraper Fleet & Playwright Adapters
│   ├── normalization/          # Component Parsing & Deduplication
│   ├── index_engine/          # Jevons & Young Calculation Engines
│   ├── quality/               # Data Quality Score Microservice
│   └── backtest/              # 30-Day Automated Backtesting Engine
├── frontend/                  # Next.js Web Dashboard Application
├── docker/                    # Dockerfiles & Deployment Assets
├── tests/                     # Unit, Integration & Pipeline Tests
├── config/                    # System YAML Configuration Files
├── .env.example               # Sample Environment File
└── docker-compose.yml         # Container Stack Orchestration
```

---

## 2. Coding & Quality Standards

* **Language Standards:** Python 3.11+ with strict Pydantic type annotations; TypeScript for Next.js frontend.
* **Formatting:** Black (Python) and Prettier (TypeScript).
* **Linting:** Flake8 / Ruff (Python) and ESLint (Next.js).
* **Deterministic Math Guarantee:** Never use black-box neural networks for core price index calculations. Core index MUST use pure statistical math (Jevons/Young).
