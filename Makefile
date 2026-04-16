.PHONY: build up down restart logs logs-backend logs-frontend clean

# Build and start all services
build:
	docker-compose build --no-cache

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Clean up
clean:
	docker-compose down -v
	rm -rf hrms-app/backend/__pycache__ hrms-app/backend/app/__pycache__

# Development mode (with volume mounts for hot reload)
dev:
	docker-compose up

# Production build only
prod:
	docker-compose -f docker-compose.yml build --no-cache
	docker-compose -f docker-compose.yml up -d --no-deps