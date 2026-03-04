#!/bin/bash
set -e

echo "=== Noted — Setup ==="

# Check dependencies
command -v bun >/dev/null 2>&1 || { echo "Error: bun is required. Install from https://bun.sh"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: docker is required."; exit 1; }

# Install dependencies
echo "Installing dependencies..."
cd "$(dirname "$0")/.."
bun install

# Start PostgreSQL if not running
if ! docker ps --format '{{.Names}}' | grep -q '^noted-postgres$'; then
  if docker ps -a --format '{{.Names}}' | grep -q '^noted-postgres$'; then
    echo "Starting existing PostgreSQL container..."
    docker start noted-postgres
  else
    echo "Creating PostgreSQL container..."
    docker run -d \
      --name noted-postgres \
      -e POSTGRES_USER=noted \
      -e POSTGRES_PASSWORD=noted \
      -e POSTGRES_DB=noted \
      -p 5432:5432 \
      postgres:17-alpine
  fi
  echo "Waiting for PostgreSQL to be ready..."
  sleep 3
else
  echo "PostgreSQL already running."
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i '' 's|postgresql://user:password@|postgresql://noted:noted@|' .env 2>/dev/null || true
  echo "Created .env from .env.example"
fi

# Push schema to database
echo "Pushing database schema..."
cd packages/db
DATABASE_URL="postgresql://noted:noted@localhost:5432/noted" bunx drizzle-kit push

echo ""
echo "=== Setup complete! ==="
echo "Run ./scripts/start.sh to start the dev servers."
