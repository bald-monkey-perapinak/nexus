from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_session, GenerationSession, UserProfile as DBUserProfile, FinancialModel as DBFinancialModel
from app.auth import get_current_user
from app.roadmap import run_roadmap
import uuid

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

_results: dict = {}


class TaskStatusUpdate(BaseModel):
    status: str  # "todo" | "in_progress" | "done"


@router.post("/{session_id}/{idea_id}")
async def start_roadmap(
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

    # Load financial model if exists
    fin_rec = await db.execute(
        select(DBFinancialModel).where(
            DBFinancialModel.session_id == uuid.UUID(session_id),
            DBFinancialModel.idea_id == idea_id,
        )
    )
    fin = fin_rec.scalar_one_or_none()
    financial = fin.model_data if fin else {}

    all_flags = idea.get("all_flags", [])
    key = f"{session_id}:{idea_id}"
    _results[key] = {"status": "running"}

    async def task():
        try:
            result = await run_roadmap(user_id, session_id, idea, profile.data, all_flags, financial)
            _results[key] = {
                "status": "done", "roadmap": result["roadmap"], "errors": result.get("errors", [])}
        except Exception as e:
            from app.llm_utils import sanitize_exception
            _results[key] = {"status": "error",
                             "error": sanitize_exception(e, "roadmap_task")}

    background_tasks.add_task(task)
    return {"status": "running", "key": key}


@router.get("/{session_id}/{idea_id}")
async def get_roadmap(
    session_id: str, idea_id: str,
    current_user: dict = Depends(get_current_user),
):
    key = f"{session_id}:{idea_id}"
    result = _results.get(key)
    if not result:
        raise HTTPException(404, "Roadmap not started")
    return result


@router.patch("/{session_id}/{idea_id}/task/{task_id}")
async def update_task_status(
    session_id: str, idea_id: str, task_id: str,
    body: TaskStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    key = f"{session_id}:{idea_id}"
    result = _results.get(key)
    if not result or result.get("status") != "done":
        raise HTTPException(404, "Roadmap not found")

    for task in result.get("roadmap", []):
        if task.get("id") == task_id:
            task["status"] = body.status
            return {"ok": True, "task_id": task_id, "status": body.status}

    raise HTTPException(404, "Task not found")
