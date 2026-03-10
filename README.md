# Noted

A modern, real-time collaborative note-taking platform built with React and Hono. Think Notion meets Obsidian — with live collaboration baked in.

## Features

- **Real-time Collaboration** — Multiple users can edit the same document simultaneously with live cursor presence, powered by Yjs and Hocuspocus
- **Rich Text Editor** — Block-based editor with support for text formatting, headings, lists, code blocks, and more (BlockNote)
- **File Embeds** — Drag-and-drop or upload PDFs, DOCX files, and images directly into notes with inline previews
- **Workspaces & Organizations** — Create shared workspaces, invite team members, and manage access
- **Hierarchical Pages** — Organize notes in a tree structure with nested pages and drag-and-drop reordering
- **Tags** — Categorize and filter notes with a flexible tagging system
- **Tasks** — Track to-dos directly within your notes
- **Search** — Full-text search across all your notes
- **Daily Notes** — Calendar-based daily note view for journaling and planning
- **Dark Mode** — Light, dark, and system theme support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, shadcn/ui |
| **Backend** | Hono, Bun |
| **Database** | PostgreSQL, Drizzle ORM |
| **Auth** | Better Auth |
| **Collaboration** | Yjs, Hocuspocus |
| **Editor** | BlockNote |
| **Deployment** | Docker, Railway |

## Project Structure

```
noted/
├── apps/
│   ├── api/          # Hono API server + Hocuspocus collaboration server
│   └── web/          # React SPA with Vite
├── packages/
│   ├── db/           # Drizzle ORM schema and migrations
│   └── shared/       # Shared types and utilities
└── scripts/          # Setup, start, and stop scripts
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/NCompasBusiness/Noted.git
cd Noted

# Run the setup script (installs deps, starts PostgreSQL, creates .env)
./scripts/setup.sh

# Start all services
./scripts/start.sh
```

The app will be available at:
- **Web app**: http://localhost:5173
- **API server**: http://localhost:3001

### Manual Setup

```bash
# Install dependencies
bun install

# Start PostgreSQL with Docker
docker run -d \
  --name noted-postgres \
  -e POSTGRES_USER=noted \
  -e POSTGRES_PASSWORD=noted \
  -e POSTGRES_DB=noted \
  -p 5432:5432 \
  postgres:16

# Copy environment variables
cp .env.example .env

# Push the database schema
bun run db:push

# Start development servers
bun run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://noted:noted@localhost:5432/noted` |
| `BETTER_AUTH_SECRET` | Secret key for authentication (change in production) | — |
| `BETTER_AUTH_URL` | API server URL | `http://localhost:3001` |
| `APP_URL` | Frontend URL | `http://localhost:5173` |
| `UPLOAD_DIR` | Directory for file uploads | `./uploads` |
| `HOCUSPOCUS_PORT` | Internal collaboration server port | `3002` |

### Available Scripts

```bash
bun run dev          # Start all development servers
bun run dev:api      # Start API server only
bun run dev:web      # Start web app only
bun run build        # Build all packages
bun run db:generate  # Generate database migrations
bun run db:migrate   # Run database migrations
bun run db:push      # Push schema changes to database
bun run db:studio    # Open Drizzle Studio (database GUI)
```

## Deployment

Both apps include Dockerfiles and Railway configuration for easy deployment.

```bash
# Build and run API
docker build -f apps/api/Dockerfile -t noted-api .
docker run -p 3001:3001 --env-file .env noted-api

# Build and run Web
docker build -f apps/web/Dockerfile -t noted-web .
docker run -p 3000:3000 noted-web
```

See the [Railway documentation](https://docs.railway.com) for one-click deployment.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
