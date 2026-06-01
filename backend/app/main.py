from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db, _get_engine
from app.routers import auth, profile, ideas, financial, validation, roadmap
from app.config import settings
from app.llm_router import init_router
import asyncio
import structlog
from sqlalchemy import text

log = structlog.get_logger()

DB_INIT_TIMEOUT = 30  # seconds


async def _init_db_background() -> None:
    """Run init_db() with a timeout in a background task.

    Errors are logged but never propagate — the app must stay alive even
    when the database is temporarily unreachable at boot time.
    """
    try:
        await asyncio.wait_for(init_db(), timeout=DB_INIT_TIMEOUT)
        log.info("Database initialised successfully")
    except asyncio.TimeoutError:
        log.error(
            "Database initialisation timed out",
            timeout_seconds=DB_INIT_TIMEOUT,
        )
    except Exception as exc:
        log.error("Database initialisation failed", error=str(exc))


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Nexus API", version="0.4.0", host="0.0.0.0", port=8000)
    # Fire-and-forget: schedule DB init as a background task so the app
    # becomes ready to serve requests (health checks, etc.) immediately.
    asyncio.create_task(_init_db_background())
    init_router(settings)
    log.info("LLM Router initialized")
    yield
    log.info("Nexus API shutdown complete")

app = FastAPI(title="Nexus API", version="0.4.0", lifespan=lifespan)

# CORS — разрешаем Vercel домен и localhost для разработки
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nexus-lnag.onrender.com",
]
# Если задан явный FRONTEND_URL — добавляем
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(ideas.router)
app.include_router(financial.router)
app.include_router(validation.router)
app.include_router(roadmap.router)


@app.get("/api/health")
async def health():
    """Liveness + shallow readiness probe.

    Always returns 200 so Railway's health check never kills a running
    process just because the database is temporarily unreachable.
    The ``db`` field lets you distinguish a healthy app from one that
    cannot reach its database without causing a restart loop.
    """
    db_status = "unknown"
    try:
        engine = _get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        db_status = f"error: {exc}"

    return {"status": "ok", "version": "0.4.0", "db": db_status}
