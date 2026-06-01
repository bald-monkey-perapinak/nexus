from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_session, GenerationSession, UserProfile as DBUserProfile
from app.auth import get_current_user
from app.analytics import run_analytics
import uuid

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
_results: dict = {}


@router.post("/{session_id}/{idea_id}")
async def start_analytics(
    session_id: str, idea_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]
    session = await db.get(GenerationSession, uuid.UUID(session_id))
    if not session or str(session.user_id) != user_id:
        raise HTTPException(404, "Session not found")
    idea = next((i for i in (session.idea_candidates or [])
                if i.get("id") == idea_id), None)
    if not idea:
        raise HTTPException(404, "Idea not found")
    profile_rec = await db.execute(select(DBUserProfile).where(DBUserProfile.user_id == uuid.UUID(user_id)))
    profile = profile_rec.scalar_one_or_none()
    if not profile:
        raise HTTPException(400, "Profile not found")

    key = f"{session_id}:{idea_id}"
    _results[key] = {"status": "running"}

    async def task():
        try:
            r = await run_analytics(user_id, session_id, idea, profile.data)
            _results[key] = {"status": "done", "report": r.get(
                "report", {}), "errors": r.get("errors", [])}
        except Exception as e:
            from app.llm_utils import sanitize_exception
            _results[key] = {"status": "error",
                             "error": sanitize_exception(e, "analytics_task")}

    background_tasks.add_task(task)
    return {"status": "running"}


@router.get("/{session_id}/{idea_id}")
async def get_analytics(
    session_id: str, idea_id: str,
    current_user: dict = Depends(get_current_user),
):
    key = f"{session_id}:{idea_id}"
    r = _results.get(key)
    if not r:
        raise HTTPException(404, "Not started")
    return r
