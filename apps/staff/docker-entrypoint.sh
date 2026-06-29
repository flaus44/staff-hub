#!/bin/sh
set -e
cd /repo/apps/staff
export PAYLOAD_CONFIG_PATH=/repo/apps/staff/src/migrate.config.ts
echo "[entrypoint] Running Payload migrations..."
NODE_OPTIONS=--no-deprecation node /repo/node_modules/payload/bin.js migrate
echo "[entrypoint] Migrations complete."
cd /app
echo "[entrypoint] Starting server..."
exec node apps/staff/server.js
