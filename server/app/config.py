"""Application configuration from environment variables."""
import os
import sys

# ---------------------------------------------------------------------------
# Environment detection
# ---------------------------------------------------------------------------
# Railway sets RAILWAY_ENVIRONMENT=production. Generic fallbacks for other
# hosts (Fly, Render, Heroku, Docker). If any of these is set we treat the
# process as production and hard-fail on missing secrets.
_is_production = bool(
    os.environ.get("RAILWAY_ENVIRONMENT")
    or os.environ.get("ENVIRONMENT", "").lower() in ("prod", "production")
    or os.environ.get("NODE_ENV", "").lower() == "production"
    or os.environ.get("FLY_APP_NAME")
    or os.environ.get("RENDER")
)

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/wonderlore"
)
# Fix Railway's postgres:// -> postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# ---------------------------------------------------------------------------
# Secrets — hard-fail in production if missing
# ---------------------------------------------------------------------------
_DEV_SECRET_FALLBACK = "dev-secret-change-in-production-32chars!"  # nosec — dev only
_DEV_FERNET_PLACEHOLDER = ""  # empty = generate ephemeral at runtime (dev only)


def _require_or_dev(var_name: str, dev_fallback: str, *, critical_msg: str) -> str:
    """Return env var in dev; hard-fail in production if unset."""
    value = os.environ.get(var_name, "")
    if value:
        return value
    if _is_production:
        sys.stderr.write(
            f"\n[FATAL] {var_name} is not set in production.\n"
            f"        {critical_msg}\n"
            f"        Refusing to boot — set {var_name} in your deploy env.\n\n"
        )
        raise SystemExit(1)
    return dev_fallback


SECRET_KEY = _require_or_dev(
    "SECRET_KEY",
    _DEV_SECRET_FALLBACK,
    critical_msg=(
        "Without a persistent SECRET_KEY, JWTs are forgeable by anyone who "
        "can guess the default, and every redeploy invalidates every session."
    ),
)

FERNET_KEY = _require_or_dev(
    "FERNET_KEY",
    _DEV_FERNET_PLACEHOLDER,
    critical_msg=(
        "Without a persistent FERNET_KEY, every redeploy silently breaks "
        "decryption of every stored user API key. Generate one with:\n"
        "          python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
    ),
)

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30

# ---------------------------------------------------------------------------
# Stripe billing (leave empty until keys are configured in Stripe dashboard)
# ---------------------------------------------------------------------------
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_PREMIUM = os.environ.get("STRIPE_PRICE_PREMIUM", "")  # Stripe Price ID for premium plan

# ---------------------------------------------------------------------------
# Resend email (for verification and password reset)
# ---------------------------------------------------------------------------
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "noreply@wonderloreai.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Export env flag for other modules
IS_PRODUCTION = _is_production
