FROM oven/bun:1 AS build
WORKDIR /app

# Install dependencies
COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN bun install

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

# Build args for Vite env vars
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the web app
RUN cd apps/web && bunx vite build

# Serve with a lightweight static server
FROM node:22-alpine AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/apps/web/dist ./dist

ENV PORT=3000
EXPOSE 3000

CMD ["serve", "dist", "-s", "-l", "3000"]
