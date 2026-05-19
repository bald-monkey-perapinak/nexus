from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import auth, profile, ideas, financial, validation, roadmap, analytics
import structlog

log = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Nexus API", version="0.4.0")
    await init_db()
    yield

app = FastAPI(title="Nexus API", version="0.4.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(ideas.router)
app.include_router(financial.router)
app.include_router(validation.router)
app.include_router(roadmap.router)
app.include_router(analytics.router)

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.4.0"}
