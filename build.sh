#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing Python dependencies"
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Installing and building frontend"
npm install --prefix frontend
npm run build --prefix frontend

if [ ! -f frontend/dist/index.html ]; then
  echo "ERROR: frontend/dist/index.html was not created"
  exit 1
fi

echo "==> Build complete"
ls -la frontend/dist | head -20
