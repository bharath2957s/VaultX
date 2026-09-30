"""
VaultX SQLAlchemy Models (Normalized Schema, Section 43)
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, BigInteger
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    password_hash = Column(String(512), nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    shares = relationship("Share", back_populates="owner")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    token_hash = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(256), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="tokens")


class StoredFile(Base):
    __tablename__ = "files"

    id = Column(String(64), primary_key=True)
    original_name = Column(String(256), nullable=False)
    sanitized_name = Column(String(256), nullable=False)
    mime_type = Column(String(128), nullable=False)
    size = Column(BigInteger, nullable=False)
    storage_id = Column(String(64), unique=True, nullable=False)
    sha256_original = Column(String(64), nullable=False)
    sha256_encrypted = Column(String(64), nullable=False)
    nonce_hex = Column(String(64), nullable=False)
    wrapped_dek = Column(Text, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    owner_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Share(Base):
    __tablename__ = "shares"

    id = Column(String(64), primary_key=True)
    secure_share_id = Column(String(64), unique=True, index=True, nullable=False)
    owner_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), default="ACTIVE", nullable=False)
    password_hash = Column(String(512), nullable=True)
    max_downloads = Column(Integer, default=15, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    require_otp = Column(Boolean, default=False, nullable=False)
    otp_hash = Column(String(64), nullable=True)
    device_binding = Column(Boolean, default=False, nullable=False)
    security_score = Column(Integer, default=85, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    owner = relationship("User", back_populates="shares")
    events = relationship("DownloadEvent", back_populates="share", cascade="all, delete-orphan")


class DownloadEvent(Base):
    __tablename__ = "download_events"

    id = Column(String(64), primary_key=True)
    share_id = Column(String(64), ForeignKey("shares.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(String(64), nullable=True)
    is_zip = Column(Boolean, default=False, nullable=False)
    client_ip = Column(String(64), nullable=False)
    user_agent = Column(String(512), nullable=False)
    status = Column(String(32), nullable=False)
    downloaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    share = relationship("Share", back_populates="events")


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(64), primary_key=True)
    share_id = Column(String(64), nullable=True)
    event_type = Column(String(64), nullable=False)
    success = Column(Boolean, nullable=False)
    client_ip = Column(String(64), nullable=False)
    user_agent = Column(String(512), nullable=False)
    risk_score = Column(Integer, default=0, nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(64), primary_key=True)
    share_id = Column(String(64), ForeignKey("shares.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(String(16), nullable=False)  # SENDER / RECEIVER
    sender_name = Column(String(64), nullable=False)
    text = Column(String(1000), nullable=False)  # Text only, strictly length limited
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
