# PULSE

PULSE is a research project for pharmacy demand signals and inventory planning. The repository contains a FastAPI service, a research model, datasets, and one website.

## Website

The website is [`website/frontend/index.html`](website/frontend/index.html). Start it from `website/`:

```bash
./serve-website.sh
```

Open `http://127.0.0.1:4173/`. Its 24-medication plan is illustrative. Selecting sales and inventory CSVs unlocks the demonstration, but the files are not read or uploaded and the displayed figures are not calculated from them. See [`website/README.md`](website/README.md) for tests and deployment details.

## Research and API

`model/` holds the research model and `website/backend/` serves public signal APIs. These are separate from the illustrative website flow. Results are not clinical or purchasing instructions.
