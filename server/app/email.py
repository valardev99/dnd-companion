"""Email service using Resend for transactional emails."""
import logging

from app.config import FRONTEND_URL, RESEND_API_KEY, RESEND_FROM_EMAIL

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend. Returns True on success."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email to %s", to)
        return False

    logger.info("Sending email %r to %s", subject, to)

    import resend
    resend.api_key = RESEND_API_KEY

    try:
        result = resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        # Resend returns {"id": "re_..."}
        resend_id = result.get("id") if isinstance(result, dict) else None
        logger.info("Email sent to %s (resend_id=%s)", to, resend_id)
        return True
    except Exception as exc:
        logger.exception("Failed to send email to %s: %s", to, exc)
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


def send_welcome_email(to: str, username: str) -> bool:
    """Send welcome email after successful verification."""
    url = f"{FRONTEND_URL}/play"
    body = f"""
      <p style="color:#e8dcc8; font-size:16px; line-height:1.6; margin:0 0 8px;">
        Hail, <strong style="color:#c9a84c;">{username}</strong>!
      </p>
      <p style="color:#e8dcc8; font-size:16px; line-height:1.6; margin:0 0 20px;">
        Your email has been verified and your account is fully activated.
        Welcome to Wonderlore AI — your personal AI-powered Dungeon Master.
      </p>
      <div style="background:#12121a; border:1px solid #3d3520; padding:20px 24px; text-align:left; margin:0 0 20px;">
        <p style="color:#c9a84c; font-family:'Cinzel',serif; font-size:13px; letter-spacing:1px; margin:0 0 12px; text-transform:uppercase;">
          What Awaits You
        </p>
        <p style="color:#b8a88a; font-size:14px; line-height:1.7; margin:0;">
          ⚔️ Create campaigns with rich, evolving storylines<br>
          🐉 Battle creatures with AI-driven combat encounters<br>
          📜 Shape your legend with branching narrative choices<br>
          🎭 Bring characters to life with deep personality and lore
        </p>
      </div>
      <a href="{url}"
         style="display:inline-block; padding:14px 32px; background:linear-gradient(180deg,#d4b050,#c9a84c,#a88a3e);
                color:#0a0a0f; font-family:'Cinzel',serif; font-size:14px; font-weight:700;
                letter-spacing:2px; text-transform:uppercase; text-decoration:none;
                border:2px solid #d4b050;">
        BEGIN YOUR ADVENTURE
      </a>
      <p style="color:#888; font-size:13px; margin:20px 0 0;">
        May your rolls be high and your stories legendary.
      </p>
    """
    return _send(to, "Welcome to Wonderlore AI — Your Adventure Begins", _email_wrapper(body))
