# Social Media Organiser

Full-stack playground for logging content ideas and tracking their progress. The repository contains a Fastify + Prisma backend (TypeScript) and a Vite + React frontend (TypeScript).

## Stack Overview

- **Backend** (`backend/`)
  - Fastify 5 handles HTTP (`src/server.ts`) with a health probe and modular route registration.
  - Prisma 7 models a SQLite database (see `prisma/schema.prisma`) with `Idea`, `Platform`, and `IdeaStatus`.
  - Environment-aware configuration lives in `prisma.config.ts`, which loads `.env` and passes the datasource URL to Prisma.
  - Routes in `src/routes/ideas.ts` expose `POST /ideas` (create idea) and `GET /ideas` (list/filter by platform/status). Both use a shared Prisma client exported from `src/prisma.ts` (implement this before running the API).
  - `DATABASE_URL` defaults to `file:./dev.db` (SQLite file stored in `backend/dev.db`). Update `backend/.env` if you need another path/adapter.

- **Frontend** (`frontend/`)
  - Vite 7 + React 19 + TypeScript, using the default Vite React template for now.
  - Entry point (`src/main.tsx`) renders `App.tsx`, which still contains the starter counter UI. Replace this with API calls to your Fastify routes as you evolve the UI.
  - ESLint 9 is configured via `eslint.config.js`; TypeScript configs live in `tsconfig*.json`.

## Prerequisites

- Node.js 20+
- npm 10+
- SQLite bundled with Prisma (no manual install required).

## Initial Setup

```bash
# Install backend deps
cd backend
npm install

# Install frontend deps
cd ../frontend
npm install
```

Generate the database and Prisma client (run inside `backend/`):

```bash
npx prisma migrate dev --name init   # creates dev.db based on schema.prisma
npx prisma generate                  # regenerate client after schema changes
```

Implement the Prisma client helper if it is still empty:

```ts
// backend/src/prisma.ts
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

## Development Workflow

### Backend

```bash
cd backend
npx ts-node-dev --respawn src/server.ts
```

- Fastify listens on `http://localhost:3003` (adjust in `src/server.ts`).
- Routes:
  - `GET /health` → `{ status: 'ok' }`
  - `GET /ideas?platform=BOOKTOK&status=PLANNED` → filtered list ordered by `createdAt desc`
  - `POST /ideas` with JSON body `{ "title": "...", "description": "...?", "platform": "BOOKTOK" }` → persists and returns the record
- Update `.env` then restart the server (or rely on `ts-node-dev` hot reload) when changing connection info.

### Frontend

```bash
cd frontend
npm run dev
```

- Vite serves the app on `http://localhost:5173` by default.
- Configure API calls (e.g., via `fetch`) to hit `http://localhost:3003`. Consider adding a Vite proxy in `vite.config.ts` if you need to avoid CORS in development.

### Quick start (both servers)

From the repository root you can launch backend and frontend together:

```bash
./scripts/dev.sh
```

The script installs missing dependencies and runs both dev servers in parallel. Stop them anytime with `Ctrl+C`.

### Linting & Builds

- Frontend lint: `cd frontend && npm run lint`
- Frontend build: `cd frontend && npm run build` (outputs to `frontend/dist`)
- Backend TypeScript build (optional once you add a tsconfig build script): `cd backend && npx tsc`

## Production Notes

1. Run `npm run build` in `frontend` and serve `dist/` via your choice of static host.
2. Compile the backend (`npx tsc`) and run Fastify with `node dist/server.js`, ensuring `.env` is available or provide `DATABASE_URL` via your process manager.
3. For non-SQLite databases, update `DATABASE_URL` accordingly and tweak Prisma schema/provider before running migrations.

## Testing Ideas

- Seed data via Prisma (`npx prisma db seed`) once you add a seed script, then exercise the REST routes with `curl` or a tool like Insomnia.
- Extend the frontend to call the backend APIs, then add integration tests (React Testing Library / Playwright) as the UI grows.

---

Feel free to extend this README as the project evolves (additional routes, deployment steps, CI/CD pipelines, etc.).
