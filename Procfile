web: gunicorn app.main:app --chdir backend -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-10000} --timeout 120 --graceful-timeout 60
