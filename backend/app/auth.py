import hashlib
import hmac
import json
import time
import logging
import uuid
from urllib.parse import parse_qsl, unquote
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, Depends, Header, APIRouter
from pydantic import BaseModel
from passlib.context import CryptContext
from app.config import settings

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/api/auth")
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


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def verify_telegram_init_data(init_data: str) -> dict:
    """Verify Telegram WebApp initData using HMAC-SHA256"""
    try:
        parsed = dict(parse_qsl(init_data, strict_parsing=True))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid init_data format")

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="No hash in init_data")

    # Check auth_date freshness (1 hour)
    auth_date = int(parsed.get("auth_date", 0))
    if time.time() - auth_date > 3600 * 24:  # 24h for dev convenience
        raise HTTPException(status_code=401, detail="init_data expired")

    # Build data-check-string
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )

    # Compute secret key
    secret_key = hmac.new(
        b"WebAppData",
        settings.BOT_TOKEN.encode(),
        hashlib.sha256
    ).digest()

    # Verify hash
    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid hash")

    # Parse user
    user_str = parsed.get("user", "{}")
    try:
        user = json.loads(unquote(user_str))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user data")

    return user


def verify_telegram_init_data_dev(init_data: str) -> dict:
    """Dev mode: skip verification if BOT_TOKEN is not set"""
    logger.info(
        f"[VERIFY_INIT_DATA] BOT_TOKEN present: {bool(settings.BOT_TOKEN)}, len={len(settings.BOT_TOKEN)}")

    if not settings.BOT_TOKEN:
        logger.info("[VERIFY_INIT_DATA] DEV MODE: Returning mock user")
        # Return mock user for development
        return {
            "id": 123456789,
            "first_name": "Dev",
            "last_name": "User",
            "username": "devuser"
        }

    logger.info(
        "[VERIFY_INIT_DATA] PRODUCTION MODE: Verifying real Telegram data")
    return verify_telegram_init_data(init_data)


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing authorization header")
    token = authorization.removeprefix("Bearer ")
    return decode_token(token)
