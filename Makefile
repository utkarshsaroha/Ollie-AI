.PHONY: up down logs test build

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

test:
	cd backend && python -m pytest -q
