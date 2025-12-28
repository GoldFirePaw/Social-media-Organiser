#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

trap 'kill 0' EXIT

(
  cd backend
  npm install
  npm run dev
) &

(
  cd frontend
  npm install
  npm run dev
) &

wait
