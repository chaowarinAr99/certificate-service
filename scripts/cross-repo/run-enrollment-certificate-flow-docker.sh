#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
MODE="${1:-smoke}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.cross-repo.yml"
DEFAULT_ENROLLMENT_SERVICE_DIR="$(cd "$ROOT_DIR/.." && pwd)/enrollment-service/enrollment-service"

export ENROLLMENT_SERVICE_DIR="${ENROLLMENT_SERVICE_DIR:-$DEFAULT_ENROLLMENT_SERVICE_DIR}"

if [[ ! -d "$ENROLLMENT_SERVICE_DIR" ]]; then
  echo "Enrollment service directory not found: $ENROLLMENT_SERVICE_DIR" >&2
  echo "Set ENROLLMENT_SERVICE_DIR=/path/to/enrollment-service/enrollment-service" >&2
  exit 1
fi

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

cd "$ROOT_DIR"

docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
docker compose -f "$COMPOSE_FILE" up -d --build

bash "$ROOT_DIR/scripts/wait-for-health.sh" "http://127.0.0.1:2525/imposters" 30
bash "$ROOT_DIR/scripts/wait-for-health.sh" "http://127.0.0.1:4000/health" 30

if [[ "$MODE" != service-only ]]; then
  bash "$ROOT_DIR/scripts/wait-for-health.sh" "http://127.0.0.1:3000/health" 40
fi

case "$MODE" in
  smoke)
    CROSS_REPO_RUNTIME_MODE=external CROSS_REPO_COMPOSE_FILE="$COMPOSE_FILE" \
      node "$ROOT_DIR/scripts/cross-repo/run-enrollment-certificate-flow.js" happy-phy001
    ;;
  happy)
    CROSS_REPO_RUNTIME_MODE=external CROSS_REPO_COMPOSE_FILE="$COMPOSE_FILE" \
      node "$ROOT_DIR/scripts/cross-repo/run-cross-repo-group.js" happy
    ;;
  alternative)
    CROSS_REPO_RUNTIME_MODE=external CROSS_REPO_COMPOSE_FILE="$COMPOSE_FILE" \
      node "$ROOT_DIR/scripts/cross-repo/run-cross-repo-group.js" alternative
    ;;
  *)
    CROSS_REPO_RUNTIME_MODE=external CROSS_REPO_COMPOSE_FILE="$COMPOSE_FILE" \
      node "$ROOT_DIR/scripts/cross-repo/run-enrollment-certificate-flow.js" "$MODE"
    ;;
esac
