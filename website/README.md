# PULSE website

This folder is a standalone static preview. It contains the page and the four
local assets it needs. No build step, Node packages, API, database, or model are
required to view it.

## Run locally

From the repository root, run:

```bash
python -m http.server 4173 --bind 127.0.0.1 --directory website
```

Open <http://127.0.0.1:4173/>.

The workspace displays an illustrative plan from `public/illustrative-plan.json`.
The selected CSV files are not read or uploaded, and the preview sign-in does not
create an account. The public signals and API screens are reference mockups;
there is no live API in this branch.
