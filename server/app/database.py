"""Async SQLAlchemy engine, session factory, and database utilities."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.config import DATABASE_URL

# SQLite doesn't support pool_size/max_overflow — only apply for Postgres
_engine_kwargs = {
    "echo": False,
}
if DATABASE_URL.startswith("sqlite"):
    # SQLite needs check_same_thread=False for async
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 10

engine = create_async_engine(DATABASE_URL, **_engine_kwargs)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables and add any missing columns for safe schema evolution."""
    async with engine.begin() as conn:
        from app import models  # noqa: F401 — ensure models are registered
        await conn.run_sync(Base.metadata.create_all)

    # Add missing columns that create_all doesn't handle on existing tables
    await _safe_migrate()


async def _safe_migrate() -> None:
    """Add columns that may be missing from existing tables (non-destructive).

    IMPORTANT: In PostgreSQL, a failed ALTER TABLE poisons the entire
    transaction — all subsequent statements silently fail.  We must
    either use SAVEPOINTs (begin_nested) or run each migration in its
    own top-level transaction.  We use separate transactions here for
    maximum compatibility.
    """
    import logging
    from sqlalchemy import text

    logger = logging.getLogger(__name__)
    is_pg = not DATABASE_URL.startswith("sqlite")

    # ------------------------------------------------------------------
    # Defensive migrations — add columns that may be missing on tables
    # that existed before the column was introduced in the model.
    #
    # ADD COLUMN is idempotent via the per-migration try/except: if the
    # column already exists, the ALTER fails, we swallow it, and move on.
    # Err on the side of listing MORE columns than necessary — duplicates
    # are harmless.
    # ------------------------------------------------------------------
    migrations = [
        # (table, column, SQL type for Postgres, SQL type for SQLite)

        # ---- users --------------------------------------------------
        ("users", "email_verified", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),
        ("users", "friend_code", "VARCHAR(8)", "VARCHAR(8)"),
        ("users", "display_name", "VARCHAR(100)", "VARCHAR(100)"),
        ("users", "avatar_url", "VARCHAR(500)", "VARCHAR(500)"),
        ("users", "is_admin", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),

        # ---- campaigns ----------------------------------------------
        ("campaigns", "is_public", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),
        ("campaigns", "is_multiplayer", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),
        ("campaigns", "max_players", "INTEGER NOT NULL DEFAULT 1", "INTEGER NOT NULL DEFAULT 1"),
        ("campaigns", "status", "VARCHAR(20) NOT NULL DEFAULT 'active'", "VARCHAR(20) NOT NULL DEFAULT 'active'"),
        ("campaigns", "chat_history", "JSONB", "TEXT"),
        ("campaigns", "session_summary", "TEXT", "TEXT"),
        ("campaigns", "thumbnail_url", "VARCHAR(500)", "VARCHAR(500)"),
        ("campaigns", "last_played_at", "TIMESTAMP", "TIMESTAMP"),
        ("campaigns", "share_slug", "VARCHAR(100)", "VARCHAR(100)"),

        # ---- stories ------------------------------------------------
        ("stories", "slug", "VARCHAR(200)", "VARCHAR(200)"),
        ("stories", "excerpt", "VARCHAR(500)", "VARCHAR(500)"),
        ("stories", "author_display_name", "VARCHAR(150)", "VARCHAR(150)"),
        ("stories", "character_name", "VARCHAR(150)", "VARCHAR(150)"),
        ("stories", "world_name", "VARCHAR(255)", "VARCHAR(255)"),
        ("stories", "recap_text", "TEXT", "TEXT"),
        ("stories", "likes", "INTEGER NOT NULL DEFAULT 0", "INTEGER NOT NULL DEFAULT 0"),
        ("stories", "is_public", "BOOLEAN NOT NULL DEFAULT TRUE", "BOOLEAN NOT NULL DEFAULT 1"),

        # ---- subscriptions ------------------------------------------
        ("subscriptions", "stripe_customer_id", "VARCHAR(255)", "VARCHAR(255)"),
        ("subscriptions", "stripe_subscription_id", "VARCHAR(255)", "VARCHAR(255)"),
        ("subscriptions", "current_period_start", "TIMESTAMP", "TIMESTAMP"),
        ("subscriptions", "current_period_end", "TIMESTAMP", "TIMESTAMP"),
        ("subscriptions", "cancel_at_period_end", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),

        # ---- notifications (likely new table — belt & suspenders) ---
        ("notifications", "data", "JSONB", "TEXT"),
        ("notifications", "read", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0"),

        # ---- feedback -----------------------------------------------
        ("feedback", "category", "VARCHAR(50)", "VARCHAR(50)"),
        ("feedback", "rating", "INTEGER", "INTEGER"),
        ("feedback", "tags", "JSONB", "TEXT"),
        ("feedback", "status", "VARCHAR(50) NOT NULL DEFAULT 'new'", "VARCHAR(50) NOT NULL DEFAULT 'new'"),
    ]

    for table, column, pg_type, sqlite_type in migrations:
        col_type = pg_type if is_pg else sqlite_type
        # Each migration gets its OWN transaction so a failure doesn't
        # poison subsequent statements (critical for PostgreSQL).
        async with engine.begin() as conn:
            try:
                await conn.execute(text(
                    f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
                ))
                logger.info("Added column %s.%s", table, column)
            except Exception:
                # Column already exists — expected, skip silently
                pass
