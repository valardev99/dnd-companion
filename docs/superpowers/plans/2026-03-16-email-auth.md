# Email Verification & Password Reset Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Resend email integration for email verification on registration and forgot-password reset flow.

**Architecture:** Backend uses Resend Python SDK for transactional email. Verification and reset flows use stateless JWT tokens with type claims. Frontend shows verification banner and forgot-password form.

**Tech Stack:** Python/FastAPI, Resend SDK, python-jose JWT, React, CSS

---

## Chunk 1: Backend Infrastructure

### Task 1: Add Resend dependency and config

**Files:**
- Modify: `server/requirements.txt` (add `resend` package)
- Modify: `server/app/config.py` (add RESEND env vars)
- Modify: `start-dev.sh` (add RESEND_API_KEY to env)

- [ ] **Step 1: Add resend to requirements.txt**

Add `resend` to the end of `server/requirements.txt`:

```
resend==2.5.0
```

- [ ] **Step 2: Add config vars**

Add to end of `server/app/config.py`:

```python
# ---------------------------------------------------------------------------
# Resend email (for verification and password reset)
# ---------------------------------------------------------------------------
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
```

- [ ] **Step 3: Add RESEND_API_KEY to start-dev.sh**

Update the backend startup in `start-dev.sh` to include the Resend API key. Add it as an environment variable alongside `DATABASE_URL`:

```bash
DATABASE_URL="sqlite+aiosqlite:///./dev.db" \
  RESEND_API_KEY="re_AvbLFGe2_EQoCFpfQ6ahD361dmE9vnoUd" \
  python3 -m uvicorn server.app.main:app \
  --host 0.0.0.0 --port 8000 --reload \
  --reload-dir "$SCRIPT_DIR/server" &
```

- [ ] **Step 4: Install resend package**

Run: `cd server && pip install resend==2.5.0`

- [ ] **Step 5: Commit**

```bash
git add server/requirements.txt server/app/config.py start-dev.sh
git commit -m "feat: add Resend config and dependency for email auth"
```

---

### Task 2: Add email_verified column to User model

**Files:**
- Modify: `server/app/models.py:41-54` (User class)
- Modify: `server/app/routes/auth.py:54-66` (UserResponse schema)
- Modify: `server/app/routes/auth.py:77-87` (_user_response helper)

- [ ] **Step 1: Add email_verified to User model**

In `server/app/models.py`, add after the `is_admin` column (line 52):

```python
    email_verified = Column(Boolean, default=False, nullable=False)
```

- [ ] **Step 2: Add email_verified to UserResponse**

In `server/app/routes/auth.py`, add `email_verified: bool` to the `UserResponse` schema:

```python
class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    is_admin: bool
    has_api_key: bool
    email_verified: bool
    friend_code: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
```

- [ ] **Step 3: Add email_verified to _user_response helper**

Update `_user_response` in `server/app/routes/auth.py`:

```python
def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        is_admin=user.is_admin,
        has_api_key=user.encrypted_api_key is not None,
        email_verified=user.email_verified,
        friend_code=user.friend_code,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )
```

- [ ] **Step 4: Commit**

```bash
git add server/app/models.py server/app/routes/auth.py
git commit -m "feat: add email_verified column to User model and response"
```

---

### Task 3: Add verify/reset token creators to auth.py

**Files:**
- Modify: `server/app/auth.py:38-53` (JWT section)

- [ ] **Step 1: Add token factory functions**

Add after the existing `create_refresh_token` function in `server/app/auth.py`:

```python
def create_verify_token(user_id: str) -> str:
    """24-hour email verification token."""
    expire = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "verify"}, SECRET_KEY, algorithm=ALGORITHM)


def create_reset_token(user_id: str, pw_hash_prefix: str) -> str:
    """15-minute password reset token. Embeds pw hash prefix to auto-invalidate if password changes."""
    expire = datetime.utcnow() + timedelta(minutes=15)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "reset", "phx": pw_hash_prefix[:8]},
        SECRET_KEY, algorithm=ALGORITHM,
    )
```

- [ ] **Step 2: Commit**

```bash
git add server/app/auth.py
git commit -m "feat: add verify and reset JWT token creators"
```

---

### Task 4: Create email service module

**Files:**
- Create: `server/app/email.py`

- [ ] **Step 1: Create email.py**

Create `server/app/email.py`:

