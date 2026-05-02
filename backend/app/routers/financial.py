from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_session, GenerationSession, FinancialModel as DBFinancialModel, UserProfile as DBUserProfile
from app.auth import get_current_user
from app.financial import run_financial_model
import uuid

router = APIRouter(prefix="/api/financial", tags=["financial"])


class AdjustmentsBody(BaseModel):
    avg_check: Optional[float] = None
    monthly_clients: Optional[int] = None
    fixed_costs: Optional[float] = None
    variable_cost_pct: Optional[float] = None


@router.post("/model/{session_id}/{idea_id}")
async def create_financial_model(
    session_id: str,
    idea_id: str,
    adjustments: Optional[AdjustmentsBody] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]

    # Get session and profile
    session = await db.get(GenerationSession, uuid.UUID(session_id))
    if not session or str(session.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Find idea
    ideas = session.idea_candidates or []
    idea = next((i for i in ideas if i.get("id") == idea_id), None)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    profile_rec = await db.execute(
        select(DBUserProfile).where(DBUserProfile.user_id == uuid.UUID(user_id))
    )
    profile = profile_rec.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    adj = adjustments.model_dump(exclude_none=True) if adjustments else {}

    result = await run_financial_model(user_id, session_id, idea, profile.data, adj)

    # Save/update model
    existing = await db.execute(
        select(DBFinancialModel).where(
            DBFinancialModel.session_id == uuid.UUID(session_id),
            DBFinancialModel.idea_id == idea_id,
        )
    )
    db_model = existing.scalar_one_or_none()

    model_data = {
        "assumptions": result.get("assumptions", {}),
        "scenarios": result.get("scenarios", {}),
        "unit_economics": result.get("unit_economics", {}),
        "validation_warnings": result.get("validation_warnings", []),
    }

    if db_model:
        db_model.model_data = model_data
        db_model.user_adjustments = adj
    else:
        db_model = DBFinancialModel(
            id=uuid.uuid4(),
            session_id=uuid.UUID(session_id),
            user_id=uuid.UUID(user_id),
            idea_id=idea_id,
            model_data=model_data,
            user_adjustments=adj,
        )
        db.add(db_model)

    await db.commit()
    return {**model_data, "user_adjustments": adj}


@router.get("/model/{session_id}/{idea_id}")
async def get_financial_model(
    session_id: str,
    idea_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]
    existing = await db.execute(
        select(DBFinancialModel).where(
            DBFinancialModel.session_id == uuid.UUID(session_id),
            DBFinancialModel.idea_id == idea_id,
            DBFinancialModel.user_id == uuid.UUID(user_id),
        )
    )
    model = existing.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return {**model.model_data, "user_adjustments": model.user_adjustments}
