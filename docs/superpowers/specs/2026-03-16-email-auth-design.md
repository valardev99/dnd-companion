# Email Verification & Password Reset — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Add Resend email integration for email verification on registration and forgot-password reset flow

## Overview

Currently, registration creates accounts with immediate full access and there is no password reset mechanism. This spec adds:

1. **Email verification** — new accounts must verify email before accessing the Command Center
2. **Forgot password** — users can request a password reset link sent to their email
3. **Resend integration** — Python SDK for transactional email, API key stored in environment

## Architecture Decisions

- **Backend-only email**: Resend Python SDK (`resend` package) sends emails from FastAPI. No frontend email logic.
- **Token-based flows**: Verification and reset use JWT tokens (15min expiry for reset, 24hr for verify) with `type: "verify"` / `type: "reset"` claims. Reuses existing `jose` JWT infrastructure.
- **No separate token table**: Tokens are stateless JWTs. The User model gets `email_verified: bool` column. No separate verification/reset token tables needed.
- **Graceful degradation**: If `RESEND_API_KEY` is not set, skip email sending (dev mode). Log a warning, auto-verify accounts.
- **From address**: `noreply@wonderloreai.com` in production, `onboarding@resend.dev` as fallback for Resend test domain.

## Database Changes

Add to `User` model:
```python
email_verified = Column(Boolean, default=False, nullable=False)
```

Existing users (via `init_db` table creation) will need a default of `False`. For development with SQLite, `init_db` recreates tables on startup so this is automatic.

## Backend Changes

### New file: `server/app/email.py`
- `send_verification_email(to_email, token)` — sends verification link
- `send_reset_email(to_email, token)` — sends password reset link
- Uses Resend Python SDK
- Checks `RESEND_API_KEY` env var; if empty, logs warning and returns (dev mode)

### New file: `server/app/routes/email_auth.py`
- `POST /auth/forgot-password` — accepts `{email}`, generates reset JWT, sends email. Always returns 200 (no email enumeration).
- `POST /auth/reset-password` — accepts `{token, new_password}`, validates JWT, updates password hash.
- `POST /auth/verify-email` — accepts `{token}`, validates JWT, sets `email_verified = True`.
- `POST /auth/resend-verification` — accepts `{email}`, re-sends verification email if account exists and unverified.

### Modified: `server/app/routes/auth.py`
- `register` endpoint: after creating user, generate verify token and call `send_verification_email`. Still return tokens (user is logged in but unverified).
- `login` endpoint: include `email_verified` in `UserResponse`.

### Modified: `server/app/config.py`
- Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars.

### Modified: `server/app/auth.py`
- Add `create_verify_token(user_id)` — 24hr expiry, `type: "verify"`
- Add `create_reset_token(user_id)` — 15min expiry, `type: "reset"`

## Frontend Changes

### Modified: `AuthContext.jsx`
- `user` object now includes `email_verified` field
- Add `resendVerification()` function

### New: `VerifyBanner.jsx`
- Gold warning banner shown in Command Center when `!user.email_verified`
- Text: "Check your email to verify your account"
- "Resend" button that calls `resendVerification()`
- Dismissible but reappears on page reload

### Modified: `LoginModal.jsx`
- Add "Forgot password?" link below password field
- Clicking opens inline forgot-password form (email input + submit)
- Success message: "If an account exists with that email, a reset link has been sent."

### New: `ResetPasswordPage.jsx`
- Route: `/reset-password?token=xxx`
- Simple form: new password + confirm password
- Validates token on submit, shows success/error
- On success, redirects to landing page with login modal

### Modified: `LandingPage.jsx`
- "Play Now" buttons: if user is authenticated but not verified, show verify banner instead of navigating

## Email Templates

Simple HTML emails matching the dark fantasy aesthetic:
- Dark background (#0a0a0f), gold text (#c9a84c), Cinzel font via Google Fonts
- Single CTA button linking to verification/reset URL
- `{FRONTEND_URL}/verify-email?token=xxx` for verification
- `{FRONTEND_URL}/reset-password?token=xxx` for reset

## Security

- Reset tokens expire in 15 minutes
- Verification tokens expire in 24 hours
- Forgot-password always returns 200 (prevents email enumeration)
- Rate limiting: not in v1 (Resend has built-in rate limits on free tier)
- Password reset invalidates by checking the hashed_password hasn't changed (include password hash prefix in JWT claim)
