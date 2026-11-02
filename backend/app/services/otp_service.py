import abc
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core import config
from ..models.auth_models import OtpChallenge


class BaseOtpProvider(abc.ABC):
    """Abstract SMS OTP Delivery Provider."""

    @abc.abstractmethod
    def send_otp(self, mobile: str, otp_code: str) -> bool:
        """Dispatches an OTP message to the recipient's mobile phone."""
        pass


class MockOtpProvider(BaseOtpProvider):
    """
    Mock OTP provider for development and testing.
    Keeps dispatched OTP in an in-memory buffer without printing secrets to logs.
    Strictly forbidden in production mode.
    """

    def __init__(self):
        self.dispatched_otps: dict[str, str] = {}

    def send_otp(self, mobile: str, otp_code: str) -> bool:
        if config.ENVIRONMENT == "production":
            raise RuntimeError(
                "MockOtpProvider is strictly prohibited in production mode. Configure a real SMS provider."
            )
        self.dispatched_otps[mobile] = otp_code
        return True


# Global provider registry
_active_provider: BaseOtpProvider = MockOtpProvider()


def get_otp_provider() -> BaseOtpProvider:
    if config.ENVIRONMENT == "production" and (
        isinstance(_active_provider, MockOtpProvider) or config.SMS_PROVIDER.lower() == "mock"
    ):
        raise RuntimeError("MockOtpProvider is strictly prohibited in production.")
    return _active_provider


def set_otp_provider(provider: BaseOtpProvider) -> None:
    global _active_provider
    _active_provider = provider


def _get_hmac_secret() -> bytes:
    """
    Retrieves and validates the OTP HMAC secret.
    Fails closed in production if secret is missing or insecure.
    """
    secret = config.OTP_HMAC_SECRET
    if not secret:
        raise ValueError("OTP HMAC secret is missing.")
    if config.ENVIRONMENT == "production" and (secret.startswith("CHANGE_ME") or len(secret) < 32):
        raise ValueError("Production requires a secure OTP_HMAC_SECRET with at least 32 characters.")
    return secret.encode("utf-8")


