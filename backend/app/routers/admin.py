"""
Admin Portal API Router — BhoomiBandhu
Prompt 6: Administrative backend endpoints.

All endpoints require authenticated admin role with active account status.
The existing `require_roles("admin")` dependency chain already enforces:
  1. Valid JWT → get_current_user()
  2. is_suspended == False
  3. is_active == True
  4. role == "admin"

Audit logging: Logged via Python logger until a dedicated audit_log table is approved.
"""

import logging
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..core.database import get_db
from ..core.dependencies import require_roles
from ..models.auth_models import (
    User,
    FarmerProfile,
    PsychiatristProfile,
    WarehouseOwnerProfile,
)
from ..models.models import (
    Farmer,
    InsuranceRequest,
    PmfbyEnrollment,
    LoanApplication,
    MentalHealthRequest,
    StorageBooking,
)
from ..schemas.admin_schemas import (
    AdminUserListItem,
    AdminUserListResponse,
    AdminUserDetailResponse,
    UserStatusUpdateRequest,
    UserStatusUpdateResponse,
    PendingApprovalsResponse,
    PendingPsychiatrist,
    PendingWarehouseOwner,
    DashboardStatsResponse,
    InsuranceStatusUpdateRequest,
    InsuranceStatusUpdateResponse,
    LoanStatusUpdateRequest,
    LoanStatusUpdateResponse,
    AdminInsuranceItem,
    AdminInsuranceListResponse,
    AdminInsuranceDetailResponse,
    AdminPmfbyDetail,
    AdminInsuranceStatsResponse,
    AdminLoanItem,
    AdminLoanListResponse,
    AdminLoanDetailResponse,
    AdminLoanStatsResponse,
    AdminMentalHealthItem,
    AdminMentalHealthListResponse,
    MentalHealthAssignRequest,
    MentalHealthAssignResponse,
    MentalHealthStatusUpdateRequest,
)

logger = logging.getLogger("bhoomibandhu.admin")

router = APIRouter(prefix="/api/admin", tags=["Admin"])

VALID_ROLES = {"farmer", "psychiatrist", "warehouse_owner", "admin"}
VALID_STATUSES = {"active", "pending_approval", "suspended", "rejected"}

# Valid transitions for insurance (per DB constraint: pending → processing → approved/rejected → paid)
INSURANCE_VALID_TRANSITIONS = {
    "pending": {"processing", "approved", "rejected"},
    "processing": {"approved", "rejected"},
    "approved": {"paid"},
    "rejected": set(),
    "paid": set(),
}

# Valid transitions for loans (per DB constraint: pending → under_review → approved/rejected)
LOAN_VALID_TRANSITIONS = {
    "pending": {"under_review", "approved", "rejected"},
    "under_review": {"approved", "rejected"},
    "approved": set(),
    "rejected": set(),
}

# Valid transitions for mental health requests
MENTAL_HEALTH_VALID_TRANSITIONS = {
    "pending": {"contacted", "resolved"},
    "contacted": {"resolved"},
    "resolved": set(),
}


def _compute_account_status(user: User, db: Session) -> str:
    """
    Derives a human-readable account status from the User boolean flags
    and professional profile approval state.
    """
    if user.is_suspended:
        return "suspended"
    if not user.is_active:
        return "rejected"
    # Check professional approval
    if user.role == "psychiatrist":
        profile = db.query(PsychiatristProfile).filter_by(user_id=user.id).first()
        if profile and not profile.is_approved:
            return "pending_approval"
    elif user.role == "warehouse_owner":
        profile = db.query(WarehouseOwnerProfile).filter_by(user_id=user.id).first()
        if profile and not profile.is_approved:
            return "pending_approval"
    return "active"


def _audit_log(
    admin_id: int,
    action: str,
    target_type: str,
    target_id: int,
    previous_state: str,
    new_state: str,
    reason: Optional[str] = None,
):
    """
    Temporary audit logging via Python logger.
    A proper audit_log database table is proposed but requires migration approval.
    """
    logger.info(
        "ADMIN_AUDIT | admin_id=%s | action=%s | target=%s:%s | "
        "prev_state=%s | new_state=%s | reason=%s | timestamp=%s",
        admin_id,
        action,
        target_type,
        target_id,
        previous_state,
        new_state,
        reason or "",
        datetime.now(timezone.utc).isoformat(),
    )


