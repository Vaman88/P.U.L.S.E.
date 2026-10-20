#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/frontend"
exec python3 -m http.server 4173 --bind 127.0.0.1 --directory .
