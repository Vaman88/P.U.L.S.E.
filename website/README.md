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

## Demo CSV files

- `demo-files/daily_sales_demo.csv`: 1,344 synthetic daily sales rows for 24 medications, dated August 25–October 19, 2026.
- `demo-files/current_inventory_demo.csv`: one synthetic inventory row per medication, dated October 19, 2026.

Download both files from the workspace screen and select them in their matching
upload areas. The preview shows the same illustrative plan regardless of file
contents; selecting the files does not calculate a new plan.
