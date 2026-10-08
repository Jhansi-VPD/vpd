import os
import sys

# Ensure backend directory is in python path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Render port binding
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# ASGI worker for FastAPI
worker_class = "uvicorn.workers.UvicornWorker"
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))

# Timeouts
timeout = 120
graceful_timeout = 60
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
