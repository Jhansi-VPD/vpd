import os

# Render port binding
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# ASGI worker for FastAPI (prevents TypeError: FastAPI.__call__() missing 'send')
worker_class = "uvicorn.workers.UvicornWorker"
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))

# Timeouts
timeout = 120
graceful_timeout = 60
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"

