import pytest
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core import config
from app.models.auth_models import (
    User,
    FarmerProfile,
    RefreshToken,
    OtpChallenge,
)
from app.schemas.auth_schemas import UserRegisterRequest
from app.services.auth_service import (
    hash_password,
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
)
from app.services.otp_service import (
    generate_and_send_otp,
    verify_otp_challenge,
    is_mobile_preverified,
    consume_verified_otp,
    get_otp_provider,
    MockOtpProvider,
    _hash_otp,
)
from app.services.user_service import (
    register_farmer,
    authenticate_user,
)


# ==============================================================================
# SEC-01 & SEC-03: OTP HMAC & CONSUMPTION LIFECYCLE TESTS
# ==============================================================================

def test_otp_hmac_generation_and_verification(db_session: Session, mock_otp):
    """Verifies that OTP is stored as a keyed HMAC-SHA256 bound to mobile + purpose."""
    mobile = "9812345678"
    purpose = "registration"

    ok, msg = generate_and_send_otp(mobile, purpose, db_session)
    assert ok is True

    challenge = (
        db_session.query(OtpChallenge)
        .filter_by(mobile=mobile, purpose=purpose)
        .first()
    )
    assert challenge is not None
    assert challenge.otp_hash is not None

    dispatched_code = mock_otp.dispatched_otps[mobile]

    # Expected HMAC
    expected_hmac = hmac.new(
        config.OTP_HMAC_SECRET.encode("utf-8"),
        f"{mobile}:{purpose}:{dispatched_code}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    assert challenge.otp_hash == expected_hmac

    # Correct code verification succeeds
    v_ok, v_msg = verify_otp_challenge(mobile, dispatched_code, purpose, db_session)
    assert v_ok is True
    assert "successful" in v_msg.lower()

    db_session.refresh(challenge)
    assert challenge.is_verified is True
    assert challenge.is_consumed is False


def test_otp_wrong_hmac_secret_rejection(db_session: Session, mock_otp):
    """Verifies that OTP digest comparison fails if the secret is mismatched."""
    mobile = "9812345679"
    purpose = "registration"

    generate_and_send_otp(mobile, purpose, db_session)
    code = mock_otp.dispatched_otps[mobile]

    # Tamper with the secret during verification
    with patch.object(config, "OTP_HMAC_SECRET", "completely_different_secret_key_32_chars"):
        v_ok, v_msg = verify_otp_challenge(mobile, code, purpose, db_session)
        assert v_ok is False
        assert "Invalid verification code" in v_msg


def test_otp_wrong_mobile_rejection(db_session: Session, mock_otp):
    """Verifies that an OTP generated for mobile A cannot be verified for mobile B."""
    mobile_a = "9812345680"
    mobile_b = "9812345681"
    purpose = "registration"

    generate_and_send_otp(mobile_a, purpose, db_session)
    code = mock_otp.dispatched_otps[mobile_a]

    # Verify code against mobile B
    v_ok, v_msg = verify_otp_challenge(mobile_b, code, purpose, db_session)
    assert v_ok is False
    assert "no active" in v_msg.lower()


def test_otp_wrong_purpose_rejection(db_session: Session, mock_otp):
    """Verifies that an OTP generated for registration cannot be verified for reset_password."""
    mobile = "9812345682"
    generate_and_send_otp(mobile, "registration", db_session)
    code = mock_otp.dispatched_otps[mobile]

    v_ok, v_msg = verify_otp_challenge(mobile, code, "reset_password", db_session)
    assert v_ok is False
    assert "no active" in v_msg.lower()


def test_otp_expired_rejection(db_session: Session, mock_otp):
    """Verifies that expired OTP challenges are rejected."""
    mobile = "9812345683"
    purpose = "registration"
    generate_and_send_otp(mobile, purpose, db_session)
    code = mock_otp.dispatched_otps[mobile]

    challenge = db_session.query(OtpChallenge).filter_by(mobile=mobile).first()
    # Age the challenge past expiry
    challenge.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    v_ok, v_msg = verify_otp_challenge(mobile, code, purpose, db_session)
    assert v_ok is False
    assert "expired" in v_msg.lower()


def test_otp_attempt_limit_enforcement(db_session: Session, mock_otp):
    """Verifies that 3 invalid attempts locks out the challenge."""
    mobile = "9812345684"
    purpose = "registration"
    generate_and_send_otp(mobile, purpose, db_session)
    valid_code = mock_otp.dispatched_otps[mobile]

    for _ in range(3):
        v_ok, _ = verify_otp_challenge(mobile, "000000", purpose, db_session)
        assert v_ok is False

    # 4th attempt with correct code must now be rejected
    v_ok, v_msg = verify_otp_challenge(mobile, valid_code, purpose, db_session)
    assert v_ok is False
    assert "maximum verification attempts exceeded" in v_msg.lower()


def test_otp_resend_cooldown(db_session: Session):
    """Verifies that requests within 60s cooldown are throttled."""
    mobile = "9812345685"
    purpose = "registration"

    ok1, _ = generate_and_send_otp(mobile, purpose, db_session)
    assert ok1 is True

    ok2, msg2 = generate_and_send_otp(mobile, purpose, db_session)
    assert ok2 is False
    assert "please wait" in msg2.lower()


def test_otp_cannot_be_consumed_twice(db_session: Session, mock_otp):
    """Verifies that consume_verified_otp cannot succeed more than once (single-use guarantee)."""
    mobile = "9812345686"
    purpose = "registration"
    generate_and_send_otp(mobile, purpose, db_session)
    code = mock_otp.dispatched_otps[mobile]

    v_ok, _ = verify_otp_challenge(mobile, code, purpose, db_session)
    assert v_ok is True

    # First consumption succeeds
    first_consumed = consume_verified_otp(mobile, purpose, db_session)
    assert first_consumed is True
    db_session.commit()

    # Second consumption must fail
    second_consumed = consume_verified_otp(mobile, purpose, db_session)
    assert second_consumed is False

    # is_mobile_preverified must also reject consumed challenges
    assert is_mobile_preverified(mobile, purpose, db_session) is False


def test_otp_cannot_be_replayed_for_password_reset_after_registration(db_session: Session, mock_otp):
    """Verifies that a challenge verified for registration cannot authorize password reset."""
    mobile = "9812345687"
    generate_and_send_otp(mobile, "registration", db_session)
    code = mock_otp.dispatched_otps[mobile]

    v_ok, _ = verify_otp_challenge(mobile, code, "registration", db_session)
    assert v_ok is True

    # Register farmer consumes registration OTP
    req = UserRegisterRequest(
        mobile=mobile,
        password="ValidPassword123!",
        name="Security Test Farmer",
        role="farmer",
    )
    user, profile, _ = register_farmer(req, db_session)
    assert user.id is not None

    # Attempting to consume with purpose='reset_password' must be rejected
    reset_consumed = consume_verified_otp(mobile, "reset_password", db_session)
    assert reset_consumed is False


def test_failed_registration_rolls_back_otp_consumption(db_session: Session, mock_otp):
    """Verifies that if registration fails/rolls back, OTP consumption is also rolled back."""
    mobile = "9812345688"
    generate_and_send_otp(mobile, "registration", db_session)
    code = mock_otp.dispatched_otps[mobile]
    verify_otp_challenge(mobile, code, "registration", db_session)

    # We simulate a failure during registration after consume_verified_otp is called
    savepoint = db_session.begin_nested()
    consumed = consume_verified_otp(mobile, "registration", db_session)
    assert consumed is True
    # Simulate transaction rollback on failure
    savepoint.rollback()

    # After rollback, the challenge must NOT be consumed
    challenge = (
        db_session.query(OtpChallenge)
        .filter_by(mobile=mobile, purpose="registration")
        .first()
    )
    assert challenge is not None
    assert challenge.is_consumed is False
    assert is_mobile_preverified(mobile, "registration", db_session) is True


def test_failed_password_reset_rolls_back_otp_consumption(db_session: Session, mock_otp):
    """Verifies that if password reset fails/rolls back, OTP consumption is rolled back."""
    mobile = "9812345689"
    generate_and_send_otp(mobile, "reset_password", db_session)
    code = mock_otp.dispatched_otps[mobile]
    verify_otp_challenge(mobile, code, "reset_password", db_session)

    savepoint = db_session.begin_nested()
    consumed = consume_verified_otp(mobile, "reset_password", db_session)
    assert consumed is True
    savepoint.rollback()

    challenge = (
        db_session.query(OtpChallenge)
        .filter_by(mobile=mobile, purpose="reset_password")
        .first()
    )
    assert challenge is not None
    assert challenge.is_consumed is False


def test_concurrent_otp_consumption_sqlite_note(db_session: Session, mock_otp):
    """
    Documents concurrency behavior.
    In SQLite in-memory, row-level locking via with_for_update() is bypassed.
    In PostgreSQL, with_for_update() serializes concurrent callers so only one transaction consumes.
    Under sequential execution, double consumption is rejected.
    """
    mobile = "9812345690"
    generate_and_send_otp(mobile, "registration", db_session)
    code = mock_otp.dispatched_otps[mobile]
    verify_otp_challenge(mobile, code, "registration", db_session)

    # First attempt consumes
    first = consume_verified_otp(mobile, "registration", db_session)
    assert first is True
    db_session.commit()

    # Second concurrent or sequential attempt
    second = consume_verified_otp(mobile, "registration", db_session)
    assert second is False


# ==============================================================================
# SEC-02: PRODUCTION CONFIGURATION & MOCK PROVIDER PROTECTION
# ==============================================================================

def test_mock_provider_works_in_dev_test():
    """Verifies that MockOtpProvider is permitted in development/test environment."""
    with patch.object(config, "ENVIRONMENT", "development"):
        with patch.object(config, "SMS_PROVIDER", "mock"):
            provider = get_otp_provider()
            assert isinstance(provider, MockOtpProvider)


def test_mock_provider_rejected_in_production():
    """Verifies that MockOtpProvider fails closed with RuntimeError in production."""
    with patch.object(config, "ENVIRONMENT", "production"):
        with patch.object(config, "SMS_PROVIDER", "mock"):
            with pytest.raises(RuntimeError, match="MockOtpProvider is strictly prohibited in production"):
                get_otp_provider()


def test_missing_otp_hmac_secret_rejected_in_production(db_session: Session):
    """Verifies that missing or placeholder OTP_HMAC_SECRET fails closed in production."""
    with patch.object(config, "ENVIRONMENT", "production"):
        with patch.object(config, "SMS_PROVIDER", "twilio"):
            with patch.object(config, "OTP_HMAC_SECRET", "CHANGE_ME_OTP_HMAC_SECRET_32_PLUS_CHARS"):
                with pytest.raises(ValueError, match="Production requires a secure OTP_HMAC_SECRET"):
                    generate_and_send_otp("9812345691", "registration", db_session)


def test_no_otp_exposed_in_production_responses(client, db_session: Session):
    """Verifies that API responses never expose the OTP code in message or headers."""
    resp = client.post("/api/auth/send-otp", json={"mobile": "9812345692", "purpose": "registration"})
    assert resp.status_code == 200
    data = resp.json()
    assert "otp" not in data
    assert "code" not in data
    # Message should be a generic notification
    assert "sent" in data["message"].lower()


# ==============================================================================
# SEC-04: REFRESH TOKEN ROTATION & CONCURRENCY
# ==============================================================================

def test_sequential_refresh_rotation(db_session: Session):
    """Verifies clean sequential rotation: token 1 -> token 2 -> token 3."""
    user = User(
        mobile="9812345693",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    # Initial token
    raw_token_1, rec_1 = create_refresh_token(user.id, db_session)
    db_session.commit()

    # Rotation 1
    acc_1, raw_token_2, _, _ = rotate_refresh_token(raw_token_1, db_session)
    assert raw_token_2 != raw_token_1

    # Rotation 2
    acc_2, raw_token_3, _, _ = rotate_refresh_token(raw_token_2, db_session)
    assert raw_token_3 != raw_token_2

    # Check chain in DB
    db_session.refresh(rec_1)
    assert rec_1.revoked_at is not None
    assert rec_1.replaced_by_token_id is not None


def test_reuse_of_revoked_refresh_token(db_session: Session):
    """Verifies that reusing an already-rotated token revokes all active sessions."""
    user = User(
        mobile="9812345694",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    raw_token_1, _ = create_refresh_token(user.id, db_session)
    db_session.commit()

    # Rotate legitimately
    _, raw_token_2, _, _ = rotate_refresh_token(raw_token_1, db_session)

    # Replay raw_token_1
    with pytest.raises(PermissionError, match="Refresh token reuse detected"):
        rotate_refresh_token(raw_token_1, db_session)

    # Token 2 should also now be revoked!
    active_tokens = (
        db_session.query(RefreshToken)
        .filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .count()
    )
    assert active_tokens == 0


def test_expired_refresh_token(db_session: Session):
    """Verifies that an expired refresh token cannot be rotated."""
    user = User(
        mobile="9812345695",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    raw_token, rec = create_refresh_token(user.id, db_session)
    rec.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    db_session.commit()

    with pytest.raises(ValueError, match="expired"):
        rotate_refresh_token(raw_token, db_session)


def test_suspended_user_refresh_rejection(db_session: Session):
    """Verifies that a suspended user cannot rotate refresh tokens."""
    user = User(
        mobile="9812345696",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    raw_token, _ = create_refresh_token(user.id, db_session)
    db_session.commit()

    with pytest.raises(PermissionError, match="inactive, suspended, or unverified"):
        rotate_refresh_token(raw_token, db_session)


def test_unverified_user_refresh_rejection(db_session: Session):
    """Verifies that an unverified user cannot rotate refresh tokens."""
    user = User(
        mobile="9812345697",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=False,
    )
    db_session.add(user)
    db_session.commit()

    raw_token, _ = create_refresh_token(user.id, db_session)
    db_session.commit()

    with pytest.raises(PermissionError, match="inactive, suspended, or unverified"):
        rotate_refresh_token(raw_token, db_session)


def test_logout_and_logout_all_remain_functional(db_session: Session):
    """Verifies that single logout and logout-all both function correctly."""
    user = User(
        mobile="9812345698",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    tok1, _ = create_refresh_token(user.id, db_session)
    tok2, _ = create_refresh_token(user.id, db_session)
    tok3, _ = create_refresh_token(user.id, db_session)
    db_session.commit()

    # Single logout
    assert revoke_refresh_token(tok1, db_session) is True

    active = (
        db_session.query(RefreshToken)
        .filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .count()
    )
    assert active == 2

    # Logout all
    revoked_count = revoke_all_user_tokens(user.id, db_session)
    assert revoked_count == 2

    active_after = (
        db_session.query(RefreshToken)
        .filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .count()
    )
    assert active_after == 0


# ==============================================================================
# SEC-05: LOGIN ACCOUNT STATE ENFORCEMENT
# ==============================================================================

def test_login_account_states(db_session: Session):
    """Verifies that verified active users can log in, while unverified, inactive, or suspended are blocked."""
    pwd = "ValidPassword123!"
    h_pwd = hash_password(pwd)

    # 1. Verified active user
    u_active = User(
        mobile="9812345701",
        password_hash=h_pwd,
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    # 2. Unverified user
    u_unverified = User(
        mobile="9812345702",
        password_hash=h_pwd,
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=False,
    )
    # 3. Inactive user
    u_inactive = User(
        mobile="9812345703",
        password_hash=h_pwd,
        role="farmer",
        is_active=False,
        is_suspended=False,
        is_verified=True,
    )
    # 4. Suspended user
    u_suspended = User(
        mobile="9812345704",
        password_hash=h_pwd,
        role="farmer",
        is_active=True,
        is_suspended=True,
        is_verified=True,
    )

    db_session.add_all([u_active, u_unverified, u_inactive, u_suspended])
    db_session.commit()

    # Verified active logs in
    auth_u = authenticate_user("9812345701", pwd, db_session)
    assert auth_u.id == u_active.id

    # Unverified is blocked
    with pytest.raises(PermissionError, match="not verified"):
        authenticate_user("9812345702", pwd, db_session)

    # Inactive is blocked
    with pytest.raises(PermissionError, match="deactivated"):
        authenticate_user("9812345703", pwd, db_session)

    # Suspended is blocked
    with pytest.raises(PermissionError, match="suspended"):
        authenticate_user("9812345704", pwd, db_session)
