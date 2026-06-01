from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Nexus"
    DEBUG: bool = False
    SECRET_KEY: str = "nexus-dev-secret-change-in-production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/nexus"
    REDIS_URL: str = "redis://redis:6379"

    @property
    def async_database_url(self) -> str:
        """Return DATABASE_URL with the asyncpg driver, rewriting plain
        postgresql:// or postgres:// URLs that Railway injects at runtime."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        return url

    # Authentication
    ADMIN_EMAILS: str = ""

    # AI — Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MODEL_FAST: str = "llama-3.1-8b-instant"

    # AI — Gemini
    GEMINI_API_KEY: str = ""

    # AI — OpenRouter
    OPENROUTER_API_KEY: str = ""

    # JWT
    JWT_SECRET: str = "nexus-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 72

    @property
    def admin_ids(self) -> list[str]:
        if not self.ADMIN_EMAILS:
            return []
        return [x.strip() for x in self.ADMIN_EMAILS.split(",") if x.strip()]

    # Frontend
    FRONTEND_URL: str = ""

    # Tavily web search
    TAVILY_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
