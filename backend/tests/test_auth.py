import pytest
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
import jwt

from app.core import config
from app.models.models import Farmer
from app.models.auth_models import (
    User,
    FarmerProfile,
    PsychiatristProfile,
    WarehouseOwnerProfile,
    RefreshToken,
    OtpChallenge,
)
from app.schemas.auth_schemas import UserRegisterRequest
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    decode_access_token,
)
from app.services.otp_service import (
    generate_and_send_otp,
    verify_otp_challenge,
    is_mobile_preverified,
)
from app.services.user_service import (
    register_farmer,
    authenticate_user,
)
from app.core.dependencies import (
    require_roles,
    require_approved_professional,
    get_current_farmer_id,
)


# 1. Password hashing and verification
def test_password_hashing_and_verification():
    raw_pwd = "StrongSecurePassword123!"
    h = hash_password(raw_pwd)
    assert h.startswith("$argon2id$")
    assert verify_password(raw_pwd, h) is True
    assert verify_password("WrongPassword123!", h) is False


# 2. Successful and failed login
def test_login_flow(db_session):
    pwd = "ValidPassword123!"
    user = User(
        mobile="9876543210",
        email="test@example.com",
        password_hash=hash_password(pwd),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    # Success by mobile
    auth_user = authenticate_user("9876543210", pwd, db_session)
    assert auth_user.id == user.id

    # Success by email
    auth_user_email = authenticate_user("test@example.com", pwd, db_session)
    assert auth_user_email.id == user.id

    # Failed login - bad password
    with pytest.raises(ValueError, match="Invalid mobile number/email or password"):
        authenticate_user("9876543210", "WrongPassword!", db_session)

    # Failed login - bad identifier
    with pytest.raises(ValueError, match="Invalid mobile number/email or password"):
        authenticate_user("9999999999", pwd, db_session)


# 3. Invalid and expired JWTs
def test_jwt_validation_and_expiry():
    token, _ = create_access_token(user_id=42, role="farmer")
    decoded = decode_access_token(token)
    assert decoded["sub"] == "42"
    assert decoded["role"] == "farmer"
    assert decoded["type"] == "access"

    # Expired token
    now = datetime.now(timezone.utc)
    expired_payload = {
        "sub": "42",
        "role": "farmer",
        "type": "access",
        "exp": int((now - timedelta(seconds=10)).timestamp()),
        "iat": int((now - timedelta(minutes=10)).timestamp()),
    }
    expired_token = jwt.encode(expired_payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(expired_token)

    # Tampered token
    with pytest.raises(jwt.PyJWTError):
        decode_access_token(token + "tampered")


# 4. Access-token versus refresh-token validation
def test_token_type_segregation():
    now = datetime.now(timezone.utc)
    refresh_payload = {
        "sub": "42",
        "type": "refresh",
        "exp": int((now + timedelta(days=7)).timestamp()),
    }
    refresh_jwt = jwt.encode(refresh_payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)
    decoded = decode_access_token(refresh_jwt)
    assert decoded["type"] == "refresh"
    assert decoded["type"] != "access"


# 5. Refresh token rotation
def test_refresh_token_rotation(db_session):
    user = User(
        mobile="9811111111",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    raw_token, token_rec = create_refresh_token(user.id, db_session)
    db_session.commit()

    # Rotate
    new_acc, new_ref, exp_in, u = rotate_refresh_token(raw_token, db_session)
    assert new_acc is not None
    assert new_ref != raw_token
    assert u.id == user.id

    # Verify old token is now marked revoked
    db_session.refresh(token_rec)
    assert token_rec.revoked_at is not None
    assert token_rec.replaced_by_token_id is not None


# 6. Refresh-token reuse detection
def test_refresh_token_reuse_detection(db_session):
    user = User(
        mobile="9822222222",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    raw_token1, rec1 = create_refresh_token(user.id, db_session)
    db_session.commit()

    # First legitimate rotation
    new_acc, raw_token2, _, _ = rotate_refresh_token(raw_token1, db_session)

    # Malicious attempt to reuse old token1
    with pytest.raises(PermissionError, match="Refresh token reuse detected"):
        rotate_refresh_token(raw_token1, db_session)

    # Check that all tokens for this user are now revoked
    active_tokens = db_session.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None)
    ).count()
    assert active_tokens == 0


# 7. Logout and revocation
def test_logout_and_revocation(db_session):
    user = User(
        mobile="9833333333",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    raw_token1, rec1 = create_refresh_token(user.id, db_session)
    raw_token2, rec2 = create_refresh_token(user.id, db_session)
    db_session.commit()

    # Logout specific session
    assert revoke_refresh_token(raw_token1, db_session) is True
    db_session.refresh(rec1)
    assert rec1.revoked_at is not None

    # Logout all sessions
    revoked_count = revoke_all_user_tokens(user.id, db_session)
    assert revoked_count == 1  # rec2 was still active
    db_session.refresh(rec2)
    assert rec2.revoked_at is not None


# 8. OTP expiry and attempt limits
def test_otp_expiry_and_attempt_limits(db_session, mock_otp):
    mobile = "9844444444"
    ok, _ = generate_and_send_otp(mobile, "registration", db_session)
    assert ok is True
    sent_code = mock_otp.dispatched_otps[mobile]

    # Bad attempts
    ok1, msg1 = verify_otp_challenge(mobile, "000000", "registration", db_session)
    assert ok1 is False
    assert "2 attempt(s) remaining" in msg1

    ok2, msg2 = verify_otp_challenge(mobile, "000001", "registration", db_session)
    assert ok2 is False
    assert "1 attempt(s) remaining" in msg2

    ok3, msg3 = verify_otp_challenge(mobile, "000002", "registration", db_session)
    assert ok3 is False

    # Exceeded attempt limit
    ok4, msg4 = verify_otp_challenge(mobile, sent_code, "registration", db_session)
    assert ok4 is False
    assert "exceeded" in msg4.lower()


# 9. Existing farmer OTP linking (Scenario A)
def test_existing_farmer_otp_linking(db_session, mock_otp):
    mobile = "9855555555"
    legacy_farmer = Farmer(
        name="Old Farmer",
        mobile=mobile,
        state="Haryana",
        farmer_category="small",
    )
    db_session.add(legacy_farmer)
    db_session.commit()

    # Pre-verify mobile via OTP
    generate_and_send_otp(mobile, "registration", db_session)
    code = mock_otp.dispatched_otps[mobile]
    verify_otp_challenge(mobile, code, "registration", db_session)

    # Register
    req = UserRegisterRequest(
        mobile=mobile,
        password="ValidPassword123!",
        name="Old Farmer Name",
        role="farmer",
    )
    user, profile, is_linked = register_farmer(req, db_session)
    assert is_linked is True
    assert profile.legacy_farmer_id == legacy_farmer.farmer_id
    assert user.role == "farmer"


# 10. New farmer registration transaction rollback
def test_new_farmer_registration_rollback(db_session, mock_otp):
    mobile = "9866666666"
    # Do not verify OTP
    req = UserRegisterRequest(
        mobile=mobile,
        password="ValidPassword123!",
        name="Unverified Farmer",
        role="farmer",
    )
    with pytest.raises(ValueError, match="Mobile ownership must be verified"):
        register_farmer(req, db_session)

    # Verify nothing was committed
    assert db_session.query(User).filter_by(mobile=mobile).first() is None
    assert db_session.query(Farmer).filter_by(mobile=mobile).first() is None


# 11. Duplicate mobile and email handling
def test_duplicate_mobile_and_email(db_session, mock_otp):
    mobile = "9877777777"
    email = "farmer@example.com"
    existing_user = User(
        mobile=mobile,
        email=email,
        password_hash=hash_password("Pass1234!"),
        role="farmer",
        is_active=True,
    )
    db_session.add(existing_user)
    db_session.commit()

    # Verify OTP for test
    generate_and_send_otp(mobile, "registration", db_session)
    code = mock_otp.dispatched_otps[mobile]
    verify_otp_challenge(mobile, code, "registration", db_session)

    req = UserRegisterRequest(
        mobile=mobile,
        email="other@example.com",
        password="ValidPassword123!",
        name="Duplicate Mobile",
        role="farmer",
    )
    with pytest.raises(ValueError, match="already registered"):
        register_farmer(req, db_session)


# 12. Role authorization
def test_role_authorization():
    farmer_user = User(role="farmer", is_active=True, is_suspended=False)
    admin_user = User(role="admin", is_active=True, is_suspended=False)

    admin_checker = require_roles("admin")
    assert admin_checker(admin_user) == admin_user

    with pytest.raises(HTTPException) as exc_info:
        admin_checker(farmer_user)
    assert exc_info.value.status_code == 403


# 13. Professional approval checks
def test_professional_approval_checks(db_session):
    psych_user = User(
        id=101,
        mobile="9900000001",
        password_hash=hash_password("Pass1234!"),
        role="psychiatrist",
        is_active=True,
        is_suspended=False,
    )
    unapproved_profile = PsychiatristProfile(user_id=101, license_number="PSY123", is_approved=False)
    db_session.add(psych_user)
    db_session.add(unapproved_profile)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        require_approved_professional(psych_user, db_session)
    assert exc_info.value.status_code == 403
    assert "pending administrative approval" in exc_info.value.detail

    # Approve
    unapproved_profile.is_approved = True
    db_session.commit()
    assert require_approved_professional(psych_user, db_session) == psych_user


# 14. Suspended, inactive, and unverified accounts
def test_suspended_and_inactive_accounts(db_session):
    pwd = "ValidPass123!"
    suspended = User(
        mobile="9888888888",
        password_hash=hash_password(pwd),
        role="farmer",
        is_active=True,
        is_suspended=True,
        is_verified=True,
    )
    inactive = User(
        mobile="9899999999",
        password_hash=hash_password(pwd),
        role="farmer",
        is_active=False,
        is_suspended=False,
        is_verified=True,
    )
    unverified = User(
        mobile="9870000001",
        password_hash=hash_password(pwd),
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=False,
    )
    db_session.add(suspended)
    db_session.add(inactive)
    db_session.add(unverified)
    db_session.commit()

    with pytest.raises(PermissionError, match="suspended"):
        authenticate_user("9888888888", pwd, db_session)

    with pytest.raises(PermissionError, match="deactivated"):
        authenticate_user("9899999999", pwd, db_session)

    with pytest.raises(PermissionError, match="not verified"):
        authenticate_user("9870000001", pwd, db_session)


# 15. Cross-farmer access denial
def test_cross_farmer_access_denial(db_session):
    user1 = User(
        id=201,
        mobile="9900000002",
        password_hash=hash_password("Pass1234!"),
        role="farmer",
    )
    profile1 = FarmerProfile(user_id=201, legacy_farmer_id=1)
    db_session.add(user1)
    db_session.add(profile1)

    psych_user = User(
        id=202,
        mobile="9900000003",
        password_hash=hash_password("Pass1234!"),
        role="psychiatrist",
    )
    db_session.add(psych_user)
    db_session.commit()

    # Farmer 1 resolves only legacy_farmer_id = 1
    assert get_current_farmer_id(user1, db_session) == 1

    # Psychiatrist cannot access farmer-specific endpoints
    with pytest.raises(HTTPException) as exc_info:
        get_current_farmer_id(psych_user, db_session)
    assert exc_info.value.status_code == 403
    assert "restricted to farmer" in exc_info.value.detail.lower()
