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
    """Create all tables. Use for development; prefer Alembic for production."""
    async with engine.begin() as conn:
        from app import models  # noqa: F401 — ensure models are registered
        await conn.run_sync(Base.metadata.create_all)