# ═══════════════════════════════════════════════════════════════════
# TASK 1 — User Listing
# ═══════════════════════════════════════════════════════════════════

@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    role: Optional[str] = Query(None, description="Filter by user role"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by account status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Lists all users with optional role and status filters, paginated."""
    # Validate role filter
    if role and role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role filter. Allowed: {', '.join(sorted(VALID_ROLES))}",
        )

    query = db.query(User)

    # Apply role filter
    if role:
        query = query.filter(User.role == role)

    # Apply status filter — map human-readable status to boolean queries
    if status_filter:
        if status_filter not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter. Allowed: {', '.join(sorted(VALID_STATUSES))}",
            )
        if status_filter == "suspended":
            query = query.filter(User.is_suspended == True)
        elif status_filter == "rejected":
            query = query.filter(User.is_active == False, User.is_suspended == False)
        elif status_filter == "active":
            query = query.filter(User.is_active == True, User.is_suspended == False)
        elif status_filter == "pending_approval":
            query = query.filter(User.is_active == True, User.is_suspended == False)
            # Narrow to professionals whose profiles are not approved
            psych_ids = (
                db.query(PsychiatristProfile.user_id)
                .filter(PsychiatristProfile.is_approved == False)
                .subquery()
            )
            warehouse_ids = (
                db.query(WarehouseOwnerProfile.user_id)
                .filter(WarehouseOwnerProfile.is_approved == False)
                .subquery()
            )
            query = query.filter(
                User.role.in_(["psychiatrist", "warehouse_owner"]),
                (User.id.in_(psych_ids) | User.id.in_(warehouse_ids)),
            )

    total = query.count()
    offset = (page - 1) * per_page

    users = (
        query.order_by(User.created_at.desc(), User.id.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    items = []
    for u in users:
        items.append(
            AdminUserListItem(
                id=u.id,
                email=u.email,
                mobile=u.mobile,
                role=u.role,
                account_status=_compute_account_status(u, db),
                created_at=u.created_at,
            )
        )

    return AdminUserListResponse(
        users=items,
        total=total,
        page=page,
        per_page=per_page,
    )


# ═══════════════════════════════════════════════════════════════════
# TASK 2 — Individual User Details
# ═══════════════════════════════════════════════════════════════════

@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
def get_user_detail(
    user_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Returns detailed information for a single user, including role-specific profile."""
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    profile_data = None
    if user.role == "psychiatrist":
        p = db.query(PsychiatristProfile).filter_by(user_id=user.id).first()
        if p:
            profile_data = {
                "license_number": p.license_number,
                "specialization": p.specialization,
                "is_approved": p.is_approved,
                "availability_status": p.availability_status,
                "profile_created_at": p.created_at.isoformat() if p.created_at else None,
            }
    elif user.role == "warehouse_owner":
        p = db.query(WarehouseOwnerProfile).filter_by(user_id=user.id).first()
        if p:
            profile_data = {
                "company_name": p.company_name,
                "gstin": p.gstin,
                "is_approved": p.is_approved,
                "profile_created_at": p.created_at.isoformat() if p.created_at else None,
            }
    elif user.role == "farmer":
        fp = db.query(FarmerProfile).filter_by(user_id=user.id).first()
        if fp and fp.legacy_farmer:
            f = fp.legacy_farmer
            profile_data = {
                "farmer_profile_id": fp.id,
                "legacy_farmer_id": fp.legacy_farmer_id,
                "name": f.name,
                "state": f.state,
                "district": f.district,
                "village": f.village,
                "farmer_category": f.farmer_category,
                "primary_crop": f.primary_crop,
                # Sensitive fields (aadhaar, bank) intentionally excluded
            }

    return AdminUserDetailResponse(
        id=user.id,
        email=user.email,
        mobile=user.mobile,
        role=user.role,
        account_status=_compute_account_status(user, db),
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        profile=profile_data,
    )


# ═══════════════════════════════════════════════════════════════════
# TASK 3 — Account Status Management
# ═══════════════════════════════════════════════════════════════════

@router.patch("/users/{user_id}/status", response_model=UserStatusUpdateResponse)
def update_user_status(
    user_id: int,
    body: UserStatusUpdateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Updates a user's account status. Handles approval, suspension, rejection."""
    target_user = db.query(User).filter_by(id=user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Concurrency-Safe Last Active Administrator Protection
    # Uses deterministic row-level locking (ORDER BY id ASC FOR UPDATE) across all currently active
    # administrators. In PostgreSQL, this serializes concurrent administrative actions and forces
    # any racing transaction to re-read the updated state, preventing mutual-suspension race conditions
    # that could otherwise drop the active administrator count to zero.
    if target_user.role == "admin" and body.status.value in ("suspended", "rejected"):
        if target_user.is_active and not target_user.is_suspended:
            active_admins = (
                db.query(User)
                .filter(
                    User.role == "admin",
                    User.is_active == True,
                    User.is_suspended == False,
                )
                .order_by(User.id.asc())
                .with_for_update()
                .all()
            )
            if len(active_admins) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot suspend or reject the last active administrator.",
                )
            # Refresh target_user to observe any concurrent state commit while waiting for the row lock
            db.refresh(target_user)

    # Prevent self-suspension/rejection (when multiple admins exist)
    if target_user.id == current_user.id and body.status.value in ("suspended", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot suspend or reject your own admin account.",
        )

    previous_status = _compute_account_status(target_user, db)
    target_status = body.status.value

    # Validate transitions
    if previous_status == target_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is already in '{target_status}' status.",
        )

    try:
        if target_status == "active":
            # Activate / Approve
            target_user.is_active = True
            target_user.is_suspended = False

            # If psychiatrist, approve the professional profile
            if target_user.role == "psychiatrist":
                profile = db.query(PsychiatristProfile).filter_by(user_id=target_user.id).first()
                if not profile:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Psychiatrist profile not found. Cannot approve.",
                    )
                if not profile.license_number or not str(profile.license_number).strip():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot approve: license number is missing.",
                    )
                profile.is_approved = True
                # NOTE: verified_at and verified_by_admin_id columns do not exist yet.
                # A migration is proposed in the audit report.

            # If warehouse owner, approve the professional profile
            elif target_user.role == "warehouse_owner":
                profile = db.query(WarehouseOwnerProfile).filter_by(user_id=target_user.id).first()
                if not profile:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Warehouse owner profile not found. Cannot approve.",
                    )
                if not profile.company_name or not str(profile.company_name).strip():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot approve: business name is missing.",
                    )
                profile.is_approved = True

        elif target_status == "suspended":
            target_user.is_suspended = True

        elif target_status == "rejected":
            target_user.is_active = False
            target_user.is_suspended = False
            # Also revoke professional approval
            if target_user.role == "psychiatrist":
                profile = db.query(PsychiatristProfile).filter_by(user_id=target_user.id).first()
                if profile:
                    profile.is_approved = False
            elif target_user.role == "warehouse_owner":
                profile = db.query(WarehouseOwnerProfile).filter_by(user_id=target_user.id).first()
                if profile:
                    profile.is_approved = False

        db.commit()

        _audit_log(
            admin_id=current_user.id,
            action=f"user_status_{target_status}",
            target_type="user",
            target_id=target_user.id,
            previous_state=previous_status,
            new_state=target_status,
            reason=body.reason,
        )

        return UserStatusUpdateResponse(
            success=True,
            user_id=target_user.id,
            new_status=target_status,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user status.",
        )


