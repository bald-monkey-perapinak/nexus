from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_session, UserProfile as DBUserProfile, GenerationSession
from app.auth import get_current_user
from app.ideas import run_idea_generation
import uuid

router = APIRouter(prefix="/api/ideas", tags=["ideas"])


@router.post("/generate")
async def generate_ideas(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]

    # Get user profile
    result = await db.execute(
        select(DBUserProfile).where(
            DBUserProfile.user_id == uuid.UUID(user_id))
    )
    profile_rec = result.scalar_one_or_none()
    if not profile_rec:
        raise HTTPException(
            status_code=400, detail="Profile not found. Complete onboarding first.")

    # Create session
    session = GenerationSession(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        profile_snapshot=profile_rec.data,
        status="generating",
    )
    db.add(session)
    await db.commit()

    session_id = str(session.id)

    # Run generation in background
    background_tasks.add_task(
        _run_generation_task, user_id, session_id, profile_rec.data
    )

    return {"session_id": session_id, "status": "generating"}


async def _run_generation_task(user_id: str, session_id: str, profile: dict):
    from app.database import async_session_maker
    async with async_session_maker()() as db:
        try:
            result = await run_idea_generation(user_id, session_id, profile)
            ideas = result.get("idea_candidates", [])
            contradictions = result.get("contradictions", [])
            generation_warnings = result.get("generation_warnings", [])
            errors = result.get("errors", [])

            rec = await db.get(GenerationSession, uuid.UUID(session_id))
            if rec:
                rec.idea_candidates = ideas
                rec.contradictions = contradictions
                rec.generation_warnings = generation_warnings
                rec.status = "error" if errors and not ideas else "done"
                rec.error_message = "; ".join(errors) if errors else None
                await db.commit()
        except Exception as e:
            from app.llm_utils import sanitize_exception
            rec = await db.get(GenerationSession, uuid.UUID(session_id))
            if rec:
                rec.status = "error"
                rec.error_message = sanitize_exception(e, "generation_task")
                await db.commit()


@router.get("/session/{session_id}")
async def get_session_status(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]
    session = await db.get(GenerationSession, uuid.UUID(session_id))
    if not session or str(session.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "status": session.status,
        "ideas": session.idea_candidates or [],
        "contradictions": session.contradictions or [],
        "generation_warnings": session.generation_warnings or [],
        "error": session.error_message,
    }


@router.post("/session/{session_id}/select/{idea_id}")
async def select_idea(
    session_id: str,
    idea_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]
    session = await db.get(GenerationSession, uuid.UUID(session_id))
    if not session or str(session.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    session.selected_idea_id = idea_id
    await db.commit()
    return {"ok": True, "selected_idea_id": idea_id}
