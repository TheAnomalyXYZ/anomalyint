#!/bin/bash
# Railway provides PORT environment variable
PORT=${PORT:-8080}
echo "============================================"
echo "Starting uvicorn on port $PORT"
echo "HOST: 0.0.0.0"
echo "PORT env var: ${PORT}"
echo "============================================"
exec uvicorn main:app --host 0.0.0.0 --port $PORT --log-level debug
