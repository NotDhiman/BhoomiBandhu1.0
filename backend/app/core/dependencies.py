from typing import List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from .database import get_db
from ..models.auth_models import User, FarmerProfile, PsychiatristProfile, WarehouseOwnerProfile
from ..services.auth_service import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Extracts and validates JWT access token from the Authorization header.
    Returns the active, non-suspended User model instance.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        token_type = payload.get("type")
        user_id_str = payload.get("sub")
        if token_type != "access" or not user_id_str:
            raise credentials_exception
        user_id = int(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise credentials_exception

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Access denied.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Access denied.",
        )

    return user


def require_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """Explicit dependency ensuring the caller is authenticated."""
    return current_user


def require_roles(*allowed_roles: str) -> Callable:
    """Dependency factory restricting endpoint access to specific user roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {allowed_roles}",
            )
        return current_user

    return role_checker


def require_approved_professional(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """
    Ensures that professional users (psychiatrists, warehouse owners)
    have been reviewed and approved by an administrator before accessing operational dashboards.
    """
    if current_user.role == "psychiatrist":
        profile = db.query(PsychiatristProfile).filter_by(user_id=current_user.id).first()
        if not profile or not profile.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Psychiatrist account is pending administrative approval.",
            )
    elif current_user.role == "warehouse_owner":
        profile = db.query(WarehouseOwnerProfile).filter_by(user_id=current_user.id).first()
        if not profile or not profile.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Warehouse owner account is pending administrative approval.",
            )
    elif current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operational dashboard restricted to approved professionals and administrators.",
        )

    return current_user


def get_current_farmer_id(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> int:
    """
    Resolves the authenticated farmer's legacy `farmer_id`.
    Used to scope all domain queries strictly to the caller's verified identity.
    """
    if current_user.role != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to farmer accounts.",
        )

    profile = db.query(FarmerProfile).filter_by(user_id=current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found.",
        )

    return profile.legacy_farmer_id