# ═══════════════════════════════════════════════════════════════════
# TASK 4 — Pending Approvals
# ═══════════════════════════════════════════════════════════════════

@router.get("/pending-approvals", response_model=PendingApprovalsResponse)
def get_pending_approvals(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Lists all professional accounts pending administrative approval."""
    # Pending psychiatrists
    psych_rows = (
        db.query(User, PsychiatristProfile)
        .join(PsychiatristProfile, PsychiatristProfile.user_id == User.id)
        .filter(
            PsychiatristProfile.is_approved == False,
            User.is_active == True,
            User.is_suspended == False,
        )
        .order_by(User.created_at.asc())
        .all()
    )

    psychiatrists = []
    for u, p in psych_rows:
        psychiatrists.append(
            PendingPsychiatrist(
                user_id=u.id,
                email=u.email,
                full_name=None,  # User model doesn't have name; registration name is only on Farmer
                license_number=p.license_number,
                specialization=p.specialization,
                registration_date=u.created_at,
            )
        )

    # Pending warehouse owners
    wh_rows = (
        db.query(User, WarehouseOwnerProfile)
        .join(WarehouseOwnerProfile, WarehouseOwnerProfile.user_id == User.id)
        .filter(
            WarehouseOwnerProfile.is_approved == False,
            User.is_active == True,
            User.is_suspended == False,
        )
        .order_by(User.created_at.asc())
        .all()
    )

    warehouse_owners = []
    for u, wp in wh_rows:
        warehouse_owners.append(
            PendingWarehouseOwner(
                user_id=u.id,
                email=u.email,
                full_name=None,
                company_name=wp.company_name,
                gstin=wp.gstin,
                contact_mobile=u.mobile,
                registration_date=u.created_at,
            )
        )

    total = len(psychiatrists) + len(warehouse_owners)
    return PendingApprovalsResponse(
        psychiatrists=psychiatrists,
        warehouse_owners=warehouse_owners,
        total=total,
    )


# ═══════════════════════════════════════════════════════════════════
# TASK 5 — Dashboard Statistics
# ═══════════════════════════════════════════════════════════════════

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Returns aggregate dashboard statistics from all domain tables."""
    # User counts by role (only active, non-suspended)
    total_farmers = (
        db.query(func.count(User.id))
        .filter(User.role == "farmer", User.is_active == True, User.is_suspended == False)
        .scalar() or 0
    )
    total_psychiatrists = (
        db.query(func.count(User.id))
        .filter(User.role == "psychiatrist", User.is_active == True, User.is_suspended == False)
        .scalar() or 0
    )
    total_warehouse_owners = (
        db.query(func.count(User.id))
        .filter(User.role == "warehouse_owner", User.is_active == True, User.is_suspended == False)
        .scalar() or 0
    )

    # Pending approvals
    pending_psych = (
        db.query(func.count(PsychiatristProfile.id))
        .join(User, User.id == PsychiatristProfile.user_id)
        .filter(
            PsychiatristProfile.is_approved == False,
            User.is_active == True,
            User.is_suspended == False,
        )
        .scalar() or 0
    )
    pending_wh = (
        db.query(func.count(WarehouseOwnerProfile.id))
        .join(User, User.id == WarehouseOwnerProfile.user_id)
        .filter(
            WarehouseOwnerProfile.is_approved == False,
            User.is_active == True,
            User.is_suspended == False,
        )
        .scalar() or 0
    )
    pending_approvals = pending_psych + pending_wh

    # Insurance
    total_insurance = db.query(func.count(InsuranceRequest.id)).scalar() or 0
    pending_insurance = (
        db.query(func.count(InsuranceRequest.id))
        .filter(InsuranceRequest.req_status == "pending")
        .scalar() or 0
    )

    # Loans
    total_loans = db.query(func.count(LoanApplication.id)).scalar() or 0
    pending_loans = (
        db.query(func.count(LoanApplication.id))
        .filter(LoanApplication.app_status == "pending")
        .scalar() or 0
    )

    # Mental health
    total_mh = db.query(func.count(MentalHealthRequest.id)).scalar() or 0
    pending_mh = (
        db.query(func.count(MentalHealthRequest.id))
        .filter(MentalHealthRequest.req_status == "pending")
        .scalar() or 0
    )

    # Storage
    total_bookings = db.query(func.count(StorageBooking.id)).scalar() or 0
    active_bookings = (
        db.query(func.count(StorageBooking.id))
        .filter(StorageBooking.booking_status == "active")
        .scalar() or 0
    )

    return DashboardStatsResponse(
        total_farmers=total_farmers,
        total_psychiatrists=total_psychiatrists,
        total_warehouse_owners=total_warehouse_owners,
        pending_approvals=pending_approvals,
        total_insurance_requests=total_insurance,
        pending_insurance_requests=pending_insurance,
        total_loan_applications=total_loans,
        pending_loan_applications=pending_loans,
        total_mental_health_requests=total_mh,
        pending_mental_health_requests=pending_mh,
        total_storage_bookings=total_bookings,
        active_storage_bookings=active_bookings,
    )


# ═══════════════════════════════════════════════════════════════════
# TASK 6 — Insurance Request Status Management & Administration
# ═══════════════════════════════════════════════════════════════════

@router.get("/insurance-stats", response_model=AdminInsuranceStatsResponse)
@router.get("/insurance/stats", response_model=AdminInsuranceStatsResponse)
def get_insurance_stats(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Returns granular statistics for insurance requests and PMFBY enrollments."""
    total = db.query(func.count(InsuranceRequest.id)).scalar() or 0
    pending = db.query(func.count(InsuranceRequest.id)).filter(InsuranceRequest.req_status == "pending").scalar() or 0
    processing = db.query(func.count(InsuranceRequest.id)).filter(InsuranceRequest.req_status == "processing").scalar() or 0
    approved = db.query(func.count(InsuranceRequest.id)).filter(InsuranceRequest.req_status == "approved").scalar() or 0
    rejected = db.query(func.count(InsuranceRequest.id)).filter(InsuranceRequest.req_status == "rejected").scalar() or 0
    paid = db.query(func.count(InsuranceRequest.id)).filter(InsuranceRequest.req_status == "paid").scalar() or 0
    total_pmfby = db.query(func.count(PmfbyEnrollment.id)).scalar() or 0

    return AdminInsuranceStatsResponse(
        total=total,
        pending=pending,
        processing=processing,
        approved=approved,
        rejected=rejected,
        paid=paid,
        total_pmfby=total_pmfby,
    )


@router.get("/insurance-requests", response_model=AdminInsuranceListResponse)
@router.get("/insurance", response_model=AdminInsuranceListResponse)
def list_insurance_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Lists insurance requests with optional status and search filters, paginated."""
    query = db.query(InsuranceRequest)

    if status_filter:
        valid_insurance_statuses = {"pending", "processing", "approved", "rejected", "paid"}
        if status_filter not in valid_insurance_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Allowed: {', '.join(sorted(valid_insurance_statuses))}",
            )
        query = query.filter(InsuranceRequest.req_status == status_filter)

    if search:
        search_term = search.strip()
        if search_term.isdigit():
            query = query.filter(
                or_(
                    InsuranceRequest.id == int(search_term),
                    InsuranceRequest.farmer_name.ilike(f"%{search_term}%"),
                )
            )
        else:
            query = query.filter(
                or_(
                    InsuranceRequest.farmer_name.ilike(f"%{search_term}%"),
                    InsuranceRequest.crop_name.ilike(f"%{search_term}%"),
                    InsuranceRequest.district.ilike(f"%{search_term}%"),
                )
            )

    total = query.count()
    offset = (page - 1) * per_page
    rows = (
        query.order_by(InsuranceRequest.submitted_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    items = [
        AdminInsuranceItem(
            id=r.id,
            farmer_name=r.farmer_name,
            district=r.district,
            crop_name=r.crop_name,
            request_type=r.request_type,
            req_status=r.req_status,
            submitted_at=r.submitted_at,
        )
        for r in rows
    ]

    return AdminInsuranceListResponse(
        requests=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/insurance-requests/{request_id}", response_model=AdminInsuranceDetailResponse)
@router.get("/insurance/{request_id}", response_model=AdminInsuranceDetailResponse)
def get_insurance_request_detail(
    request_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Returns comprehensive details for an insurance request including PMFBY enrollment and farmer contact info."""
    ins_req = db.query(InsuranceRequest).filter_by(id=request_id).first()
    if not ins_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insurance request not found.")

    farmer_mobile = None
    state = None
    if ins_req.farmer_id:
        farmer = db.query(Farmer).filter_by(farmer_id=ins_req.farmer_id).first()
        if farmer:
            farmer_mobile = farmer.mobile
            state = farmer.state

    pmfby = db.query(PmfbyEnrollment).filter_by(insurance_request_id=ins_req.id).first()
    pmfby_detail = None
    if pmfby:
        pmfby_detail = AdminPmfbyDetail(
            id=pmfby.id,
            crop_name=pmfby.crop_name,
            land_records_verified=bool(pmfby.land_records_verified),
            sowing_date=pmfby.sowing_date,
            season=pmfby.season,
            premium_calculated=float(pmfby.premium_calculated) if pmfby.premium_calculated is not None else None,
            enrollment_date=pmfby.enrollment_date,
        )

    return AdminInsuranceDetailResponse(
        id=ins_req.id,
        farmer_id=ins_req.farmer_id,
        farmer_name=ins_req.farmer_name,
        farmer_mobile=farmer_mobile,
        state=state,
        district=ins_req.district,
        crop_name=ins_req.crop_name,
        request_type=ins_req.request_type,
        description=ins_req.description,
        req_status=ins_req.req_status,
        submitted_at=ins_req.submitted_at,
        updated_at=ins_req.updated_at,
        pmfby_enrollment=pmfby_detail,
    )


@router.patch("/insurance-requests/{request_id}/status", response_model=InsuranceStatusUpdateResponse)
@router.patch("/insurance/{request_id}/status", response_model=InsuranceStatusUpdateResponse)
def update_insurance_status(
    request_id: int,
    body: InsuranceStatusUpdateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Updates insurance request status with valid transition enforcement."""
    ins_req = db.query(InsuranceRequest).filter_by(id=request_id).first()
    if not ins_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insurance request not found.")

    current_status = ins_req.req_status
    new_status = body.status.value

    # Validate transition
    allowed = INSURANCE_VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_status}' to '{new_status}'. "
                   f"Allowed: {', '.join(sorted(allowed)) if allowed else 'none'}",
        )

    try:
        ins_req.req_status = new_status
        db.commit()

        _audit_log(
            admin_id=current_user.id,
            action="insurance_status_change",
            target_type="insurance_request",
            target_id=ins_req.id,
            previous_state=current_status,
            new_state=new_status,
            reason=body.notes,
        )

        return InsuranceStatusUpdateResponse(
            success=True,
            request_id=ins_req.id,
            new_status=new_status,
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update insurance request status.",
        )


# ═══════════════════════════════════════════════════════════════════
# TASK 7 — Loan Application Status Management & Administration
# ═══════════════════════════════════════════════════════════════════

@router.get("/loan-stats", response_model=AdminLoanStatsResponse)
@router.get("/loans/stats", response_model=AdminLoanStatsResponse)
def get_loan_stats(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Returns granular statistics for loan applications."""
    total = db.query(func.count(LoanApplication.id)).scalar() or 0
    pending = db.query(func.count(LoanApplication.id)).filter(LoanApplication.app_status == "pending").scalar() or 0
    under_review = db.query(func.count(LoanApplication.id)).filter(LoanApplication.app_status == "under_review").scalar() or 0
    approved = db.query(func.count(LoanApplication.id)).filter(LoanApplication.app_status == "approved").scalar() or 0
    rejected = db.query(func.count(LoanApplication.id)).filter(LoanApplication.app_status == "rejected").scalar() or 0

    return AdminLoanStatsResponse(
        total=total,
        pending=pending,
        under_review=under_review,
        approved=approved,
        rejected=rejected,
    )


@router.get("/loan-applications", response_model=AdminLoanListResponse)
@router.get("/loans", response_model=AdminLoanListResponse)
def list_loan_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Lists loan applications with optional status and search filters, paginated."""
    query = db.query(LoanApplication)

    if status_filter:
        valid_loan_statuses = {"pending", "under_review", "approved", "rejected"}
        if status_filter not in valid_loan_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Allowed: {', '.join(sorted(valid_loan_statuses))}",
            )
        query = query.filter(LoanApplication.app_status == status_filter)

    if search:
        search_term = search.strip()
        if search_term.isdigit():
            query = query.filter(
                or_(
                    LoanApplication.id == int(search_term),
                    LoanApplication.farmer_name.ilike(f"%{search_term}%"),
                )
            )
        else:
            query = query.filter(
                or_(
                    LoanApplication.farmer_name.ilike(f"%{search_term}%"),
                    LoanApplication.village.ilike(f"%{search_term}%"),
                    LoanApplication.loan_type.ilike(f"%{search_term}%"),
                )
            )

    total = query.count()
    offset = (page - 1) * per_page
    rows = (
        query.order_by(LoanApplication.submitted_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    items = [
        AdminLoanItem(
            id=r.id,
            farmer_name=r.farmer_name,
            village=r.village,
            loan_amount=float(r.loan_amount),
            loan_type=r.loan_type,
            app_status=r.app_status,
            submitted_at=r.submitted_at,
        )
        for r in rows
    ]

    return AdminLoanListResponse(
        applications=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/loan-applications/{application_id}", response_model=AdminLoanDetailResponse)
@router.get("/loans/{application_id}", response_model=AdminLoanDetailResponse)
def get_loan_application_detail(
    application_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Returns comprehensive details for a loan application including farmer details and purpose."""
    loan = db.query(LoanApplication).filter_by(id=application_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan application not found.")

    farmer_mobile = None
    state = None
    if loan.farmer_id:
        farmer = db.query(Farmer).filter_by(farmer_id=loan.farmer_id).first()
        if farmer:
            farmer_mobile = farmer.mobile
            state = farmer.state

    return AdminLoanDetailResponse(
        id=loan.id,
        farmer_id=loan.farmer_id,
        farmer_name=loan.farmer_name,
        farmer_mobile=farmer_mobile,
        state=state,
        village=loan.village,
        loan_amount=float(loan.loan_amount),
        loan_type=loan.loan_type,
        purpose=loan.purpose,
        app_status=loan.app_status,
        submitted_at=loan.submitted_at,
        reviewed_at=loan.reviewed_at,
    )


@router.patch("/loan-applications/{application_id}/status", response_model=LoanStatusUpdateResponse)
@router.patch("/loans/{application_id}/status", response_model=LoanStatusUpdateResponse)
def update_loan_status(
    application_id: int,
    body: LoanStatusUpdateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Updates loan application status with valid transition enforcement."""
    loan = db.query(LoanApplication).filter_by(id=application_id).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan application not found.")

    current_status = loan.app_status
    new_status = body.status.value

    allowed = LOAN_VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_status}' to '{new_status}'. "
                   f"Allowed: {', '.join(sorted(allowed)) if allowed else 'none'}",
        )

    try:
        loan.app_status = new_status
        # reviewed_at exists on the model — set it for review actions
        if new_status in ("under_review", "approved", "rejected"):
            loan.reviewed_at = datetime.now(timezone.utc)

        db.commit()

        _audit_log(
            admin_id=current_user.id,
            action="loan_status_change",
            target_type="loan_application",
            target_id=loan.id,
            previous_state=current_status,
            new_state=new_status,
            reason=body.notes,
        )

        return LoanStatusUpdateResponse(
            success=True,
            application_id=loan.id,
            new_status=new_status,
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update loan application status.",
        )


# ═══════════════════════════════════════════════════════════════════
# TASK 8 — Mental Health Administration
# ═══════════════════════════════════════════════════════════════════

@router.get("/mental-health-requests", response_model=AdminMentalHealthListResponse)
def list_mental_health_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """
    Lists mental health requests for administrative purposes.
    Returns ONLY operational fields — no message content or clinical notes.
    """
    query = db.query(MentalHealthRequest)

    if status_filter:
        valid_mh_statuses = {"pending", "contacted", "resolved"}
        if status_filter not in valid_mh_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Allowed: {', '.join(sorted(valid_mh_statuses))}",
            )
        query = query.filter(MentalHealthRequest.req_status == status_filter)

    total = query.count()
    offset = (page - 1) * per_page
    rows = (
        query.order_by(MentalHealthRequest.submitted_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    # Intentionally omit .message and .mobile for privacy
    items = [
        AdminMentalHealthItem(
            id=r.id,
            farmer_name=r.farmer_name,
            concern_type=r.concern_type,
            req_status=r.req_status,
            submitted_at=r.submitted_at,
        )
        for r in rows
    ]

    return AdminMentalHealthListResponse(
        requests=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.patch("/mental-health-requests/{request_id}/status")
def update_mental_health_status(
    request_id: int,
    body: MentalHealthStatusUpdateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Updates mental health request status."""
    mh_req = db.query(MentalHealthRequest).filter_by(id=request_id).first()
    if not mh_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mental health request not found.")

    current_status = mh_req.req_status
    new_status = body.status.value

    allowed = MENTAL_HEALTH_VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_status}' to '{new_status}'. "
                   f"Allowed: {', '.join(sorted(allowed)) if allowed else 'none'}",
        )

    try:
        mh_req.req_status = new_status
        db.commit()

        _audit_log(
            admin_id=current_user.id,
            action="mental_health_status_change",
            target_type="mental_health_request",
            target_id=mh_req.id,
            previous_state=current_status,
            new_state=new_status,
            reason=body.notes,
        )

        return {"success": True, "request_id": mh_req.id, "new_status": new_status}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update mental health request status.",
        )


@router.patch("/mental-health-requests/{request_id}/assign", response_model=MentalHealthAssignResponse)
def assign_mental_health_request(
    request_id: int,
    body: MentalHealthAssignRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """
    Validates a mental health assignment request against a target psychiatrist.

    OPERATIONAL BEHAVIOR:
    - Psychiatrist validation is performed (validates existence, 'psychiatrist' role,
      active account status, non-suspended state, and approved professional profile).
    - Assignment is NOT persisted: The database schema (MentalHealthRequest) lacks
      `assigned_psychiatrist_id` and `appointment_at` columns.
    - Request status is NOT modified: The request status remains in its current state
      (e.g., 'pending') and is not altered as a proxy for assignment.
    - An approved Alembic schema migration is required before psychiatrist assignments
      can be persisted to the database.
    - Returns success=False to honestly communicate that assignment was not persisted.
    """
    mh_req = db.query(MentalHealthRequest).filter_by(id=request_id).first()
    if not mh_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mental health request not found.")

    # Validate psychiatrist
    psych_user = db.query(User).filter_by(id=body.psychiatrist_user_id).first()
    if not psych_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Psychiatrist user not found.")

    if psych_user.role != "psychiatrist":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not a psychiatrist.",
        )

    if psych_user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign to a suspended psychiatrist.",
        )

    if not psych_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign to an inactive psychiatrist.",
        )

    psych_profile = db.query(PsychiatristProfile).filter_by(user_id=psych_user.id).first()
    if not psych_profile or not psych_profile.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign to a psychiatrist who has not been professionally verified.",
        )

    # SCHEMA LIMITATION: The MentalHealthRequest model does not have
    # `assigned_psychiatrist_id` or `appointment_at` columns.
    # Per Prompt 6B requirements:
    # 1. Do not use status as a substitute for assignment.
    # 2. Do not pretend assignment is complete.
    # 3. Request status remains unmodified.
    _audit_log(
        admin_id=current_user.id,
        action="mental_health_assign_validation",
        target_type="mental_health_request",
        target_id=mh_req.id,
        previous_state=mh_req.req_status,
        new_state=mh_req.req_status,
        reason=f"Psychiatrist (user {psych_user.id}) validated. Assignment persistence not supported without schema migration.",
    )

    return MentalHealthAssignResponse(
        success=False,
        request_id=mh_req.id,
        message=(
            f"Psychiatrist (user {psych_user.id}) validated successfully. "
            "However, assignment identity cannot be persisted because 'assigned_psychiatrist_id' "
            "column is missing from 'mental_health_requests' schema. Status was not modified. "
            "Schema migration required."
        ),
    )
