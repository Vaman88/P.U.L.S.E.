# PULSE

PULSE is a predictive platform for pharmaceutical demand forecasting, generating forward-looking demand signals across CMS Part D and ATC levels.

## Architecture

1. **`website/`** — A FastAPI backend and React frontend. The backend runs a 24/7 background worker (`worker.py`) that periodically captures live news signals and runs the core `ProductionModel`. The frontend provides access to these live signals and predictions.
2. **`model/`** — The data and research package, which houses the active `ProductionModel` implementation (`model/prod_pipeline.py`). The model combines 20 news signals with historical data to produce predictions for 1300+ CMS Part D drugs and 18 Arkansas ATC classes.

Neither output should be treated as a procurement instruction or clinical decision.

## Repository layout

```text
PULSE/
├── data/                  # Historical and static datasets
├── test_data/             # Test data
├── model/                 # Contains the ProductionModel (prod_pipeline.py)
├── website/               # FastAPI backend, background worker, and React frontend
└── README.md              # This guide
```

## Prerequisites

- **Python 3.10+** for the API and background worker.
- **Node.js 20 LTS** for the React frontend.
- **Git LFS** for downloading necessary model history files.

```bash
git lfs install
git lfs pull
```

## Quick Start

### 1. Backend and Worker

The backend serves the API and also runs a 24/7 background worker to gather live news signals and run the ProductionModel.

Install Python dependencies:
```bash
cd website
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
```

Run the API:
```bash
python -m backend.main
```
The API listens on `http://localhost:8000`.

In a separate terminal, start the 24/7 background worker:
```bash
cd website
source .venv/bin/activate
python -m backend.worker
```
The worker will periodically trigger `refresh_combined_model.py` which trains and runs the `ProductionModel`.

### 2. New website

Start the visual workspace and prepare its local browser model runtime:
```bash
cd website
./serve-prototype.sh
```
Open `http://127.0.0.1:4173/prototype.html`. Upload daily sales and inventory CSVs there to train on this device. Public-signal history requires the API.

## The Production Model

The `ProductionModel` (`model/prod_pipeline.py`) is the core engine of PULSE. It works by:
1. The background worker capturing the latest news signals via `refresh_news_model`.
2. The worker executing `refresh_combined_model.py`.
3. Generating predictions for 1300+ CMS Part D drugs (predicting the next year's demand state) and 18 ATC classes (predicting next month's demand state) by combining the live news signals with historical data.
4. Persisting these predictions as live signals into the SQLite database for the frontend to consume.

## License

Private — All rights reserved.
