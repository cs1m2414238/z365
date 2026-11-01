# Agent Service (Python / FastAPI)

Dedicated microservice for AI agents, prompt management, LLM interactions, and automated code review workflows.

## 🛠️ Tech Stack
- Python 3.11+
- FastAPI & Pydantic
- Uvicorn
- HTTPX for async outbound requests

## 🚀 Local Development
```bash
cd agent-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate
pip install -r requirements.txt
python main.py
```
Runs at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

## 🌐 Deployment
- **Target**: Google Cloud Run
- Scalable on demand (can scale to zero when idle).

