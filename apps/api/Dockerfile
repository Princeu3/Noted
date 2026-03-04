FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock bunfig.toml ./
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN bun install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/api/ apps/api/

# Push DB schema on start, then run the API
ENV PORT=3001
EXPOSE 3001

CMD ["sh", "-c", "cd packages/db && bunx drizzle-kit push && cd /app/apps/api && bun run src/index.ts"]
