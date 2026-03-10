# Contributing to Noted

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Noted.git`
3. Run `./scripts/setup.sh` to install dependencies and set up the database
4. Create a branch: `git checkout -b my-feature`
5. Make your changes
6. Run `bun run build` to verify everything compiles
7. Commit your changes with a clear message
8. Push and open a pull request

## Project Structure

- `apps/api/` — Backend API server (Hono + Bun)
- `apps/web/` — Frontend React app (Vite + Tailwind)
- `packages/db/` — Database schema and migrations (Drizzle ORM)
- `packages/shared/` — Shared types and utilities

## Guidelines

- Keep pull requests focused on a single change
- Write clear commit messages describing *what* and *why*
- Follow the existing code style and patterns
- Add or update types in `packages/shared` for any new data structures
- Test your changes locally before submitting

## Database Changes

If your change involves the database schema:

1. Modify the schema files in `packages/db/src/schema/`
2. Run `bun run db:generate` to create a migration
3. Run `bun run db:push` to apply changes locally
4. Include the generated migration in your PR

## Reporting Issues

- Use [GitHub Issues](https://github.com/NCompasBusiness/Noted/issues) to report bugs or suggest features
- Include steps to reproduce for bug reports
- Check existing issues before opening a new one

## Code of Conduct

Please be respectful and constructive. See our [Code of Conduct](CODE_OF_CONDUCT.md).
