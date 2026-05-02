from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import auth, profile, ideas, financial
from app.config import settings
import structlog

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Nexus API", version="0.1.0")
    await init_db()
    log.info("Database initialized")
    yield
    log.info("Shutting down")


app = FastAPI(
    title="Nexus API",
    description="AI-powered business idea platform",
    version="0.1.0",
    lifespan=lifespan,
)

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


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "nexus-api"}
