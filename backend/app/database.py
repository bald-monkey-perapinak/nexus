from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker, AsyncEngine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Integer, BigInteger, JSON, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from typing import Optional
import uuid
import structlog
from app.config import settings

log = structlog.get_logger()

# Engine is created lazily on first use so that a missing or malformed
# DATABASE_URL at import time does not crash the process before uvicorn
# has a chance to bind and serve health-check requests.
_engine: Optional[AsyncEngine] = None
_session_maker: Optional[async_sessionmaker] = None


def _get_engine() -> AsyncEngine:
    global _engine, _session_maker
    if _engine is None:
        try:
            _engine = create_async_engine(
                settings.async_database_url,
                echo=settings.DEBUG,
                pool_pre_ping=True,
            )
            _session_maker = async_sessionmaker(_engine, expire_on_commit=False)
            log.info("Database engine created", url=settings.async_database_url.split("@")[-1])
        except Exception as exc:
            log.error("Failed to create database engine", error=str(exc))
            raise
    return _engine


def _get_session_maker() -> async_sessionmaker:
    _get_engine()  # ensure engine + session_maker are initialised
    return _session_maker


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    data = Column(JSON, nullable=False, default=dict)
    completeness = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), onupdate=func.now())


class GenerationSession(Base):
    __tablename__ = "generation_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    profile_snapshot = Column(JSON, nullable=False, default=dict)
    idea_candidates = Column(JSON, nullable=True)
    contradictions = Column(JSON, nullable=True, default=list)
    generation_warnings = Column(JSON, nullable=True, default=list)
    selected_idea_id = Column(String(50), nullable=True)
    # pending | generating | done | error
    status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), onupdate=func.now())


class FinancialModel(Base):
    __tablename__ = "financial_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    idea_id = Column(String(50), nullable=False)
    model_data = Column(JSON, nullable=False, default=dict)
    user_adjustments = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        server_default=func.now(), onupdate=func.now())


class WeeklyCheckin(Base):
    __tablename__ = "weekly_checkins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=True)
    week_number = Column(Integer, nullable=False)
    checkin_data = Column(JSON, nullable=False, default=dict)
    agent_response = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


async def get_session() -> AsyncSession:
    async with _get_session_maker()() as session:
        yield session


async def init_db():
    async with _get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
