# PULSE website

The only website in this branch is [`frontend/index.html`](frontend/index.html). It is a static research preview with a workspace, an illustrative 24-medication results screen, and API documentation links. The FastAPI service and research model remain separate from this preview.

## Run locally

From `website/`:

```bash
./serve-website.sh
```

Open `http://127.0.0.1:4173/`. The preview does not need the API to show its illustrative results. Choose two CSVs and select **Train on this device** to see the progress bar and results. The selected files are not read or uploaded; the results come from `frontend/public/illustrative-plan.json` and are not model output.

To run the API separately, install `requirements.txt` and run `python -m backend.main` from `website/`.

## Browser tests

```bash
cd frontend
npm ci
npx playwright test
```

The Docker frontend serves the same `frontend/index.html` as the local script. The API and worker retain their existing services.
