from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.database import get_session, User
from app.auth import create_access_token, hash_password, verify_password
from app.config import settings
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GuestAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str = "Guest User"
    is_admin: bool = False

@router.post("/guest", response_model=GuestAuthResponse)
async def auth_guest():
    """Гостевой вход — выдаёт временный токен без регистрации."""
    user_id = str(uuid.uuid4())
    access_token = create_access_token(user_id)
    
    return GuestAuthResponse(
        access_token=access_token,
        user_id=user_id
    )

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    is_admin: bool


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_session),
):
    # Find user by email
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    is_admin = user.email in settings.admin_ids

    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        full_name=user.full_name or "",
        is_admin=is_admin,
    )


@router.post("/register", response_model=AuthResponse)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_session),
):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == body.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    user = User(
        id=uuid.uuid4(),
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    is_admin = user.email in settings.admin_ids

    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        full_name=user.full_name or "",
        is_admin=is_admin,
    )
