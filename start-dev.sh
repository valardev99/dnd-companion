#!/bin/bash
# Start both backend and frontend for local development.
# Usage: ./start-dev.sh
# Press Ctrl+C to stop both servers.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Ensure Node is available (nvm users)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# Backend — FastAPI with SQLite for local dev
echo "Starting backend on :8000..."
DATABASE_URL="sqlite+aiosqlite:///./dev.db" \
  python3 -m uvicorn server.app.main:app \
  --host 0.0.0.0 --port 8000 --reload \
  --reload-dir "$SCRIPT_DIR/server" &
BACKEND_PID=$!

# Frontend — Vite dev server
echo "Starting frontend on :5173..."
cd "$SCRIPT_DIR/client"
npx vite --port 5173 &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Press Ctrl+C to stop both servers"
echo "═══════════════════════════════════════"
echo ""

# Wait for either to exit
wait -n $BACKEND_PID $FRONTEND_PID
