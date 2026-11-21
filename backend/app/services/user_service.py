from typing import Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..models.models import Farmer
from ..models.auth_models import (
    User,
    FarmerProfile,
    PsychiatristProfile,
    WarehouseOwnerProfile,
)
from ..schemas.auth_schemas import (
    UserRegisterRequest,
    PsychiatristRegisterRequest,
    WarehouseOwnerRegisterRequest,
)
from .auth_service import hash_password, verify_password
from .otp_service import (
    is_mobile_preverified,
    verify_otp_challenge,
    consume_verified_otp,
)


def get_user_by_identifier(identifier: str, db: Session) -> Optional[User]:
    """Retrieves a user by normalized mobile number or email address."""
    clean = identifier.strip().lower()
    return (
        db.query(User)
        .filter(or_(User.mobile == identifier.strip(), User.email == clean))
        .first()
    )


def register_farmer(data: UserRegisterRequest, db: Session) -> Tuple[User, FarmerProfile, bool]:
    """
    Registers a farmer account with atomic transaction guarantees.
    - If legacy Farmer exists with matching mobile: links securely (Scenario A).
    - If new farmer: creates User, Farmer, and FarmerProfile atomically (Scenario B).
    - Pre-verifies mobile ownership using OTP.
    Returns (user, farmer_profile, is_existing_linked: bool).
    """
    # 1. Duplicate check in users
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise ValueError("Mobile number is already registered to an account.")
    if data.email and db.query(User).filter(User.email == data.email).first():
        raise ValueError("Email address is already registered.")

    # 2. Gate OTP verification
    verified = False
    if data.otp_code:
        ok, _ = verify_otp_challenge(data.mobile, data.otp_code, "registration", db)
        verified = ok
    else:
        verified = is_mobile_preverified(data.mobile, "registration", db)

    if not verified:
        raise ValueError("Mobile ownership must be verified via OTP before registration.")

    # 3. Check for existing legacy farmer
    legacy_farmer = db.query(Farmer).filter_by(mobile=data.mobile).first()
    pwd_hash = hash_password(data.password)

    try:
        # Atomic OTP consumption in the same transaction
        if not consume_verified_otp(data.mobile, "registration", db):
            raise ValueError("OTP is invalid, expired, or already consumed.")

        if legacy_farmer:
            # Scenario A: Existing Farmer Linkage
            existing_link = (
                db.query(FarmerProfile)
                .filter_by(legacy_farmer_id=legacy_farmer.farmer_id)
                .first()
            )
            if existing_link:
                raise ValueError("This farmer record is already claimed by an existing account.")

            new_user = User(
                mobile=data.mobile,
                email=data.email,
                password_hash=pwd_hash,
                role="farmer",
                is_active=True,
                is_suspended=False,
                is_verified=True,
            )
            db.add(new_user)
            db.flush()

            profile = FarmerProfile(
                user_id=new_user.id,
                legacy_farmer_id=legacy_farmer.farmer_id,
            )
            db.add(profile)
            db.commit()
            db.refresh(new_user)
            db.refresh(profile)
            return new_user, profile, True

        else:
            # Scenario B: New Farmer Creation
            new_user = User(
                mobile=data.mobile,
                email=data.email,
                password_hash=pwd_hash,
                role="farmer",
                is_active=True,
                is_suspended=False,
                is_verified=True,
            )
            db.add(new_user)
            db.flush()

            new_farmer = Farmer(
                name=data.name,
                mobile=data.mobile,
                state=data.state or "Haryana",
                email=data.email,
                district=data.district,
                village=data.village,
                farmer_category=data.farmer_category or "small",
                primary_crop=data.primary_crop,
            )
            db.add(new_farmer)
            db.flush()

            profile = FarmerProfile(
                user_id=new_user.id,
                legacy_farmer_id=new_farmer.farmer_id,
            )
            db.add(profile)
            db.commit()
            db.refresh(new_user)
            db.refresh(profile)
            return new_user, profile, False

    except Exception:
        db.rollback()
        raise