```python
"""Email service using Resend for transactional emails."""
import logging

from app.config import FRONTEND_URL, RESEND_API_KEY, RESEND_FROM_EMAIL

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend. Returns True on success."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email to %s", to)
        return False

    import resend
    resend.api_key = RESEND_API_KEY

    try:
        resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


def _email_wrapper(body_html: str) -> str:
    """Wrap body HTML in the dark-fantasy email template."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Crimson+Text&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background:#0a0a0f; font-family:'Crimson Text',Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f; padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a24; border:1px solid #3d3520; max-width:95vw;">
        <tr><td style="padding:32px 36px; text-align:center;">
          <h1 style="font-family:'Cinzel',serif; color:#c9a84c; font-size:22px; margin:0 0 4px; letter-spacing:2px;">
            Wonderlore AI
          </h1>
          <div style="height:1px; background:linear-gradient(90deg,transparent,#c9a84c,transparent); margin:16px 0;"></div>
          {body_html}
          <div style="height:1px; background:linear-gradient(90deg,transparent,#3d3520,transparent); margin:24px 0;"></div>
          <p style="color:#666; font-size:12px; margin:0;">
            &copy; 2026 Wonderlore AI. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_verification_email(to: str, token: str) -> bool:
    """Send email verification link."""
    url = f"{FRONTEND_URL}/verify-email?token={token}"
    body = f"""
      <p style="color:#e8dcc8; font-size:16px; line-height:1.6; margin:0 0 20px;">
        Welcome, adventurer. Verify your email to unlock the realm.
      </p>
      <a href="{url}"
         style="display:inline-block; padding:14px 32px; background:linear-gradient(180deg,#d4b050,#c9a84c,#a88a3e);
                color:#0a0a0f; font-family:'Cinzel',serif; font-size:14px; font-weight:700;
                letter-spacing:2px; text-transform:uppercase; text-decoration:none;
                border:2px solid #d4b050;">
        VERIFY EMAIL
      </a>
      <p style="color:#888; font-size:13px; margin:20px 0 0;">
        This link expires in 24 hours. If you didn't create an account, ignore this email.
      </p>
    """
    return _send(to, "Verify Your Email — Wonderlore AI", _email_wrapper(body))


def send_reset_email(to: str, token: str) -> bool:
    """Send password reset link."""
    url = f"{FRONTEND_URL}/reset-password?token={token}"
    body = f"""
      <p style="color:#e8dcc8; font-size:16px; line-height:1.6; margin:0 0 20px;">
        A password reset was requested for your account.
      </p>
      <a href="{url}"
         style="display:inline-block; padding:14px 32px; background:linear-gradient(180deg,#d4b050,#c9a84c,#a88a3e);
                color:#0a0a0f; font-family:'Cinzel',serif; font-size:14px; font-weight:700;
                letter-spacing:2px; text-transform:uppercase; text-decoration:none;
                border:2px solid #d4b050;">
        RESET PASSWORD
      </a>
      <p style="color:#888; font-size:13px; margin:20px 0 0;">
        This link expires in 15 minutes. If you didn't request this, ignore this email.
      </p>
    """
    return _send(to, "Reset Your Password — Wonderlore AI", _email_wrapper(body))
```

- [ ] **Step 2: Commit**

```bash
git add server/app/email.py
git commit -m "feat: add Resend email service with dark-fantasy templates"
```

---

### Task 5: Create email auth routes

**Files:**
- Create: `server/app/routes/email_auth.py`
- Modify: `server/app/main.py` (register new router)
- Modify: `server/app/routes/auth.py:93-131` (register endpoint — send verification email)

- [ ] **Step 1: Create email_auth.py routes**

Create `server/app/routes/email_auth.py`:

```python
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
```

- [ ] **Step 2: Register the router in main.py**

In `server/app/main.py`, add the import alongside other route imports:

```python
from app.routes import admin, auth, billing, campaigns, chat, email_auth, errors, feedback, friends, images, notifications, quality, stories, submissions, test
```

And add the router include after `auth.router`:

```python
app.include_router(email_auth.router)              # /auth/verify-email, /auth/forgot-password, etc.
```

- [ ] **Step 3: Update register endpoint to send verification email**

In `server/app/routes/auth.py`, add imports at the top:

```python
from app.auth import create_verify_token
from app.email import send_verification_email
from app.config import RESEND_API_KEY
```

Then modify the `register` function. After `await db.flush()` (line 112) and before creating the access token, add:

```python
    # Send verification email (skip in dev if no API key)
    if RESEND_API_KEY:
        verify_token = create_verify_token(str(user.id))
        send_verification_email(user.email, verify_token)
    else:
        # Dev mode: auto-verify
        user.email_verified = True
        db.add(user)
        await db.flush()
```

