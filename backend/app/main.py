from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.config import settings
from app.llm_router import init_router, get_router
from app.routers import auth, profile, ideas, financial, validation, roadmap
import structlog

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Nexus API", version="0.4.0")
    await init_db()
    # Инициализируем LLM роутер с поддержкой нескольких провайдеров
    router = init_router(settings)
    log.info("LLM Router ready", status=router.get_status())
    yield
    log.info("Nexus API shutting down")


app = FastAPI(title="Nexus API", version="0.4.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    """Health check + статус LLM провайдеров."""
    try:
        llm_status = get_router().get_status()
    except Exception as e:
        import structlog
        structlog.get_logger().error(
            "Failed getting router status", error=str(e)[:200])
        llm_status = {}

    # Считаем сколько провайдеров доступно
    available = sum(1 for s in llm_status.values() if s["status"] == "ok")

    return {
        "status": "ok" if available > 0 else "degraded",
        "version": "0.4.0",
        "llm_providers": llm_status,
        "available_providers": available,
    }
