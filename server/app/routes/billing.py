"""Billing routes — plans, subscriptions, Stripe Checkout & Portal, webhooks."""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import STRIPE_PRICE_PREMIUM
from app.database import get_db
from app.models import PaymentHistory, Subscription, User
from app.services.stripe_service import (
    StripeNotConfiguredError,
    cancel_subscription as stripe_cancel_subscription,
    create_checkout_session,
    create_customer,
    create_portal_session,
    handle_webhook_event,
    is_stripe_configured,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["billing"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class PlanFeature(BaseModel):
    text: str


class PlanResponse(BaseModel):
    id: str
    name: str
    price: float
    description: str
    features: List[str]


class SubscriptionResponse(BaseModel):
    tier: str
    status: str
    stripe_configured: bool
    current_period_start: Optional[str] = None
    current_period_end: Optional[str] = None
    cancel_at_period_end: bool = False

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    plan_id: str
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    url: Optional[str] = None
    message: Optional[str] = None


class PortalRequest(BaseModel):
    return_url: str


class PortalResponse(BaseModel):
    url: Optional[str] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Plan definitions (hardcoded — matches client/src/data/plans.js)
# ---------------------------------------------------------------------------
PLANS = [
    PlanResponse(
        id="free",
        name="Adventurer",
        price=0,
        description="Begin your journey",
        features=[
            "1 active campaign",
            "Local saves only",
            "Standard AI models",
            "Community access",
        ],
    ),
    PlanResponse(
        id="premium",
        name="Hero",
        price=9.99,
        description="Unlock the full experience",
        features=[
            "Unlimited campaigns",
            "Cloud saves & sync",
            "AI portrait generation",
            "Priority AI models",
            "Campaign sharing",
            "Story recaps",
        ],
    ),
]

# Map plan IDs to Stripe Price IDs (populated from config)
PLAN_PRICE_MAP: Dict[str, str] = {}
if STRIPE_PRICE_PREMIUM:
    PLAN_PRICE_MAP["premium"] = STRIPE_PRICE_PREMIUM


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def _get_or_create_subscription(user: User, db: AsyncSession) -> Subscription:
    """Get the user's subscription, creating a free-tier one if none exists."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    sub = result.scalar_one_or_none()

    if sub is None:
        sub = Subscription(
            user_id=str(user.id),
            tier="free",
            status="active",
        )
        db.add(sub)
        await db.flush()

    return sub


def _sub_to_response(sub: Subscription) -> SubscriptionResponse:
    """Convert a Subscription model to an API response."""
    return SubscriptionResponse(
        tier=sub.tier,
        status=sub.status,
        stripe_configured=is_stripe_configured(),
        current_period_start=sub.current_period_start.isoformat() if sub.current_period_start else None,
        current_period_end=sub.current_period_end.isoformat() if sub.current_period_end else None,
        cancel_at_period_end=sub.cancel_at_period_end,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/api/billing/plans", response_model=List[PlanResponse])
async def get_plans():
    """Return available membership plans with pricing."""
    return PLANS


@router.get("/api/billing/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's subscription status."""
    sub = await _get_or_create_subscription(user, db)
    return _sub_to_response(sub)


@router.post("/api/billing/checkout", response_model=CheckoutResponse)
async def checkout(
    body: CheckoutRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for upgrading to a paid plan.

    Returns a URL to redirect the user to Stripe's hosted checkout page.
    If Stripe is not configured, returns a message explaining so.
    """
    # Validate the plan
    price_id = PLAN_PRICE_MAP.get(body.plan_id)
    if not price_id:
        if body.plan_id not in [p.id for p in PLANS]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown plan: {body.plan_id}",
            )
        # Plan exists but no Stripe Price ID mapped
        return CheckoutResponse(
            message=f"Stripe Price ID for '{body.plan_id}' plan is not configured yet. "
            "Set STRIPE_PRICE_PREMIUM in your environment variables."
        )

    try:
        # Ensure the user has a Stripe customer ID
        sub = await _get_or_create_subscription(user, db)

        if not sub.stripe_customer_id:
            customer = await create_customer(str(user.id), user.email)
            sub.stripe_customer_id = customer["id"]
            db.add(sub)
            await db.flush()

        # Create checkout session
        session = await create_checkout_session(
            customer_id=sub.stripe_customer_id,
            price_id=price_id,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )
        return CheckoutResponse(url=session["url"])

    except StripeNotConfiguredError:
        return CheckoutResponse(
            message="Stripe is not configured yet. Set STRIPE_SECRET_KEY in your environment to enable billing."
        )
    except Exception as exc:
        logger.error("Checkout session creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create checkout session: {exc}",
        )


@router.post("/api/billing/portal", response_model=PortalResponse)
async def portal(
    body: PortalRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Billing Portal session for managing subscription.

    Returns a URL to redirect the user to Stripe's customer portal.
    """
    sub = await _get_or_create_subscription(user, db)

    if not sub.stripe_customer_id:
        return PortalResponse(
            message="No active subscription found. Subscribe to a plan first."
        )

    try:
        session = await create_portal_session(
            customer_id=sub.stripe_customer_id,
            return_url=body.return_url,
        )
        return PortalResponse(url=session["url"])

    except StripeNotConfiguredError:
        return PortalResponse(
            message="Stripe is not configured yet. Set STRIPE_SECRET_KEY in your environment to enable billing."
        )
    except Exception as exc:
        logger.error("Portal session creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create portal session: {exc}",
        )


@router.post("/api/billing/webhook")
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events.

    This endpoint does NOT require user authentication — Stripe calls it
    directly. Security is ensured via webhook signature verification.

    Handles these event types:
    - checkout.session.completed — user completed checkout
    - customer.subscription.updated — subscription status changed
    - customer.subscription.deleted — subscription canceled
    - invoice.payment_succeeded — payment went through
    - invoice.payment_failed — payment failed
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature header",
        )

    try:
        event = await handle_webhook_event(payload, sig_header)
    except StripeNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    event_type = event["type"]
    data = event["data"]

    logger.info("Processing Stripe webhook: %s", event_type)

    # --- checkout.session.completed -------------------------------------------
    if event_type == "checkout.session.completed":
        customer_id = data.get("customer")
        subscription_id = data.get("subscription")

        if customer_id and subscription_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                )
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.stripe_subscription_id = subscription_id
                sub.tier = "premium"
                sub.status = "active"
                db.add(sub)
                await db.flush()
                logger.info(
                    "Activated premium for customer %s (subscription %s)",
                    customer_id,
                    subscription_id,
                )

    # --- customer.subscription.updated ----------------------------------------
    elif event_type == "customer.subscription.updated":
        subscription_id = data.get("id")
        stripe_status = data.get("status")
        cancel_at_period_end = data.get("cancel_at_period_end", False)

        if subscription_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == subscription_id
                )
            )
            sub = result.scalar_one_or_none()
            if sub:
                # Map Stripe status to our status values
                status_map = {
                    "active": "active",
                    "past_due": "past_due",
                    "canceled": "canceled",
                    "unpaid": "past_due",
                    "trialing": "trialing",
                    "incomplete": "past_due",
                    "incomplete_expired": "canceled",
                }
                sub.status = status_map.get(stripe_status, stripe_status)
                sub.cancel_at_period_end = cancel_at_period_end

                # Update period dates if available
                period_start = data.get("current_period_start")
                period_end = data.get("current_period_end")
                if period_start:
                    sub.current_period_start = datetime.fromtimestamp(period_start)
                if period_end:
                    sub.current_period_end = datetime.fromtimestamp(period_end)

                db.add(sub)
                await db.flush()
                logger.info(
                    "Updated subscription %s: status=%s, cancel_at_period_end=%s",
                    subscription_id,
                    sub.status,
                    sub.cancel_at_period_end,
                )

    # --- customer.subscription.deleted ----------------------------------------
    elif event_type == "customer.subscription.deleted":
        subscription_id = data.get("id")

        if subscription_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == subscription_id
                )
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.tier = "free"
                sub.status = "canceled"
                sub.stripe_subscription_id = None
                sub.cancel_at_period_end = False
                sub.current_period_start = None
                sub.current_period_end = None
                db.add(sub)
                await db.flush()
                logger.info(
                    "Subscription %s deleted — user reverted to free tier",
                    subscription_id,
                )

    # --- invoice.payment_succeeded --------------------------------------------
    elif event_type == "invoice.payment_succeeded":
        customer_id = data.get("customer")
        amount_paid = data.get("amount_paid", 0)
        currency = data.get("currency", "usd")
        payment_intent_id = data.get("payment_intent")

        if customer_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                )
            )
            sub = result.scalar_one_or_none()
            if sub:
                payment = PaymentHistory(
                    user_id=str(sub.user_id),
                    stripe_payment_intent_id=payment_intent_id,
                    amount_cents=amount_paid,
                    currency=currency,
                    status="succeeded",
                    description=f"Subscription payment — {sub.tier} plan",
                )
                db.add(payment)
                await db.flush()
                logger.info(
                    "Recorded payment of %d %s for customer %s",
                    amount_paid,
                    currency,
                    customer_id,
                )

    # --- invoice.payment_failed -----------------------------------------------
    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        amount_due = data.get("amount_due", 0)
        currency = data.get("currency", "usd")
        payment_intent_id = data.get("payment_intent")

        if customer_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                )
            )
            sub = result.scalar_one_or_none()
            if sub:
                payment = PaymentHistory(
                    user_id=str(sub.user_id),
                    stripe_payment_intent_id=payment_intent_id,
                    amount_cents=amount_due,
                    currency=currency,
                    status="failed",
                    description=f"Failed payment — {sub.tier} plan",
                )
                db.add(payment)
                await db.flush()
                logger.info(
                    "Recorded failed payment of %d %s for customer %s",
                    amount_due,
                    currency,
                    customer_id,
                )

    else:
        logger.debug("Unhandled Stripe event type: %s", event_type)

    return {"status": "ok"}
