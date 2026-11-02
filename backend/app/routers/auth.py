from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..models.auth_models import User
from ..schemas.auth_schemas import (
    UserRegisterRequest,
    PsychiatristRegisterRequest,
    WarehouseOwnerRegisterRequest,
    LoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
)
from ..services.auth_service import (
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    hash_password,
)
from ..services.otp_service import (
    generate_and_send_otp,
    verify_otp_challenge,
    consume_verified_otp,
)
from ..services.user_service import (
    register_farmer,
    register_psychiatrist,
    register_warehouse_owner,
    authenticate_user,
    get_user_profile_details,
    get_user_by_identifier,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=MessageResponse)
@router.post("/resend-otp", response_model=MessageResponse)
def handle_send_otp(data: OtpSendRequest, db: Session = Depends(get_db)):
    """Dispatches a 6-digit OTP code to the provided mobile number."""
    success, message = generate_and_send_otp(data.mobile, data.purpose, db)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)
    return MessageResponse(success=True, message=message)


@router.post("/verify-otp", response_model=MessageResponse)
def handle_verify_otp(data: OtpVerifyRequest, db: Session = Depends(get_db)):
    """Verifies an OTP code against an active challenge."""
    success, message = verify_otp_challenge(data.mobile, data.otp_code, data.purpose, db)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return MessageResponse(success=True, message=message)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def handle_register(data: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new account.
    - For farmers: securely links to legacy farmer record if present (Scenario A) or creates new (Scenario B).
    - Public registration as 'admin' is strictly forbidden.
    """
    if data.role.lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public administrator registration is prohibited.",
        )

    try:
        user, profile, is_existing = register_farmer(data, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during account creation.",
        )

    # Issue tokens
    access_token, expires_in = create_access_token(user.id, user.role)
    raw_refresh_token, _ = create_refresh_token(user.id, db)
    db.commit()

    profile_details = get_user_profile_details(user, db)
    user_resp = UserResponse(
        id=user.id,
        mobile=user.mobile,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_suspended=user.is_suspended,
        created_at=user.created_at,
        profile_details=profile_details,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_resp,
    )


@router.post("/register/psychiatrist", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def handle_register_psychiatrist(data: PsychiatristRegisterRequest, db: Session = Depends(get_db)):
    """Registers a psychiatrist professional profile (pending admin approval)."""
    try:
        user, profile = register_psychiatrist(data, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    access_token, expires_in = create_access_token(user.id, user.role)
    raw_refresh_token, _ = create_refresh_token(user.id, db)
    db.commit()

    profile_details = get_user_profile_details(user, db)
    user_resp = UserResponse(
        id=user.id,
        mobile=user.mobile,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_suspended=user.is_suspended,
        created_at=user.created_at,
        profile_details=profile_details,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_resp,
    )


@router.post("/register/warehouse-owner", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def handle_register_warehouse_owner(data: WarehouseOwnerRegisterRequest, db: Session = Depends(get_db)):
    """Registers a warehouse owner professional profile (pending admin approval)."""
    try:
        user, profile = register_warehouse_owner(data, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    access_token, expires_in = create_access_token(user.id, user.role)
    raw_refresh_token, _ = create_refresh_token(user.id, db)
    db.commit()

    profile_details = get_user_profile_details(user, db)
    user_resp = UserResponse(
        id=user.id,
        mobile=user.mobile,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_suspended=user.is_suspended,
        created_at=user.created_at,
        profile_details=profile_details,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_resp,
    )


@router.post("/login", response_model=TokenResponse)
def handle_login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates a user via mobile/email and password, returning access and refresh tokens."""
    try:
        user = authenticate_user(data.identifier, data.password, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    access_token, expires_in = create_access_token(user.id, user.role)
    raw_refresh_token, _ = create_refresh_token(user.id, db)
    db.commit()

    profile_details = get_user_profile_details(user, db)
    user_resp = UserResponse(
        id=user.id,
        mobile=user.mobile,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_suspended=user.is_suspended,
        created_at=user.created_at,
        profile_details=profile_details,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_resp,
    )


@router.post("/refresh", response_model=TokenResponse)
def handle_refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rotates refresh token. Detects token reuse and revokes compromised sessions."""
    try:
        new_access_token, new_refresh_token, expires_in, user = rotate_refresh_token(
            data.refresh_token, db
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    profile_details = get_user_profile_details(user, db)
    user_resp = UserResponse(
        id=user.id,
        mobile=user.mobile,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_suspended=user.is_suspended,
        created_at=user.created_at,
        profile_details=profile_details,
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user_resp,
    )


@router.post("/logout", response_model=MessageResponse)
def handle_logout(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Logs out by revoking the provided refresh token."""
    revoke_refresh_token(data.refresh_token, db)
    return MessageResponse(success=True, message="Successfully logged out.")


@router.post("/logout-all", response_model=MessageResponse)
def handle_logout_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revokes all active refresh tokens for the current user."""
    revoked_count = revoke_all_user_tokens(current_user.id, db)
    return MessageResponse(
        success=True,
        message=f"All {revoked_count} active sessions have been logged out.",
    )


@router.post("/forgot-password", response_model=MessageResponse)
def handle_forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Triggers an OTP challenge for password reset without leaking account existence."""
    user = get_user_by_identifier(data.mobile, db)
    if user:
        generate_and_send_otp(data.mobile, "reset_password", db)
    # Always return success message to prevent user enumeration
    return MessageResponse(
        success=True,
        message="If this mobile number is registered, a password reset code has been sent.",
    )


@router.post("/reset-password", response_model=MessageResponse)
def handle_reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies OTP and resets user password, revoking previous sessions."""
    ok, msg = verify_otp_challenge(data.mobile, data.otp_code, "reset_password", db)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    user = get_user_by_identifier(data.mobile, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    try:
        # Atomic OTP consumption in the same transaction
        if not consume_verified_otp(data.mobile, "reset_password", db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP challenge is invalid, expired, or already consumed.",
            )

        user.password_hash = hash_password(data.new_password)
        revoke_all_user_tokens(user.id, db)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password due to an internal error.",
        )

    return MessageResponse(
        success=True,
        message="Password has been reset successfully. Please log in with your new credentials.",
    )


@router.get("/me", response_model=UserResponse)
def handle_get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns profile details and authentication status of the logged-in user."""
    profile_details = get_user_profile_details(current_user, db)
    return UserResponse(
        id=current_user.id,
        mobile=current_user.mobile,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_suspended=current_user.is_suspended,
        created_at=current_user.created_at,
        profile_details=profile_details,
    )
