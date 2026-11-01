FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as non-privileged user for basic containment
RUN useradd -m sandboxuser
USER sandboxuser

EXPOSE 8081

CMD ["uvicorn", "worker:app", "--host", "0.0.0.0", "--port", "8081"]
