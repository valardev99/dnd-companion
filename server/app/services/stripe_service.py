"""Stripe billing service — wraps Stripe API calls with graceful fallback.

All methods handle the case where Stripe is not yet configured (no API keys).
When keys are missing, methods return structured error dicts so the frontend
can display helpful messages instead of crashing.
"""
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from app.config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy Stripe initialization — only import/configure when keys are present
# ---------------------------------------------------------------------------
_stripe = None


def _get_stripe():
    """Return the configured stripe module, or None if keys are missing."""
    global _stripe
    if _stripe is not None:
        return _stripe

    if not STRIPE_SECRET_KEY:
        return None

    try:
        import stripe

        stripe.api_key = STRIPE_SECRET_KEY
        _stripe = stripe
        return _stripe
    except ImportError:
        logger.error("stripe package is not installed. Run: pip install stripe")
        return None


def is_stripe_configured() -> bool:
    """Check whether Stripe API keys are present."""
    return bool(STRIPE_SECRET_KEY)


# ---------------------------------------------------------------------------
# Error helpers
# ---------------------------------------------------------------------------
class StripeNotConfiguredError(Exception):
    """Raised when a Stripe operation is attempted without API keys."""

    def __init__(self):
        super().__init__(
            "Stripe is not configured yet. "
            "Set STRIPE_SECRET_KEY in your environment to enable billing."
        )


def _require_stripe():
    """Return the stripe module or raise StripeNotConfiguredError."""
    stripe = _get_stripe()
    if stripe is None:
        raise StripeNotConfiguredError()
    return stripe


# ---------------------------------------------------------------------------
# Customer management
# ---------------------------------------------------------------------------
async def create_customer(user_id: str, email: str) -> Dict[str, Any]:
    """Create a Stripe Customer for a Wonderlore user.

    Returns dict with 'id' (Stripe customer ID) on success.
    """
    stripe = _require_stripe()

    customer = stripe.Customer.create(
        email=email,
        metadata={"wonderlore_user_id": user_id},
    )
    logger.info("Created Stripe customer %s for user %s", customer.id, user_id)
    return {"id": customer.id, "email": email}


# ---------------------------------------------------------------------------
# Checkout & Portal sessions
# ---------------------------------------------------------------------------
async def create_checkout_session(
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
) -> Dict[str, Any]:
    """Create a Stripe Checkout Session for subscribing to a plan.

    Returns dict with 'session_id' and 'url' (the hosted checkout page URL).
    """
    stripe = _require_stripe()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"customer_id": customer_id},
    )
    return {"session_id": session.id, "url": session.url}


async def create_portal_session(
    customer_id: str,
    return_url: str,
) -> Dict[str, Any]:
    """Create a Stripe Billing Portal session so users can manage their subscription.

    Returns dict with 'url' (the portal page URL).
    """
    stripe = _require_stripe()

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return {"url": session.url}


# ---------------------------------------------------------------------------
# Subscription management
# ---------------------------------------------------------------------------
async def get_subscription(subscription_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a Stripe Subscription by ID.

    Returns the subscription object as a dict, or None if not found.
    """
    stripe = _require_stripe()

    try:
        sub = stripe.Subscription.retrieve(subscription_id)
        return {
            "id": sub.id,
            "status": sub.status,
            "current_period_start": datetime.fromtimestamp(sub.current_period_start),
            "current_period_end": datetime.fromtimestamp(sub.current_period_end),
            "cancel_at_period_end": sub.cancel_at_period_end,
            "plan_id": sub["items"]["data"][0]["price"]["id"] if sub["items"]["data"] else None,
        }
    except Exception as exc:
        logger.error("Failed to retrieve Stripe subscription %s: %s", subscription_id, exc)
        return None


async def cancel_subscription(subscription_id: str, at_period_end: bool = True) -> Dict[str, Any]:
    """Cancel a Stripe Subscription.

    By default, cancels at the end of the current billing period (at_period_end=True).
    Set at_period_end=False for immediate cancellation.
    """
    stripe = _require_stripe()

    if at_period_end:
        sub = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True,
        )
    else:
        sub = stripe.Subscription.cancel(subscription_id)

    return {
        "id": sub.id,
        "status": sub.status,
        "cancel_at_period_end": sub.cancel_at_period_end,
    }


# ---------------------------------------------------------------------------
# Webhook handling
# ---------------------------------------------------------------------------
async def handle_webhook_event(
    payload: bytes,
    sig_header: str,
) -> Dict[str, Any]:
    """Verify and parse a Stripe webhook event.

    Returns a dict with 'type' (event type) and 'data' (event data object).
    Raises ValueError if signature verification fails.
    """
    stripe = _require_stripe()

    if not STRIPE_WEBHOOK_SECRET:
        raise ValueError(
            "STRIPE_WEBHOOK_SECRET is not configured. "
            "Set it in your environment to process webhooks."
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            STRIPE_WEBHOOK_SECRET,
        )
    except stripe.error.SignatureVerificationError as exc:
        logger.warning("Stripe webhook signature verification failed: %s", exc)
        raise ValueError("Invalid webhook signature") from exc

    return {
        "type": event["type"],
        "data": event["data"]["object"],
    }
