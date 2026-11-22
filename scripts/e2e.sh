#!/usr/bin/env bash
#
# Local end-to-end run: disposable API database, real PostgreSQL, Valkey and
# Mailpit, then the two Playwright journeys against the built dashboard.
#
# The API checkout is expected next to this repository, or set
# INFINITY_URL_API_DIR. The API must have its composer dependencies installed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="${INFINITY_URL_API_DIR:-$ROOT/../infinity-url-api}"
PHP_BIN="${PHP_BIN:-$HOME/.config/herd-lite/bin/php}"
DB_NAME="${E2E_DB_NAME:-infinity_url_e2e}"
SALT_FILE="$(mktemp)"
API_PID=""

if command -v podman >/dev/null 2>&1; then
  COMPOSE=(podman compose)
else
  COMPOSE=(docker compose)
fi

cleanup() {
  if [[ -n "$API_PID" ]]; then
    kill "$API_PID" 2>/dev/null || true
  fi
  rm -f "$SALT_FILE"
}
trap cleanup EXIT

if [[ ! -d "$API_DIR" ]]; then
  echo "API checkout not found: $API_DIR" >&2
  exit 1
fi

if [[ -z "${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-}" ]]; then
  candidate="$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null | sort -V | tail -1 || true)"
  if [[ -n "$candidate" ]]; then
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE="$candidate"
  fi
fi

"${COMPOSE[@]}" -f "$API_DIR/compose.yml" up -d postgres valkey mailpit

openssl rand -hex 32 > "$SALT_FILE"
chmod 600 "$SALT_FILE"

cd "$API_DIR"

DB_DATABASE="$DB_NAME" "$PHP_BIN" artisan tinker --execute="
try {
    DB::connection()->getPdo()->exec('CREATE DATABASE $DB_NAME');
} catch (Throwable) {
}
" >/dev/null

DB_DATABASE="$DB_NAME" "$PHP_BIN" artisan migrate --seed --force >/dev/null
DB_DATABASE="$DB_NAME" "$PHP_BIN" artisan cache:clear >/dev/null

(
  cd "$API_DIR/public"
  DB_DATABASE="$DB_NAME" \
  DASHBOARD_URL="http://localhost:3000" \
  LINK_HOST="iurl.fr" \
  LINK_URL="" \
  QUEUE_CONNECTION="sync" \
  ANALYTICS_SALT_PATH="$SALT_FILE" \
  ABUSE_CHECK_ENABLED="false" \
  SIGNUPS_OPEN="true" \
  "$PHP_BIN" -S 0.0.0.0:8000 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
) &
API_PID=$!

for _ in $(seq 1 40); do
  if curl -s -o /dev/null -H 'Accept: application/json' http://localhost:8000/v1/me; then
    break
  fi
  sleep 0.25
done

cd "$ROOT"

E2E_API_URL="http://localhost:8000" \
E2E_MAILPIT_URL="http://localhost:8025" \
E2E_API_BASE="http://localhost:8000/v1" \
bun run test:e2e
