import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core import config
from ..models.auth_models import User, RefreshToken


# Initialize Argon2id password hasher with secure parameters
_pwd_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MB
    parallelism=1,
    hash_len=32,
)


def hash_password(password: str) -> str:
    """Hashes a password using Argon2id with automatic salt generation."""
    return _pwd_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time password verification using Argon2id."""
    try:
        return _pwd_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def hash_token(token: str) -> str:
    """Cryptographic SHA-256 hash of refresh token for safe database persistence."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: int, role: str) -> Tuple[str, int]:
    """Generates a signed JWT access token (15-minute default)."""
    now = datetime.now(timezone.utc)
    expire_delta = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire_at = now + expire_delta

    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    encoded = jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)
    expires_in_seconds = int(expire_delta.total_seconds())
    return encoded, expires_in_seconds


def create_refresh_token(user_id: int, db: Session) -> Tuple[str, RefreshToken]:
    """
    Generates a cryptographically random refresh token, stores its SHA-256 hash in DB,
    and returns the raw token string and the RefreshToken record.
    """
    raw_token = f"rft_{uuid.uuid4().hex}{uuid.uuid4().hex}"
    t_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)

    token_record = RefreshToken(
        user_id=user_id,
        token_hash=t_hash,
        expires_at=expires_at,
        created_at=now,
    )
    db.add(token_record)
    db.flush()
    return raw_token, token_record


def rotate_refresh_token(raw_old_token: str, db: Session) -> Tuple[str, str, int, User]:
    """
    Rotates a refresh token with automatic reuse detection.
    If a revoked token is reused, all active tokens for that user are immediately revoked!
    Returns (new_access_token, new_refresh_token, expires_in, user).
    """
    old_hash = hash_token(raw_old_token)
    query = db.query(RefreshToken).filter_by(token_hash=old_hash)
    try:
        bind = db.get_bind()
        if bind and bind.dialect.name == "postgresql":
            query = query.with_for_update()
    except Exception:
        pass
    token_record = query.first()

    if not token_record:
        raise ValueError("Invalid refresh token")

    user = db.query(User).filter_by(id=token_record.user_id).first()
    if not user or not user.is_active or user.is_suspended or not user.is_verified:
        raise PermissionError("User account is inactive, suspended, or unverified")

    now = datetime.now(timezone.utc)

    # REUSE DETECTION: If token was already revoked, revoke all sessions for this user!
    if token_record.revoked_at is not None:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == token_record.user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": now})
        db.commit()
        raise PermissionError("Refresh token reuse detected. All sessions have been revoked for security.")

    # Check expiration
    token_exp = token_record.expires_at
    if token_exp.tzinfo is None:
        token_exp = token_exp.replace(tzinfo=timezone.utc)

    if token_exp < now:
        token_record.revoked_at = now
        db.commit()
        raise ValueError("Refresh token has expired")

    try:
        # Issue new refresh token
        new_raw_token, new_token_record = create_refresh_token(user.id, db)

        # Revoke old token and link rotation
        token_record.revoked_at = now
        token_record.replaced_by_token_id = new_token_record.id

        # Issue new access token
        new_access_token, expires_in = create_access_token(user.id, user.role)

        db.commit()
        return new_access_token, new_raw_token, expires_in, user
    except Exception:
        db.rollback()
        raise


def revoke_refresh_token(raw_token: str, db: Session) -> bool:
    """Revokes a specific refresh token (single session logout)."""
    t_hash = hash_token(raw_token)
    record = db.query(RefreshToken).filter_by(token_hash=t_hash).first()
    if record and record.revoked_at is None:
        record.revoked_at = datetime.now(timezone.utc)
        db.commit()
        return True
    return False


def revoke_all_user_tokens(user_id: int, db: Session) -> int:
    """Revokes all active refresh tokens for a user (logout all sessions)."""
    now = datetime.now(timezone.utc)
    updated = (
        db.query(RefreshToken)
        .filter(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .update({"revoked_at": now})
    )
    db.commit()
    return updated


def decode_access_token(token: str) -> Dict[str, Any]:
    """Validates and decodes an access token. Raises jwt exceptions on invalidity."""
    return jwt.decode(
        token,
        config.JWT_SECRET_KEY,
        algorithms=[config.JWT_ALGORITHM],
        options={"require": ["exp", "sub", "type"]},
    )
