from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import subprocess
import tempfile
import os

app = FastAPI(
    title="Z365 Code Runner Service",
    description="Isolated execution worker for running user/student code",
    version="0.1.0"
)

class ExecuteRequest(BaseModel):
    language: str
    code: str
    timeout_seconds: Optional[int] = 5

class ExecuteResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float

@app.get("/health")
def health():
    return {"status": "ok", "service": "runner-service"}

@app.post("/api/v1/execute", response_model=ExecuteResponse)
def execute_code(request: ExecuteRequest):
    """
    Executes code in a sandbox environment.
    NOTE: In production, run inside gVisor, Firecracker microVM, or isolated Docker container.
    """
    if request.language.lower() != "python":
        raise HTTPException(status_code=400, detail=f"Unsupported language: {request.language}")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(request.code)
        temp_path = f.name

    try:
        proc = subprocess.run(
            ["python", temp_path],
            capture_output=True,
            text=True,
            timeout=request.timeout_seconds
        )
        return ExecuteResponse(
            stdout=proc.stdout,
            stderr=proc.stderr,
            exit_code=proc.returncode,
            execution_time_ms=0.0
        )
    except subprocess.TimeoutExpired:
        return ExecuteResponse(
            stdout="",
            stderr="Execution timed out.",
            exit_code=124,
            execution_time_ms=float(request.timeout_seconds * 1000)
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("worker:app", host="0.0.0.0", port=8081, reload=True)