- [ ] **Step 4: Commit**

```bash
git add server/app/routes/email_auth.py server/app/main.py server/app/routes/auth.py
git commit -m "feat: add email verification and password reset endpoints"
```

---

## Chunk 2: Frontend — Verification Banner & Forgot Password

### Task 6: Update AuthContext with email_verified

**Files:**
- Modify: `client/src/contexts/AuthContext.jsx`

- [ ] **Step 1: Add resendVerification to AuthContext**

Add after the `storeApiKey` function in `client/src/contexts/AuthContext.jsx`:

```javascript
  const resendVerification = useCallback(async () => {
    if (!user?.email) return;
    const res = await fetch('/auth/resend-verification', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    if (!res.ok) throw new Error('Failed to resend verification email');
    return res.json();
  }, [user]);
```

- [ ] **Step 2: Add resendVerification to provider value**

Update the context provider value to include `resendVerification`:

```javascript
    <AuthContext.Provider value={{
      user, setUser, token, loading,
      isAuthenticated: !!user,
      register, login, logout, storeApiKey, authFetch, resendVerification,
    }}>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/AuthContext.jsx
git commit -m "feat: add resendVerification to AuthContext"
```

---

### Task 7: Create VerifyBanner component

**Files:**
- Create: `client/src/components/auth/VerifyBanner.jsx`
- Create: `client/src/styles/verify-banner.css`
- Modify: `client/src/styles/index.css` (add import)

- [ ] **Step 1: Create VerifyBanner.jsx**

Create `client/src/components/auth/VerifyBanner.jsx`:

```jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import '../../styles/verify-banner.css';

export default function VerifyBanner() {
  const { user, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.email_verified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
    } catch (e) {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-banner">
      <span className="verify-banner-icon">✉</span>
      <span className="verify-banner-text">
        {sent
          ? 'Verification email sent! Check your inbox.'
          : 'Check your email to verify your account.'}
      </span>
      {!sent && (
        <button
          className="verify-banner-resend"
          onClick={handleResend}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Resend'}
        </button>
      )}
      <button className="verify-banner-close" onClick={() => setDismissed(true)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create verify-banner.css**

Create `client/src/styles/verify-banner.css`:

```css
/* ═══ EMAIL VERIFICATION BANNER ═══ */
.verify-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid var(--gold-dim);
  border-left: 3px solid var(--gold);
  font-family: 'Crimson Text', serif;
  font-size: 0.9rem;
  color: var(--gold);
}

.verify-banner-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.verify-banner-text {
  flex: 1;
}

