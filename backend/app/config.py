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

    # Authentication
    ADMIN_EMAILS: str = ""

    # AI — Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MODEL_FAST: str = "llama-3.1-8b-instant"

    # JWT
    JWT_SECRET: str = "nexus-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 72

    @property
    def admin_ids(self) -> list[str]:
        if not self.ADMIN_EMAILS:
            return []
        return [x.strip() for x in self.ADMIN_EMAILS.split(",") if x.strip()]

    # Tavily web search
    TAVILY_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
