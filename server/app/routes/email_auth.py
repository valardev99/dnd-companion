"""Email-based auth routes — verification, forgot password, reset password."""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_reset_token, create_verify_token, decode_token, hash_password
from app.config import RESEND_API_KEY
from app.database import get_db
from app.email import send_reset_email, send_verification_email
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["email-auth"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


@router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send a password reset link. Always returns 200 to prevent email enumeration."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user:
        token = create_reset_token(str(user.id), user.hashed_password)
        send_reset_email(user.email, token)

    return {"status": "ok", "message": "If an account exists with that email, a reset link has been sent."}


@router.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid reset token."""
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    try:
        payload = decode_token(body.token)
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    # Check password hasn't changed since token was issued
    if user.hashed_password[:8] != payload.get("phx"):
        raise HTTPException(status_code=400, detail="This reset link has already been used")

    user.hashed_password = hash_password(body.new_password)
    db.add(user)
    await db.flush()

    return {"status": "ok", "message": "Password has been reset. You can now sign in."}


@router.post("/auth/verify-email")
async def verify_email(body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """Verify user's email address using token from email link."""
    try:
        payload = decode_token(body.token)
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    if payload.get("type") != "verify":
        raise HTTPException(status_code=400, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification link")

    if user.email_verified:
        return {"status": "ok", "message": "Email already verified."}

    user.email_verified = True
    db.add(user)
    await db.flush()

    return {"status": "ok", "message": "Email verified successfully. Welcome to the realm!"}


@router.post("/auth/resend-verification")
async def resend_verification(body: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Re-send verification email. Always returns 200."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user and not user.email_verified:
        token = create_verify_token(str(user.id))
        send_verification_email(user.email, token)

    return {"status": "ok", "message": "If your account exists, a new verification email has been sent."}
