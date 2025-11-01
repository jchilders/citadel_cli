#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="citadel-nextjs-app-router"
CONTAINER_NAME="citadel-nextjs-app-router"
HOST_PORT="${NEXT_APP_ROUTER_PORT:-3000}"
CONTAINER_PORT=3000

echo "[build] Building Next.js App Router compatibility image (${IMAGE_NAME})..."
docker build \
  -f "${ROOT_DIR}/compatibility/nextjs-app-router/Dockerfile" \
  -t "${IMAGE_NAME}" \
  "${ROOT_DIR}"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[cleanup] Removing existing container ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

echo "[run] Starting container ${CONTAINER_NAME} on port ${HOST_PORT}..."
docker run -d --rm \
  --name "${CONTAINER_NAME}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "${IMAGE_NAME}"

cleanup() {
  echo "[cleanup] Stopping container ${CONTAINER_NAME}..."
  docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo -n "[wait] Waiting for the Next.js dev server to become ready"
for attempt in {1..60}; do
  if curl -fsS "http://127.0.0.1:${HOST_PORT}" >/dev/null; then
    echo ""
    echo "[wait] Dev server is ready at http://127.0.0.1:${HOST_PORT}"
    break
  fi
  if (( attempt == 60 )); then
    echo ""
    echo "[error] Timed out waiting for the Next.js dev server"
    exit 1
  fi
  printf "."
  sleep 1
done

echo "[test] Running Playwright E2E suite against the containerised app..."
PLAYWRIGHT_EXTERNAL=true \
PLAYWRIGHT_BASE_URL="http://127.0.0.1:${HOST_PORT}" \
PLAYWRIGHT_PORT="${HOST_PORT}" \
npm run test:e2e

echo "[done] Next.js App Router compatibility check completed."
