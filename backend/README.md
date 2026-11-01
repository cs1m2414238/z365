# Backend (Spring Boot Modular Monolith)

Core API and business logic service for Z365. Built as a **modular monolith** to keep domain modules cleanly bounded while running as a single, easily deployable unit.

## 🧱 Modules Structure
- `modules/auth/` — User management, identity, tokens.
- `modules/project/` — Project workspaces, file metadata.
- `modules/execution/` — Execution orchestration (delegates to the separate `runner` service).
- `modules/agent/` — Client bridge to the AI `agent-service`.

## 🛠️ Tech Stack
- Java 17
- Spring Boot 3.3.x
- Spring Web, Validation, Actuator
- Lombok

## 🚀 Local Development
```bash
cd backend
mvn spring-boot:run
```
Runs at `http://localhost:8080`.

## 🌐 Deployment
- **Target**: Google Cloud Run (Containerized JVM image)
- Scalable, stateless container deployment.
