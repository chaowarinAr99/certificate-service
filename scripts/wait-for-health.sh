#!/usr/bin/env bash

set -euo pipefail

URL="${1:?health URL is required}"
TIMEOUT_SECONDS="${2:-30}"

for ((i=1; i<=TIMEOUT_SECONDS; i++)); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for $URL" >&2
exit 1
