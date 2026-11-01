# Runner Service (Execution Workers)

Execution worker responsible for executing user and student code in an isolated sandbox.

## 🛡️ Security Rationale
**Running untrusted code directly inside the Spring Boot API process or main host is a severe security hazard.**
The runner service runs as an independent, sandboxed service to guarantee:
- Process isolation
- Resource quotas (CPU, memory, wall-clock time limit)
- Network isolation (preventing unauthorized outbound connections)

## 🛠️ Tech Stack & Production Targets
- **Runtime**: Python / Linux worker
- **Production Isolation**: gVisor (`runsc`), Firecracker microVMs, or hardened Docker containers on a dedicated VM or GKE node pool.

## 🚀 Local Development
```bash
cd runner
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate
pip install -r requirements.txt
python worker.py
```
Runs at `http://localhost:8081`.
