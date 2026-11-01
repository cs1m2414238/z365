# Architectural Decision: Monorepo + Modular Monolith + Distributed Services

## 1. Summary
- **Code Organization**: **Monorepo**
- **Application Core**: **Modular Monolith** (Spring Boot)
- **Execution & AI**: **Distributed Services** (`runner` and `agent-service`)
- **Premature 20 Microservices**: Avoided ❌

---

## 2. Why Monorepo?
1. **Atomic Commits**: Features spanning Frontend, Backend API, and Agent Service can be modified in a single PR.
2. **Shared Contracts**: Contracts in `shared/` are immediately accessible to both Java backend and Python services without private npm/maven registries.
3. **Single CI/CD Configuration**: Centralized linting, testing, and unified workflows.
4. **Developer Velocity**: No overhead of navigating across 5-10 separate GitHub repositories.

---

## 3. Why Modular Monolith Core?
Rather than splitting the business logic into separate microservices (`auth-service`, `project-service`, `billing-service`) on Day 1:
- The **Spring Boot** application contains clean package boundaries (`modules/auth`, `modules/project`, `modules/execution`, etc.).
- Keeps network hops at zero for core domain interactions.
- Avoids distributed transaction complexities (Sagas, 2PC).
- When a domain genuinely needs its own lifecycle or scale factor, it can be extracted cleanly because module boundaries were enforced from the beginning.

---

## 4. Why Distributed for `agent-service` and `runner`?
1. **Agent Service (Python / FastAPI)**:
   - Python is the primary ecosystem for LLM tooling, LangChain/LlamaIndex, PyTorch, and AI libraries.
   - Running this separately allows scaling independently on GPU/CPU Cloud Run instances without affecting the Java JVM.
2. **Runner (Code Execution Sandbox)**:
   - **Critical Security Boundary**: Executing untrusted student/user code inside the main Spring Boot process would be fatal to stability and security.
   - The runner runs on hardened VMs, Docker-in-Docker, or gVisor sandbox runtimes with hard memory/CPU limits and zero access to database credentials.
