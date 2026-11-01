# Infrastructure & Deployment

Contains deployment manifests, container definitions, and local orchestrations.

## 🐳 Local Development Orchestration
To spin up all backend dependencies (PostgreSQL, Redis, Agent Service, Runner):

```bash
docker compose up -d
```

## 🌐 Target Cloud Topology
- **Frontend**: Vercel / Firebase Hosting
- **Backend (Modular Monolith)**: Google Cloud Run
- **Agent Service (Python/FastAPI)**: Google Cloud Run
- **Runner (Sandboxed Workers)**: Dedicated VM / GKE Node Pool
- **Database**: Google Cloud SQL (PostgreSQL)

