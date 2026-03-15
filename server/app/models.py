"""SQLAlchemy models for Wanderlore AI."""
import secrets
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy import JSON
from sqlalchemy.orm import relationship

from app.config import DATABASE_URL

# Use String(36) for UUID on SQLite, native PostgreSQL UUID otherwise
if DATABASE_URL.startswith("sqlite"):
    _UUID = String(36)
else:
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID
    _UUID = PG_UUID

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def generate_friend_code() -> str:
    """Generate a unique 8-character friend code (no ambiguous chars 0/O/1/I)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return ''.join(secrets.choice(alphabet) for _ in range(8))


class User(Base):
    __tablename__ = "users"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    encrypted_api_key = Column(Text, nullable=True)
    friend_code = Column(String(8), unique=True, index=True, default=generate_friend_code)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    campaigns = relationship("Campaign", back_populates="owner", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    payment_history = relationship("PaymentHistory", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    archived_campaigns = relationship("ArchivedCampaign", back_populates="user", cascade="all, delete-orphan")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    owner_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    world_bible = Column(Text, nullable=True)
    game_data = Column(JSON, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    is_multiplayer = Column(Boolean, default=False, nullable=False)
    max_players = Column(Integer, default=1, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active | paused | completed | archived
    chat_history = Column(JSON, nullable=True)
    session_summary = Column(Text, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    last_played_at = Column(DateTime, nullable=True)
    share_slug = Column(String(100), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="campaigns")
    players = relationship("CampaignPlayer", back_populates="campaign", cascade="all, delete-orphan")
    invites = relationship("CampaignInvite", back_populates="campaign", cascade="all, delete-orphan")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    category = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    tags = Column(JSON, nullable=True)
    status = Column(String(50), default="new", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="feedback")


class Story(Base):
    __tablename__ = "stories"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    campaign_id = Column(_UUID, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    slug = Column(String(200), unique=True, nullable=True, index=True)
    title = Column(String(255), nullable=False)
    excerpt = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    author_display_name = Column(String(150), nullable=True)
    character_name = Column(String(150), nullable=True)
    world_name = Column(String(255), nullable=True)
    recap_text = Column(Text, nullable=True)
    likes = Column(Integer, default=0, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    campaign = relationship("Campaign", backref="stories")
    author = relationship("User", backref="stories")


class StoryLike(Base):
    """Tracks which users have liked which stories (for toggle behaviour)."""
    __tablename__ = "story_likes"
    __table_args__ = (
        UniqueConstraint("story_id", "user_id", name="uq_story_likes_story_user"),
    )

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    story_id = Column(_UUID, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Subscription(Base):
    """Tracks a user's membership tier and Stripe subscription state."""
    __tablename__ = "subscriptions"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    tier = Column(String(20), default="free", nullable=False)  # free | premium | pro
    stripe_customer_id = Column(String(255), nullable=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    status = Column(String(20), default="active", nullable=False)  # active | canceled | past_due | trialing
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="subscription")


class PaymentHistory(Base):
    """Records of payments processed through Stripe."""
    __tablename__ = "payment_history"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(10), default="usd", nullable=False)
    status = Column(String(20), nullable=False)  # succeeded | pending | failed | refunded
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="payment_history")


class ErrorLog(Base):
    """Tracks frontend and backend errors for monitoring and auto-resolution."""
    __tablename__ = "error_logs"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    error_type = Column(String(50), nullable=False)  # "frontend" | "backend" | "api"
    error_code = Column(String(100), nullable=True)
    message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    context = Column(JSON, nullable=True)  # browser info, route, component
    resolution_status = Column(String(50), default="new", nullable=False)  # "new" | "investigating" | "resolved" | "wont_fix"
    resolution_notes = Column(Text, nullable=True)
    auto_resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="error_logs")


class UserSubmission(Base):
    """General user submissions — bug reports, feature requests, feedback, questions."""
    __tablename__ = "user_submissions"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String(50), nullable=False)  # "bug" | "feature" | "feedback" | "question"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="medium", nullable=False)  # "low" | "medium" | "high" | "critical"
    status = Column(String(50), default="new", nullable=False)  # "new" | "triaged" | "in_progress" | "resolved" | "closed"
    assigned_to = Column(String(255), nullable=True)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="submissions")


class QualityLog(Base):
    """AI response quality tracking — ratings, tag analysis, response metrics."""
    __tablename__ = "quality_logs"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    campaign_id = Column(_UUID, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    message_id = Column(String(255), nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5
    tag_count = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=True)
    expected_tags = Column(JSON, nullable=True)
    missing_tags = Column(JSON, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    model_used = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="quality_logs")
    campaign = relationship("Campaign", backref="quality_logs")


class UserTestSession(Base):
    """Tracks user testing / playtesting sessions for analytics."""
    __tablename__ = "user_test_sessions"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_start = Column(DateTime, nullable=False)
    session_end = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    actions_count = Column(Integer, default=0, nullable=False)
    errors_count = Column(Integer, default=0, nullable=False)
    browser_info = Column(JSON, nullable=True)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="test_sessions")


class Friendship(Base):
    """Bidirectional friendship between two users."""
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("user_id", "friend_id", name="uq_friendships_user_friend"),
    )

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    friend_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], backref="friendships")
    friend = relationship("User", foreign_keys=[friend_id], backref="incoming_friendships")


class FriendRequest(Base):
    """Friend request from one user to another."""
    __tablename__ = "friend_requests"
    __table_args__ = (
        UniqueConstraint("from_user_id", "to_user_id", name="uq_friend_request_pair"),
    )

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    from_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    to_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)  # pending | accepted | declined
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    from_user = relationship("User", foreign_keys=[from_user_id], backref="sent_friend_requests")
    to_user = relationship("User", foreign_keys=[to_user_id], backref="received_friend_requests")


class CampaignPlayer(Base):
    """Links players to campaigns (multiplayer)."""
    __tablename__ = "campaign_players"
    __table_args__ = (
        UniqueConstraint("campaign_id", "user_id", name="uq_campaign_players_campaign_user"),
    )

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    campaign_id = Column(_UUID, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    character_data = Column(JSON, nullable=True)
    role = Column(String(20), default="player", nullable=False)  # player | spectator
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship("Campaign", back_populates="players")
    user = relationship("User", backref="campaign_memberships")


class CampaignInvite(Base):
    """Invitation to join a campaign."""
    __tablename__ = "campaign_invites"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    campaign_id = Column(_UUID, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    from_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    to_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)  # pending | accepted | declined
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    campaign = relationship("Campaign", back_populates="invites")
    from_user = relationship("User", foreign_keys=[from_user_id], backref="sent_campaign_invites")
    to_user = relationship("User", foreign_keys=[to_user_id], backref="received_campaign_invites")


class Notification(Base):
    """User notifications for friend requests, campaign invites, etc."""
    __tablename__ = "notifications"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # friend_request | campaign_invite | system | etc.
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class ArchivedCampaign(Base):
    """Archived campaign record for the user's hall of legends."""
    __tablename__ = "archived_campaigns"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_campaign_id = Column(String(36), nullable=True)  # Reference only, no FK (original deleted)
    name = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    ending = Column(Text, nullable=True)
    character_name = Column(String(150), nullable=True)
    world_name = Column(String(255), nullable=True)
    sessions_played = Column(Integer, default=0, nullable=False)
    was_multiplayer = Column(Boolean, default=False, nullable=False)
    co_player_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="archived_campaigns")
