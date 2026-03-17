"""Wanderlore AI — FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGINS
from app.database import init_db
from app.routes import admin, auth, billing, campaigns, chat, email_auth, errors, feedback, friends, images, notifications, quality, stories, submissions, test


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle events."""
    # Startup: create tables in dev (Alembic handles production)
    await init_db()
    yield
    # Shutdown: nothing to clean up currently


app = FastAPI(
    title="Wanderlore AI API",
    description="Backend API for the Wanderlore AI D&D companion application.",
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Route routers
# ---------------------------------------------------------------------------
app.include_router(chat.router)                      # /api/chat — path already prefixed
app.include_router(test.router)                      # /api/test — path already prefixed
app.include_router(auth.router)                      # /auth/*   — path already prefixed
app.include_router(email_auth.router)              # /auth/verify-email, /auth/forgot-password, etc.
app.include_router(feedback.router)                  # /api/feedback — path already prefixed
app.include_router(images.router)                    # /api/generate-image — path already prefixed
app.include_router(campaigns.router, prefix="/api")  # → /api/campaigns/*
app.include_router(stories.router, prefix="/api")    # → /api/stories/*, /api/share/*
app.include_router(admin.router, prefix="/api")      # → /api/admin/*
app.include_router(errors.router)                     # /api/errors — path already prefixed
app.include_router(submissions.router)                # /api/submissions — path already prefixed
app.include_router(quality.router)                    # /api/quality/* — path already prefixed
app.include_router(billing.router)                    # /api/billing/* — path already prefixed
app.include_router(friends.router)                     # /api/friends/* — path already prefixed
app.include_router(notifications.router)               # /api/notifications/* — path already prefixed


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Serve dm-engine.md (DM system prompt)
# ---------------------------------------------------------------------------
_dm_engine_path = os.path.join(os.path.dirname(__file__), "..", "..", "dm-engine.md")


@app.get("/dm-engine.md")
async def dm_engine():
    """Serve the DM engine system prompt markdown file."""
    try:
        with open(_dm_engine_path, "r") as f:
            return PlainTextResponse(f.read(), media_type="text/markdown")
    except FileNotFoundError:
        return PlainTextResponse("", status_code=404)


# ---------------------------------------------------------------------------
# Static files (production: serve built frontend from dist/)
# ---------------------------------------------------------------------------
_dist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "dist")
if os.path.isdir(_dist_dir):
    app.mount("/", StaticFiles(directory=_dist_dir, html=True), name="static")

# ---------------------------------------------------------------------------
# Socket.IO — wrap FastAPI so both HTTP and WebSocket run on the same port
# ---------------------------------------------------------------------------
import socketio as socketio_lib
from app.socketio_manager import sio

socket_app = socketio_lib.ASGIApp(sio, other_asgi_app=app)
