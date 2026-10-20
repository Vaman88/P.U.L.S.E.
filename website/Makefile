.PHONY: help install test lint format run-backend run-frontend docker-build docker-run

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install Python dependencies
	pip install -r requirements.txt
	pip install -e ".[dev]"

test: ## Run tests
	pytest tests/ -v

test-cov: ## Run tests with coverage
	pytest tests/ -v --cov=ml --cov=backend --cov-report=html

lint: ## Run linter
	ruff check .

format: ## Format code
	ruff format .

run-backend: ## Run backend server
	python -m backend.main

run-frontend: ## Run frontend dev server
	./serve-website.sh

docker-build: ## Build Docker images
	docker-compose build

docker-run: ## Run with Docker Compose
	docker-compose up

docker-stop: ## Stop Docker Compose
	docker-compose down

clean: ## Clean generated files
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache htmlcov .coverage
