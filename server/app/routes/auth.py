"""Authentication routes — register, login, logout, profile, API key storage."""
import logging
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    create_refresh_token,
    create_verify_token,
    decode_token,
    encrypt_api_key,
    get_current_user,
    hash_password,
    verify_password,
)
from app.config import DATABASE_URL, RESEND_API_KEY
from app.email import send_verification_email
from app.database import get_db
from app.limits import limiter
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])

_IS_LOCAL = DATABASE_URL.startswith("sqlite")

bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9_\- ]+$")
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ApiKeyRequest(BaseModel):
    api_key: str


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    is_admin: bool
    email_verified: bool
    has_api_key: bool
    friend_code: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        is_admin=user.is_admin,
        email_verified=user.email_verified,
        has_api_key=user.encrypted_api_key is not None,
        friend_code=user.friend_code,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Create a new user account and return tokens."""
    # Check for existing email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Check for existing username
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(
        email=body.email,
        username=body.username,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.flush()  # Populate user.id

    # Send verification email (skip in dev if no API key)
    if RESEND_API_KEY:
        verify_token = create_verify_token(str(user.id))
        result = await send_verification_email(user.email, verify_token)
        if not result:
            logger.warning("Verification email failed for user %s", user.id)
    else:
        # Dev mode: auto-verify
        user.email_verified = True
        db.add(user)
        await db.flush()

    access_token = create_access_token(str(user.id), user.token_version or 0)
    refresh_token = create_refresh_token(str(user.id), user.token_version or 0)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not _IS_LOCAL,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
        path="/",
    )

    return AuthResponse(
        user=_user_response(user),
        access_token=access_token,
    )


@router.post("/auth/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return tokens."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(str(user.id), user.token_version or 0)
    refresh_token = create_refresh_token(str(user.id), user.token_version or 0)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not _IS_LOCAL,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/",
    )

    return AuthResponse(
        user=_user_response(user),
        access_token=access_token,
    )


@router.post("/auth/logout")
async def logout(response: Response):
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=not _IS_LOCAL,
        samesite="lax",
        path="/",
    )
    return {"status": "ok", "message": "Logged out"}


@router.post("/auth/refresh", response_model=AuthResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh cookie for a new access token."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    # Reject refresh tokens minted before a password reset / logout-everywhere
    if payload.get("tv", 0) != (user.token_version or 0):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked")
    access_token = create_access_token(str(user.id), user.token_version or 0)
    new_refresh = create_refresh_token(str(user.id), user.token_version or 0)
    response.set_cookie(
        key="refresh_token", value=new_refresh,
        httponly=True, secure=not _IS_LOCAL, samesite="lax",
        max_age=30 * 24 * 60 * 60, path="/",
    )
    return AuthResponse(user=_user_response(user), access_token=access_token)


@router.get("/auth/me", response_model=UserResponse)
async def me(user=Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return _user_response(user)


@router.put("/auth/api-key")
async def store_api_key(
    body: ApiKeyRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Encrypt and store the user's OpenRouter API key."""
    if not body.api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="API key is required")

    user.encrypted_api_key = encrypt_api_key(body.api_key)
    db.add(user)
    await db.flush()

    return {"status": "ok", "message": "API key stored securely"}


@router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's display name and/or avatar."""
    if body.display_name is not None:
        clean = body.display_name.strip()
        if len(clean) > 100:
            raise HTTPException(status_code=400, detail="Display name too long (max 100)")
        user.display_name = clean if clean else None
    if body.avatar_url is not None:
        if body.avatar_url and not body.avatar_url.startswith("preset:"):
            raise HTTPException(status_code=400, detail="Invalid avatar format")
        user.avatar_url = body.avatar_url if body.avatar_url else None
    db.add(user)
    await db.flush()
    return _user_response(user)
