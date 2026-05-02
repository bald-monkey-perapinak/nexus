from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_session, UserProfile as DBUserProfile
from app.auth import get_current_user
from app.onboarding import run_onboarding
import uuid

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileData(BaseModel):
    capital_range: str
    format: str
    business_type: List[str]
    team_size: str
    payback_period: Optional[str] = "12"
    city: Optional[str] = None
    experience: Optional[str] = None
    exclusions: Optional[str] = None
    tech_level: Optional[str] = "medium"
    risk_profile: Optional[str] = "moderate"
    is_main_income: Optional[bool] = True
    planning_horizon: Optional[str] = "12"
    has_clients: Optional[bool] = False
    has_premises: Optional[bool] = False
    has_partners: Optional[bool] = False


@router.post("")
async def save_profile(
    body: ProfileData,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]
    profile_dict = body.model_dump()

    # Run onboarding graph
    result = await run_onboarding(user_id, profile_dict)
    enriched_profile = result.get("profile", profile_dict)
    completeness = result.get("profile_completeness", 0)

    # Upsert profile
    existing = await db.execute(
        select(DBUserProfile).where(DBUserProfile.user_id == uuid.UUID(user_id))
    )
    db_profile = existing.scalar_one_or_none()

    if db_profile:
        db_profile.data = enriched_profile
        db_profile.completeness = completeness
    else:
        db_profile = DBUserProfile(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user_id),
            data=enriched_profile,
            completeness=completeness,
        )
        db.add(db_profile)

    await db.commit()

    return {
        "profile": enriched_profile,
        "completeness": completeness,
        "errors": result.get("errors", []),
        "stage": result.get("stage", "complete"),
    }


@router.get("")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    user_id = current_user["sub"]
    result = await db.execute(
        select(DBUserProfile).where(DBUserProfile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return {"profile": None, "completeness": 0}
    return {"profile": profile.data, "completeness": profile.completeness}
