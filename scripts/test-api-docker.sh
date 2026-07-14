#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-all}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.api-test.yml"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

cd "$ROOT_DIR"

docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
docker compose -f "$COMPOSE_FILE" up -d --build

bash "$ROOT_DIR/scripts/wait-for-health.sh" "http://127.0.0.1:2525/imposters" 30
bash "$ROOT_DIR/scripts/wait-for-health.sh" "http://127.0.0.1:4000/health" 30

API_TEST_RUNTIME_MODE=external node "$ROOT_DIR/scripts/api-tests/run-bruno-suite.js" "$MODE"
