.PHONY: install dev test lint format migrate docker-up docker-down

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

test:
	pytest backend/tests

lint:
	flake8 backend/app frontend/src

format:
	black backend/app

migrate:
	cd backend && alembic upgrade head

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