.verify-banner-resend {
  background: none;
  border: 1px solid var(--gold-dim);
  color: var(--gold);
  padding: 4px 12px;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.verify-banner-resend:hover:not(:disabled) {
  background: rgba(201, 168, 76, 0.15);
  border-color: var(--gold);
}

.verify-banner-resend:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verify-banner-close {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 0.9rem;
  transition: color 0.2s;
  flex-shrink: 0;
}

.verify-banner-close:hover {
  color: var(--gold);
}
```

- [ ] **Step 3: Add CSS import to index.css**

Add `@import './verify-banner.css';` to `client/src/styles/index.css` before `responsive.css` (which must remain last).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/auth/VerifyBanner.jsx client/src/styles/verify-banner.css client/src/styles/index.css
git commit -m "feat: add email verification banner component"
```

---

### Task 8: Add VerifyBanner to HubPage

**Files:**
- Modify: `client/src/pages/HubPage.jsx` (import and render VerifyBanner)

- [ ] **Step 1: Import and render VerifyBanner**

In `client/src/pages/HubPage.jsx`, import the component:

```javascript
import VerifyBanner from '../components/auth/VerifyBanner.jsx';
```

Render `<VerifyBanner />` at the top of the HubPage content area (inside the main content div, before the existing content). The exact placement depends on the HubPage layout, but it should appear at the top of the page content area.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/HubPage.jsx
git commit -m "feat: show verification banner in Command Center"
```

---

### Task 9: Add forgot password to LoginModal

**Files:**
- Modify: `client/src/components/auth/LoginModal.jsx`

- [ ] **Step 1: Add forgot password flow to LoginModal**

Replace the entire `client/src/components/auth/LoginModal.jsx` with a version that includes a forgot-password inline form:

```jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function LoginModal({ onClose, onSuccess, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      (onSuccess || onClose)();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotSubmitting(true);
    try {
      await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setForgotSent(true);
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        {forgotMode ? (
          <>
            <h2>Reset Password</h2>
            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <p className="auth-switch" style={{ marginBottom: '16px' }}>
                  If an account exists with that email, a reset link has been sent.
                  Check your inbox.
                </p>
                <button
                  className="auth-submit"
                  onClick={() => { setForgotMode(false); setForgotSent(false); }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <div className="auth-field">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="adventurer@realm.com"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={forgotSubmitting}
                  style={{ marginTop: '12px' }}
                >
                  {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div className="auth-switch" style={{ marginTop: '12px' }}>
                  <a onClick={() => setForgotMode(false)}>Back to Sign In</a>
                </div>
              </form>
            )}
          </>
        ) : (
          <>
            <h2>Sign In</h2>
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adventurer@realm.com"
                  required
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <a
                  className="auth-forgot-link"
                  onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                  style={{
                    color: 'var(--gold-dim)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: "'Crimson Text', serif",
                    marginTop: '4px',
                    display: 'inline-block',
                  }}
                >
                  Forgot password?
                </a>
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button
                type="submit"
                className="auth-submit"
                disabled={submitting}
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <div className="auth-switch">
              No account?{' '}
              <a onClick={onSwitchToRegister}>Create one</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/auth/LoginModal.jsx
git commit -m "feat: add forgot password flow to login modal"
```

---

### Task 10: Create ResetPasswordPage

**Files:**
- Create: `client/src/pages/ResetPasswordPage.jsx`
- Modify: `client/src/main.jsx` (add route)

- [ ] **Step 1: Create ResetPasswordPage**

Create `client/src/pages/ResetPasswordPage.jsx`:

```jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to reset password');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-page">
        <div className="auth-modal" style={{ margin: '80px auto' }}>
          <h2>Invalid Link</h2>
          <p className="auth-switch">This reset link is invalid or has expired.</p>
          <button className="auth-submit" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-page" style={{
      minHeight: '100vh',
      background: 'var(--void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="auth-modal">
        {success ? (
          <>
            <h2>Password Reset</h2>
            <p className="auth-switch" style={{ marginBottom: '16px' }}>
              Your password has been reset. You can now sign in with your new password.
            </p>
            <button className="auth-submit" onClick={() => navigate('/')}>
              Go to Sign In
            </button>
          </>
        ) : (
          <>
            <h2>Set New Password</h2>
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="new-password">New Password (min 8 characters)</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button
                type="submit"
                className="auth-submit"
                disabled={submitting}
                style={{ marginTop: '12px' }}
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create VerifyEmailPage**

Create `client/src/pages/VerifyEmailPage.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const token = params.get('token');

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Verification failed');
        }
        setStatus('success');
        // Update user in context if logged in
        if (user) {
          setUser({ ...user, email_verified: true });
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    };
    verify();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="auth-modal">
        {status === 'verifying' && (
          <>
            <h2>Verifying...</h2>
            <p className="auth-switch">Checking your verification link...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2>Email Verified!</h2>
            <p className="auth-switch" style={{ marginBottom: '16px' }}>
              Your email has been verified. Welcome to the realm, adventurer!
            </p>
            <button className="auth-submit" onClick={() => navigate(user ? '/play' : '/')}>
              {user ? 'Enter the Command Center' : 'Sign In'}
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <h2>Verification Failed</h2>
            <p className="auth-switch" style={{ marginBottom: '16px' }}>
              {errorMsg}
            </p>
            <button className="auth-submit" onClick={() => navigate('/')}>
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add routes to main.jsx**

In `client/src/main.jsx`, import the new pages and add routes:

```jsx
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
```

Add these routes (outside any auth protection):

```jsx
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/verify-email" element={<VerifyEmailPage />} />
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/ResetPasswordPage.jsx client/src/pages/VerifyEmailPage.jsx client/src/main.jsx
git commit -m "feat: add reset-password and verify-email pages with routes"
```

---

### Task 11: Delete dev.db and verify end-to-end

**Files:**
- No files modified — verification only

- [ ] **Step 1: Delete dev.db to pick up schema changes**

The SQLite dev database needs to be recreated to include the `email_verified` column:

```bash
rm -f dev.db
```

- [ ] **Step 2: Verify build succeeds**

Run: `cd client && npx vite build`
Expected: Build completes with no errors.

- [ ] **Step 3: Commit any fixes**

If any issues were found and fixed, commit them.

```bash
git add -A
git commit -m "fix: resolve any build issues from email auth integration"
```
