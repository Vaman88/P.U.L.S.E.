#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/frontend"
if [[ ! -d node_modules ]]; then npm ci; fi
npm run predev
cd ..
exec python3 -m http.server 4173 --directory .
