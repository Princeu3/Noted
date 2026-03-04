#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Noted — Stopping ==="

# Kill saved PIDs
if [ -f "$ROOT_DIR/.pids" ]; then
  while read -r pid; do
    kill "$pid" 2>/dev/null && echo "Killed process $pid"
  done < "$ROOT_DIR/.pids"
  rm "$ROOT_DIR/.pids"
fi

# Kill any processes on our ports
lsof -ti:3001 -ti:3002 -ti:5173 | xargs kill -9 2>/dev/null || true

echo "All servers stopped."
echo ""
echo "To also stop PostgreSQL: docker stop noted-postgres"
