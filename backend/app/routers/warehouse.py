from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.dependencies import get_current_user, require_roles, require_approved_professional
from ..models.auth_models import User, WarehouseOwnerProfile
from ..models.models import StorageFacility, StorageBooking
from ..schemas.portal_schemas import (
    WarehouseOwnerProfileDetail,
    WarehouseOwnerProfileUpdateRequest,
    WarehouseDashboardResponse,
    WarehouseFacilitiesResponse,
    WarehouseBookingsResponse,
)

router = APIRouter(prefix="/api/warehouse", tags=["Warehouse Owner Portal"])

SCHEMA_FACILITY_NOTICE = (
    "Direct facility and booking ownership linking is currently pending "
    "approved Alembic migration (003_warehouse_facility_ownership: warehouse_owner_id column "
    "in storage_facilities). Operational interface is functional."
)


def _compute_wh_status(user: User, profile: WarehouseOwnerProfile) -> str:
    if user.is_suspended:
        return "suspended"
    if not user.is_active:
        return "rejected"
    if not profile.is_approved:
        return "pending_approval"
    return "active"


def _build_wh_profile_detail(user: User, profile: WarehouseOwnerProfile) -> WarehouseOwnerProfileDetail:
    return WarehouseOwnerProfileDetail(
        user_id=user.id,
        profile_id=profile.id,
        email=user.email,
        mobile=user.mobile,
        company_name=profile.company_name,
        gstin=profile.gstin,
        is_approved=profile.is_approved,
        account_status=_compute_wh_status(user, profile),
        created_at=profile.created_at,
    )


# ═══════════════════════════════════════════════════════════════
# WAREHOUSE OWNER PROFILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@router.get("/me", response_model=WarehouseOwnerProfileDetail)
def get_my_warehouse_profile(
    current_user: User = Depends(require_roles("warehouse_owner")),
    db: Session = Depends(get_db),
):
    """Returns the authenticated warehouse owner's profile details."""
    profile = db.query(WarehouseOwnerProfile).filter_by(user_id=current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse owner profile not found.")
    return _build_wh_profile_detail(current_user, profile)


@router.put("/me", response_model=WarehouseOwnerProfileDetail)
def update_my_warehouse_profile(
    payload: WarehouseOwnerProfileUpdateRequest,
    current_user: User = Depends(require_roles("warehouse_owner")),
    db: Session = Depends(get_db),
):
    """
    Updates permitted business profile information for the authenticated warehouse owner.
    Security: Strictly rejects attempts to self-approve or modify role, user_id, or suspension.
    """
    profile = db.query(WarehouseOwnerProfile).filter_by(user_id=current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse owner profile not found.")

    if payload.company_name is not None:
        name = payload.company_name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company name must be at least 2 characters.")
        profile.company_name = name

    if payload.gstin is not None:
        profile.gstin = payload.gstin.strip().upper() if payload.gstin.strip() else None

    db.commit()
    db.refresh(profile)
    return _build_wh_profile_detail(current_user, profile)


# ═══════════════════════════════════════════════════════════════
# OPERATIONAL DASHBOARD (REQUIRES APPROVED STATUS)
# ═══════════════════════════════════════════════════════════════

@router.get("/me/dashboard", response_model=WarehouseDashboardResponse)
def get_warehouse_dashboard(
    current_user: User = Depends(require_approved_professional),
    db: Session = Depends(get_db),
):
    """
    Operational dashboard for approved warehouse owners.
    Enforces that unapproved/pending/rejected warehouse owners are denied (HTTP 403).
    """
    profile = db.query(WarehouseOwnerProfile).filter_by(user_id=current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse owner profile not found.")

    return WarehouseDashboardResponse(
        profile=_build_wh_profile_detail(current_user, profile),
        total_facilities=0,
        active_facilities=0,
        total_bookings=0,
        pending_bookings=0,
        schema_limitation_notice=SCHEMA_FACILITY_NOTICE,
    )


@router.get("/facilities", response_model=WarehouseFacilitiesResponse)
def get_warehouse_facilities(
    current_user: User = Depends(require_approved_professional),
    db: Session = Depends(get_db),
):
    """
    Returns facilities owned by the authenticated warehouse owner.
    Documents honest schema status: zero facilities claimed since storage_facilities
    lacks warehouse_owner_id in the un-migrated schema.
    """
    return WarehouseFacilitiesResponse(
        facilities=[],
        total=0,
        notice=SCHEMA_FACILITY_NOTICE,
    )


@router.get("/bookings", response_model=WarehouseBookingsResponse)
def get_warehouse_bookings(
    current_user: User = Depends(require_approved_professional),
    db: Session = Depends(get_db),
):
    """
    Returns booking requests for the owner's facilities.
    Documents honest schema status: requires facility ownership linkage.
    """
    return WarehouseBookingsResponse(
        bookings=[],
        total=0,
        notice=SCHEMA_FACILITY_NOTICE,
    )
