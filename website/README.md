# Pulse — Pharmacy Demand and Replenishment Demo

A per-account demonstration of pharmaceutical demand forecasting and inventory replenishment planning.

> **Development status:** Scientific proof-of-concept. The system generates demand signals using historical data and live news feeds. It is not an operational pharmacy system.

The application serves predictive signals driven by an integrated `ProductionModel`. The system consists of a FastAPI backend that runs a 24/7 background worker. The worker periodically fetches live news data, combines it with historical data, and generates predictive signals for 1300+ CMS Part D drugs and 18 ATC classes.

## Repository Structure

```text
website/
├── backend/              # API/server (Python) and background worker
├── frontend/             # Web UI (React/TypeScript)
├── data/                 # Local development data
├── scripts/              # Utility scripts
├── requirements.txt      # Python dependencies
└── README.md
```

## Quick Start

### 1. Start the API and Worker

Set up a virtual environment and install backend dependencies:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the backend API:
```bash
python -m backend.main
```
The API listens on `http://localhost:8000`.

Run the background worker in a separate terminal:
```bash
source .venv/bin/activate
python -m backend.worker
```
The worker processes live data, runs the core `ProductionModel`, and writes predictive signals to the local SQLite database.

### 2. Start the new website

From `website/`, run:
```bash
./serve-prototype.sh
```
Open `http://127.0.0.1:4173/prototype.html`. The script prepares the local Pyodide/XGBoost runtime before serving the page. Training with 0 years of public signals works without the API; longer signal histories require the backend above.

## The Production Model

The core logic uses a pipeline that:
1. Gathers 20 point-in-time-safe news features via scheduled scrapes.
2. Combines them with localized historical data (CMS, Medicaid SDUD).
3. Evaluates and predicts demand trajectories for 1300+ CMS Part D drugs and 18 specific ATC classes.

## Safety / Data Rules

Do not commit patient-identifying information, private pharmacy datasets, API keys, passwords, `.env` files, raw production datasets, or unreviewed model artifacts containing sensitive data. Use synthetic, public, or appropriately de-identified data during development.

## Disclaimer

This project is a research/development system. Unless separately validated and authorized, predictions and replenishment quantities must not be represented as medical diagnoses, clinical decisions, guaranteed procurement requirements, or a replacement for pharmacists or other qualified professionals.
