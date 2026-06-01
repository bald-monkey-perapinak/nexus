from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_session, GenerationSession, UserProfile as DBUserProfile
from app.auth import get_current_user
from app.validation import run_validation
import uuid
import json

router = APIRouter(prefix="/api/validation", tags=["validation"])

# Simple in-memory store for validation results (use DB in prod)
_results: dict = {}


@router.post("/{session_id}/{idea_id}")
async def start_validation(
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
            result = await run_validation(user_id, session_id, idea, profile.data)
            _results[key] = {"status": "done", **result}
        except Exception as e:
            from app.llm_utils import sanitize_exception
            _results[key] = {"status": "error",
                             "error": sanitize_exception(e, "validation_task")}

    background_tasks.add_task(task)
    return {"status": "running", "key": key}


@router.get("/{session_id}/{idea_id}")
async def get_validation(
    session_id: str, idea_id: str,
    current_user: dict = Depends(get_current_user),
):
    key = f"{session_id}:{idea_id}"
    result = _results.get(key)
    if not result:
        raise HTTPException(404, "Validation not started")
    return result
