# Local development

## Prerequisites

- Node.js 26 LTS for the frontend and tests. The project and CI pin 26.13.0.
- JDK 21 for the core API. Set `JAVA_HOME`; the machine's default Java may be older.
- Docker for local PostgreSQL and container-backed API tests.
- Python 3.11+ for the agent and runner scaffolds.

## One-command Windows startup

Run `npm run dev:local` with Docker Desktop running. The script finds a compatible installed JDK, creates local database credentials if `.env` is missing, starts persistent PostgreSQL, builds the API, and starts or reuses the web server. It does not seed accounts or remove existing data. Logs are stored in `.tools/local-logs`. Keep Docker Desktop running while using the application.

Open `http://127.0.0.1:5173/register` to create your own account. Supply your own password in the browser. The account starts private, with no fabricated achievements, ratings or activity. Only Light and Dark are available; Dark uses the Focus palette.

## Web application

Run `npm install` and `npm run dev` from the repository root. Root npm workspaces link `apps/web` with `packages/contracts`. One root `package-lock.json` controls the JavaScript dependency graph.

The local URL is `http://127.0.0.1:5173`. First-time visitors see sign-in, with registration and an explicit demo option. The preserved glass coding profile uses Z365 Spectrum Light and Dark modes. Run `npm test`, `npm run typecheck`, and `npm run build` before opening a frontend change for review.

For production smoke testing, run `npm run build`, then `npm start`; the preview URL is `http://127.0.0.1:4173`. The default profile route loads the signed-in account. Use `/?source=demo` for the labeled preview or `/u/your_username` for a public profile. Configure `apps/web/.env.local` from its `.env.example` when the API runs on a different port. The account and platform flows are documented in [the profile foundation guide](profile-foundation.md).

## Database

Copy the repository's `.env.example` to `.env`; these files contain Docker Compose variables. `npm run db:up` starts the PostgreSQL dependency using `infra/docker-compose.yml`. `npm run db:down` stops it without removing the data volume.

## Core API

Set `JAVA_HOME` to JDK 21, then run `mvnw.cmd spring-boot:run` from `apps/core-api` on Windows, or `./mvnw spring-boot:run` elsewhere. The `.mvn` wrapper files remain with the Maven project. The API imports the root `.env` and maps Compose's `POSTGRES_*` settings; explicit `DB_*` environment settings override them. Further settings are documented in `apps/core-api/.env.example`.

The backend workflow still targets `apps/core-api`; the frontend workflow targets the root npm workspace. Java/Python dependency managers remain independent of npm.

## Other services

- Agent service: reserved scaffold in `apps/agent-service`; `main.py` is empty and does not start an API.
- Runner: reserved scaffold in `apps/runner`; `worker.py` is empty. No code execution or sandbox service is implemented.

## Where new work goes

- Web routes: `apps/web/src/App.tsx`.
- Approved CSS and additive themes: `apps/web/src/styles/`.
- Axios and Zod integration contracts: `apps/web/src/lib/api/`.
- Reusable UI: `apps/web/src/components/ui/`.
- Feature components: `apps/web/src/components/`.
- Frontend data and calculations: `apps/web/src/lib/`.
- Shared TypeScript models and future generated API contracts: `packages/contracts/`.
- Core business features: modules under `apps/core-api/src/main/java/com/z365/coreapi/`.
- Database migrations: `apps/core-api/src/main/resources/db/migration/`.
- Planning and architectural decisions: `docs/`.

Avoid recreating top-level `frontend/`, `backend/`, or `shared/` directories. Runnable services belong in `apps/`; cross-application packages belong in `packages/`.
