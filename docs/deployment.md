# Deployment Guide & Topology

## Repository build locations

- Web source: `apps/web`; shared workspace models: `packages/contracts`.
- Use Node 26.13.0, then run `npm ci` and `npm run build` from the repository root. Vite writes the static build to `apps/web/dist`; `npm start` previews it on port 4173.
- Web hosting must include the repository workspace so `@z365/contracts` is available during installation and builds.
- Core API source and Maven wrapper: `apps/core-api`.
- Python service build contexts: `apps/agent-service` and `apps/runner`.
- Local PostgreSQL Compose file: `infra/docker-compose.yml`.

The following topology describes intended deployment targets. This repository change does not publish services or provision cloud resources.

For React Router, serve `apps/web/dist` with an `index.html` fallback for client routes such as `/u/username`. Route `/api` to Spring Boot before that fallback, or set `VITE_API_BASE_URL` at build time. Production defaults to API mode; `/?source=demo` explicitly selects the illustrative preview. `VITE_*` environment variables are public and must not contain secrets.

## Service Mapping

```text
Frontend (React/Vite)   → Static web hosting / Vercel / Firebase Hosting
Backend (Spring Boot)   → Google Cloud Run (Container)
Agent Service (FastAPI) → Google Cloud Run (Container)
Runner (Worker Sandbox) → Google Cloud Compute Engine VM / GKE Node Pool
PostgreSQL              → Google Cloud SQL
Redis                   → Upstash / Google Cloud Memorystore
```

---

## Phased Rollout
1. **Phase 1 (MVP)**:
   - Frontend on Vercel
   - Backend on Cloud Run (1 instance min-instances=0)
   - Agent on Cloud Run
   - Runner on a dedicated single Linux VM with Docker sandbox
   - Managed PostgreSQL
2. **Phase 2 (Scale)**:
   - Introduce Redis caching & session storage
   - Move Runner onto GKE with gVisor / Firecracker sandboxing
   - Add Google Cloud Pub/Sub for asynchronous execution queueing

