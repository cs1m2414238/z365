# Z365

An engineering learning platform that brings coding, debugging, projects, and AI agents into one profile.

## Repository

```text
Z365/
├── apps/
│   ├── web/                # React, TypeScript, Vite
│   │   ├── public/         # Local images and application icon
│   │   ├── src/App.tsx     # React Router routes
│   │   ├── src/styles/     # Preserved design, glass effects, Light and Dark modes
│   │   ├── src/components/ # Feature components and reusable UI
│   │   ├── src/lib/        # Validated API client, demo fixtures, calendar
│   │   └── tests/          # Activity calendar and streak tests
│   ├── core-api/           # Java 21, Spring Boot 4, Spring Modulith
│   ├── agent-service/      # Python / FastAPI service
│   └── runner/             # Isolated execution worker scaffold
├── packages/
│   └── contracts/          # Shared TypeScript models and API envelope
├── infra/                  # Local PostgreSQL Docker Compose configuration
├── docs/
│   ├── architecture.md
│   ├── development.md
│   ├── deployment.md
│   ├── frontend-api-contract.md
│   └── plans/coding-profile.md
├── .github/workflows/      # Frontend and backend checks
└── package.json            # npm workspaces and root commands
```

The former `frontend/` now lives in `apps/web/`; `shared/` now lives in `packages/contracts/`. All runnable applications live under `apps/`. The existing core API remains the modular monolith; profile features belong there.

## Start the complete local application on Windows

With Docker Desktop running, Node.js 26 and JDK 21 or newer installed:

```powershell
npm run dev:local
```

This starts persistent PostgreSQL, builds and starts the API, and reuses or starts Vite. It selects an installed compatible JDK, writes logs under ignored `.tools/local-logs`, and creates a local `.env` with a random database password if missing. It never seeds user accounts.

Open [Create your account](http://127.0.0.1:5173/register) and enter your own name, username, email and password (12 characters minimum, 72 UTF-8 bytes maximum). Registration signs you into your private profile with zero recorded activity. Demo data remains available separately at `/?source=demo`. Social sign-in appears only when an actual provider endpoint is configured.

The local database on this machine uses port 5433 because an existing PostgreSQL installation uses 5432. Run `npm run db:down` to stop the project database without removing its volume. API and web process logs are under `.tools/local-logs`; the command prints the active URLs.

## Run the frontend

Requires Node.js 26 LTS (pinned to 26.13.0) and npm. From the repository root:

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The profile is available at `/` and `/profile`. The sidebar opens `/home`, `/learn`, `/practice`, `/projects`, `/labs`, and `/agents`.

The top-bar appearance button switches between Light and Dark and saves your preference. The current machine also has a portable Node 26 runtime in ignored `.tools/node-v26.13.0-win-x64`; on PowerShell you can select it for this session with `$env:PATH = "$PWD\.tools\node-v26.13.0-win-x64;$env:PATH"`.

The profile dashboard uses the Spring Boot account and profile APIs by default. Open the account menu to register or sign in, then edit your profile or connect Codeforces and GitHub. The explicit preview is available at `/?source=demo`. See [the profile foundation and API inventory](docs/profile-foundation.md) and [the repository audit](docs/repository-audit.md).

```sh
npm test           # Calendar, API contract, validation, and cache tests
npm run typecheck  # Strict TypeScript checks
npm run build      # Production Vite build
npm start          # Preview the production build on port 4173
```

See [local development](docs/development.md), [architecture](docs/architecture.md), and the [coding profile roadmap](docs/plans/coding-profile.md).

## Local database and core API

Copy `.env.example` to `.env` and adjust the local database settings, then:

```sh
npm run db:up
cd apps/core-api
./mvnw spring-boot:run
```

Use `mvnw.cmd` on Windows and set `JAVA_HOME` to JDK 21. The API runs on port 8080. See [the core API guide](apps/core-api/README.md).
