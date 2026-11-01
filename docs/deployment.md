# Deployment Guide & Topology

## Service Mapping

```text
Frontend (Next.js)      → Vercel / Firebase Hosting
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
