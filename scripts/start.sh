#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Noted — Starting ==="

# Ensure PostgreSQL is running
if ! docker ps --format '{{.Names}}' | grep -q '^noted-postgres$'; then
  echo "Starting PostgreSQL..."
  docker start noted-postgres 2>/dev/null || {
    echo "Error: PostgreSQL container not found. Run ./scripts/setup.sh first."
    exit 1
  }
  sleep 2
fi

# Kill any existing processes on our ports
lsof -ti:3001 -ti:3002 -ti:5173 | xargs kill -9 2>/dev/null || true

# Start API server
echo "Starting API server on port 3001..."
cd "$ROOT_DIR"
bun run dev:api &
API_PID=$!

# Start web dev server
echo "Starting web dev server on port 5173..."
cd "$ROOT_DIR"
bun run dev:web &
WEB_PID=$!

# Save PIDs for stop script
echo "$API_PID" > "$ROOT_DIR/.pids"
echo "$WEB_PID" >> "$ROOT_DIR/.pids"

echo ""
echo "=== Servers started ==="
echo "  Web:  http://localhost:5173"
echo "  API:  http://localhost:3001"
echo "  WS:   ws://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all servers."

# Wait for any to exit
trap "kill $API_PID $WEB_PID 2>/dev/null; exit" INT TERM
wait