def _hash_otp(mobile: str, purpose: str, otp_code: str) -> str:
    """
    Computes keyed HMAC-SHA256 for an OTP, binding mobile number, purpose, and code.
    HMAC(secret, mobile + ":" + purpose + ":" + otp)
    """
    key = _get_hmac_secret()
    clean_mobile = mobile.strip()
    clean_purpose = purpose.strip().lower()
    clean_code = otp_code.strip()
    message = f"{clean_mobile}:{clean_purpose}:{clean_code}".encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def generate_and_send_otp(mobile: str, purpose: str, db: Session) -> Tuple[bool, str]:
    """
    Generates a cryptographically random 6-digit OTP, checks resend cooldown,
    computes keyed HMAC, persists the challenge, and dispatches via provider.
    Fails closed if mock provider is active in production.
    """
    if config.ENVIRONMENT == "production" and config.SMS_PROVIDER.lower() == "mock":
        raise RuntimeError(
            "SMS_PROVIDER cannot be 'mock' in production. Configure a production SMS gateway."
        )

    now = datetime.now(timezone.utc)
    clean_mobile = mobile.strip()
    clean_purpose = purpose.strip().lower()

    # Cooldown check: prevent spamming resend within 60 seconds
    recent_challenge = (
        db.query(OtpChallenge)
        .filter_by(mobile=clean_mobile, purpose=clean_purpose)
        .order_by(desc(OtpChallenge.created_at))
        .first()
    )
    if recent_challenge and recent_challenge.created_at:
        ch_time = recent_challenge.created_at
        if ch_time.tzinfo is None:
            ch_time = ch_time.replace(tzinfo=timezone.utc)
        elapsed = (now - ch_time).total_seconds()
        if elapsed < config.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(config.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            return False, f"Please wait {remaining} seconds before requesting another code."

    # Cryptographically secure 6-digit code
    code = f"{secrets.randbelow(900000) + 100000:06d}"
    hashed = _hash_otp(clean_mobile, clean_purpose, code)
    expires_at = now + timedelta(minutes=config.OTP_EXPIRE_MINUTES)

    challenge = OtpChallenge(
        mobile=clean_mobile,
        otp_hash=hashed,
        purpose=clean_purpose,
        attempts=0,
        max_attempts=config.OTP_MAX_ATTEMPTS,
        expires_at=expires_at,
        is_verified=False,
        is_consumed=False,
        created_at=now,
    )
    db.add(challenge)
    db.commit()

    # Dispatch via SMS provider
    provider = get_otp_provider()
    delivered = provider.send_otp(clean_mobile, code)

    if not delivered:
        return False, "Failed to send verification code. Please try again later."

    return True, "Verification code sent successfully."


def verify_otp_challenge(mobile: str, code: str, purpose: str, db: Session) -> Tuple[bool, str]:
    """
    Verifies a submitted OTP against the latest active, unconsumed challenge.
    Enforces expiration, attempt limits, and constant-time HMAC comparison.
    """
    now = datetime.now(timezone.utc)
    clean_mobile = mobile.strip()
    clean_purpose = purpose.strip().lower()

    challenge = (
        db.query(OtpChallenge)
        .filter_by(mobile=clean_mobile, purpose=clean_purpose, is_verified=False, is_consumed=False)
        .order_by(desc(OtpChallenge.created_at))
        .first()
    )

    if not challenge:
        return False, "No active verification code found. Please request a new one."

    # Check attempt limit
    if challenge.attempts >= challenge.max_attempts:
        return False, "Maximum verification attempts exceeded. Please request a new code."

    # Check expiration
    exp = challenge.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        return False, "Verification code has expired. Please request a new code."

    # Validate code using keyed HMAC
    expected_hash = _hash_otp(clean_mobile, clean_purpose, code.strip())
    if not hmac.compare_digest(challenge.otp_hash, expected_hash):
        challenge.attempts += 1
        db.commit()
        remaining = challenge.max_attempts - challenge.attempts
        return False, f"Invalid verification code. {remaining} attempt(s) remaining."

    # Mark as verified (not consumed yet; consumption occurs upon account creation/reset)
    challenge.is_verified = True
    db.commit()
    return True, "Verification successful."


def is_mobile_preverified(mobile: str, purpose: str, db: Session, max_age_minutes: int = 15) -> bool:
    """
    Checks if an unconsumed OTP challenge was successfully verified for this mobile within N minutes.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=max_age_minutes)
    clean_mobile = mobile.strip()
    clean_purpose = purpose.strip().lower()

    challenge = (
        db.query(OtpChallenge)
        .filter(
            OtpChallenge.mobile == clean_mobile,
            OtpChallenge.purpose == clean_purpose,
            OtpChallenge.is_verified == True,
            OtpChallenge.is_consumed == False,
            OtpChallenge.created_at >= cutoff,
        )
        .order_by(desc(OtpChallenge.created_at))
        .first()
    )
    return challenge is not None


def consume_verified_otp(mobile: str, purpose: str, db: Session, max_age_minutes: int = 15) -> bool:
    """
    Atomically consumes the verified challenge, locking the row where supported.
    A consumed OTP challenge can never be used again.
    Must be called inside the atomic transaction of registration or password reset.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=max_age_minutes)
    clean_mobile = mobile.strip()
    clean_purpose = purpose.strip().lower()

    query = (
        db.query(OtpChallenge)
        .filter(
            OtpChallenge.mobile == clean_mobile,
            OtpChallenge.purpose == clean_purpose,
            OtpChallenge.is_verified == True,
            OtpChallenge.is_consumed == False,
            OtpChallenge.created_at >= cutoff,
        )
        .order_by(desc(OtpChallenge.created_at))
    )

    try:
        bind = db.get_bind()
        if bind and bind.dialect.name == "postgresql":
            query = query.with_for_update()
    except Exception:
        pass

    challenge = query.first()
    if not challenge:
        return False

    challenge.is_consumed = True
    db.flush()
    return True
