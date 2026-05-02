from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_session, User
from app.auth import verify_telegram_init_data_dev, create_access_token
from app.config import settings
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])


class TelegramAuthRequest(BaseModel):
    init_data: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    is_admin: bool


@router.post("/telegram", response_model=AuthResponse)
async def telegram_auth(
    body: TelegramAuthRequest,
    db: AsyncSession = Depends(get_session),
):
    tg_user = verify_telegram_init_data_dev(body.init_data)
    telegram_id = tg_user.get("id")

    # Upsert user
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    full_name = f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip()

    if not user:
        user = User(
            id=uuid.uuid4(),
            telegram_id=telegram_id,
            username=tg_user.get("username"),
            full_name=full_name,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.full_name = full_name
        user.username = tg_user.get("username")
        await db.commit()

    token = create_access_token(str(user.id), telegram_id)
    is_admin = telegram_id in settings.admin_ids

    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        full_name=full_name,
        is_admin=is_admin,
    )
