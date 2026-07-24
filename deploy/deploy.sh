#!/usr/bin/env bash
# Build + restart helper. Run on the server, inside the project dir, after
# pulling new code. First-time setup is documented in docs/DEPLOY.md.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pro-autohub}"
SERVICE="${SERVICE:-pro-autohub}"

cd "$APP_DIR"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Installing dependencies (production)"
npm ci

echo "==> Building"
npm run build

echo "==> Applying DB migrations (schema is idempotent)"
npm run db:migrate

echo "==> Restarting service: $SERVICE"
sudo systemctl restart "$SERVICE"
sleep 2
sudo systemctl --no-pager status "$SERVICE" | head -n 8

echo "==> Done. Health check:"
curl -fsS http://127.0.0.1:3000/api/health && echo