def register_psychiatrist(data: PsychiatristRegisterRequest, db: Session) -> Tuple[User, PsychiatristProfile]:
    """Registers a psychiatrist professional profile (pending admin approval)."""
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise ValueError("Mobile number is already registered.")
    if data.email and db.query(User).filter(User.email == data.email).first():
        raise ValueError("Email address is already registered.")
    if db.query(PsychiatristProfile).filter_by(license_number=data.license_number).first():
        raise ValueError("License number is already registered.")

    # OTP check
    verified = False
    if data.otp_code:
        ok, _ = verify_otp_challenge(data.mobile, data.otp_code, "registration", db)
        verified = ok
    else:
        verified = is_mobile_preverified(data.mobile, "registration", db)

    if not verified:
        raise ValueError("Mobile ownership must be verified via OTP before registration.")

    pwd_hash = hash_password(data.password)
    try:
        # Atomic OTP consumption in the same transaction
        if not consume_verified_otp(data.mobile, "registration", db):
            raise ValueError("OTP is invalid, expired, or already consumed.")

        new_user = User(
            mobile=data.mobile,
            email=data.email,
            password_hash=pwd_hash,
            role="psychiatrist",
            is_active=True,
            is_suspended=False,
            is_verified=True,
        )
        db.add(new_user)
        db.flush()

        profile = PsychiatristProfile(
            user_id=new_user.id,
            license_number=data.license_number,
            specialization=data.specialization,
            is_approved=False,  # Requires administrative approval
            availability_status="available",
        )
        db.add(profile)
        db.commit()
        db.refresh(new_user)
        db.refresh(profile)
        return new_user, profile
    except Exception:
        db.rollback()
        raise


def register_warehouse_owner(data: WarehouseOwnerRegisterRequest, db: Session) -> Tuple[User, WarehouseOwnerProfile]:
    """Registers a storage facility owner profile (pending admin approval)."""
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise ValueError("Mobile number is already registered.")
    if data.email and db.query(User).filter(User.email == data.email).first():
        raise ValueError("Email address is already registered.")
    if data.gstin and db.query(WarehouseOwnerProfile).filter_by(gstin=data.gstin).first():
        raise ValueError("GSTIN is already registered to an account.")

    # OTP check
    verified = False
    if data.otp_code:
        ok, _ = verify_otp_challenge(data.mobile, data.otp_code, "registration", db)
        verified = ok
    else:
        verified = is_mobile_preverified(data.mobile, "registration", db)

    if not verified:
        raise ValueError("Mobile ownership must be verified via OTP before registration.")

    pwd_hash = hash_password(data.password)
    try:
        # Atomic OTP consumption in the same transaction
        if not consume_verified_otp(data.mobile, "registration", db):
            raise ValueError("OTP is invalid, expired, or already consumed.")

        new_user = User(
            mobile=data.mobile,
            email=data.email,
            password_hash=pwd_hash,
            role="warehouse_owner",
            is_active=True,
            is_suspended=False,
            is_verified=True,
        )
        db.add(new_user)
        db.flush()

        profile = WarehouseOwnerProfile(
            user_id=new_user.id,
            company_name=data.company_name,
            gstin=data.gstin,
            is_approved=False,  # Requires administrative approval
        )
        db.add(profile)
        db.commit()
        db.refresh(new_user)
        db.refresh(profile)
        return new_user, profile
    except Exception:
        db.rollback()
        raise


def authenticate_user(identifier: str, password: str, db: Session) -> User:
    """
    Authenticates a user by identifier (mobile or email) and password.
    Enforces active and non-suspended status.
    """
    user = get_user_by_identifier(identifier, db)
    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid mobile number/email or password.")

    if user.is_suspended:
        raise PermissionError("Your account has been suspended. Please contact customer support.")

    if not user.is_active:
        raise PermissionError("Your account is currently deactivated.")

    if not user.is_verified:
        raise PermissionError("Account mobile number is not verified.")

    return user


def get_user_profile_details(user: User, db: Session) -> Dict[str, Any]:
    """Returns role-specific profile details for the authenticated user."""
    details: Dict[str, Any] = {"role": user.role}
    if user.role == "farmer":
        profile = db.query(FarmerProfile).filter_by(user_id=user.id).first()
        if profile:
            details["farmer_profile_id"] = profile.id
            details["legacy_farmer_id"] = profile.legacy_farmer_id
            if profile.legacy_farmer:
                details["name"] = profile.legacy_farmer.name
                details["state"] = profile.legacy_farmer.state
                details["district"] = profile.legacy_farmer.district
                details["village"] = profile.legacy_farmer.village
                details["primary_crop"] = profile.legacy_farmer.primary_crop
    elif user.role == "psychiatrist":
        profile = db.query(PsychiatristProfile).filter_by(user_id=user.id).first()
        if profile:
            details["psychiatrist_profile_id"] = profile.id
            details["license_number"] = profile.license_number
            details["specialization"] = profile.specialization
            details["is_approved"] = profile.is_approved
            details["availability_status"] = profile.availability_status
    elif user.role == "warehouse_owner":
        profile = db.query(WarehouseOwnerProfile).filter_by(user_id=user.id).first()
        if profile:
            details["warehouse_owner_profile_id"] = profile.id
            details["company_name"] = profile.company_name
            details["gstin"] = profile.gstin
            details["is_approved"] = profile.is_approved
    return details
