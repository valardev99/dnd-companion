"""Application configuration from environment variables."""
import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/wanderlore"
)
# Fix Railway's postgres:// -> postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production-32chars!")
FERNET_KEY = os.environ.get("FERNET_KEY", "")  # Generated at first run if empty
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
