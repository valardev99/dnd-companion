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
    """Add columns that may be missing from existing tables (non-destructive)."""
    import logging
    from sqlalchemy import text

    logger = logging.getLogger(__name__)
    is_pg = not DATABASE_URL.startswith("sqlite")

    migrations = [
        # (table, column, SQL type for Postgres, SQL type for SQLite, default)
        ("users", "email_verified", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0", None),
        ("users", "friend_code", "VARCHAR(8)", "VARCHAR(8)", None),
        ("users", "display_name", "VARCHAR(100)", "VARCHAR(100)", None),
        ("users", "avatar_url", "VARCHAR(500)", "VARCHAR(500)", None),
        ("users", "is_admin", "BOOLEAN NOT NULL DEFAULT FALSE", "BOOLEAN NOT NULL DEFAULT 0", None),
    ]

    async with engine.begin() as conn:
        for table, column, pg_type, sqlite_type, default in migrations:
            col_type = pg_type if is_pg else sqlite_type
            try:
                await conn.execute(text(
                    f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
                ))
                logger.info("Added column %s.%s", table, column)
            except Exception:
                # Column already exists — expected, skip silently
                pass
