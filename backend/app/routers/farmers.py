from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..core.dependencies import get_current_user, get_current_farmer_id, require_roles
from ..models.auth_models import User, FarmerProfile
from ..models.models import (
    Farmer,
    InsuranceRequest,
    PmfbyEnrollment,
    LoanApplication,
    StorageBooking,
    StorageFacility,
    GovernmentScheme,
    SchemeEligibilityCheck,
)
from ..schemas.schemas import FarmerProfileCreate, FarmerProfileResponse
from ..schemas.portal_schemas import (
    FarmerProfileDetail,
    FarmerProfileUpdateRequest,
    FarmerDashboardResponse,
    FarmerInsuranceSummaryItem,
    FarmerLoanSummaryItem,
    FarmerBookingSummaryItem,
    FarmerInsuranceListResponse,
    FarmerLoanListResponse,
    FarmerBookingListResponse,
    FarmerSchemeItem,
    FarmerEligibilityCheckItem,
    FarmerSchemeListResponse,
)
from ..services.farmer_service import is_valid_mobile, upsert_farmer

router = APIRouter(tags=["Farmer Dashboard"])


def _calculate_profile_completion(farmer: Farmer) -> int:
    """Calculates profile completion percentage across 10 key profile fields."""
    fields = [
        farmer.name,
        farmer.mobile,
        farmer.state,
        farmer.district,
        farmer.village,
        farmer.farmer_category,
        farmer.land_holding_ha,
        farmer.primary_crop,
        farmer.aadhaar_linked,
        farmer.bank_linked,
    ]
    completed = sum(1 for f in fields if f is not None and f != "" and f is not False)
    return int((completed / len(fields)) * 100)


def _build_farmer_profile_detail(user: User, farmer: Farmer) -> FarmerProfileDetail:
    return FarmerProfileDetail(
        user_id=user.id,
        farmer_id=farmer.farmer_id,
        name=farmer.name,
        mobile=farmer.mobile,
        email=user.email,
        state=farmer.state,
        district=farmer.district,
        village=farmer.village,
        farmer_category=farmer.farmer_category,
        land_holding_ha=float(farmer.land_holding_ha) if farmer.land_holding_ha is not None else None,
        primary_crop=farmer.primary_crop,
        aadhaar_linked=bool(farmer.aadhaar_linked),
        bank_linked=bool(farmer.bank_linked),
        profile_photo_url=farmer.profile_photo_url,
        profile_completion_percent=_calculate_profile_completion(farmer),
    )


# ═══════════════════════════════════════════════════════════════
# LEGACY ENDPOINT (PRESERVED)
# ═══════════════════════════════════════════════════════════════

@router.post("/api/farmers", response_model=FarmerProfileResponse, status_code=status.HTTP_200_OK)
def save_farmer_profile(payload: FarmerProfileCreate, db: Session = Depends(get_db)):
    """Legacy endpoint for saving/upserting basic farmer profile."""
    name = payload.name.strip()
    state = payload.state.strip()
    mobile = payload.mobile.strip()

    if not name or not state or not is_valid_mobile(mobile):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A name, state and valid mobile number are required.",
        )

    farmer_id = upsert_farmer(
        db=db,
        name=name,
        mobile=mobile,
        state=state,
        primary_crop=payload.primary_crop,
    )
    db.commit()

    return {
        "success": True,
        "farmer_id": farmer_id,
        "message": "Farmer profile saved.",
    }


# ═══════════════════════════════════════════════════════════════
# AUTHENTICATED FARMER PROFILE & DASHBOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/api/farmers/me", response_model=FarmerProfileDetail)
def get_my_farmer_profile(
    current_user: User = Depends(require_roles("farmer")),
    farmer_id: int = Depends(get_current_farmer_id),
    db: Session = Depends(get_db),
):
    """Returns the authenticated farmer's verified profile information."""
    farmer = db.query(Farmer).filter_by(farmer_id=farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer record not found.")
    return _build_farmer_profile_detail(current_user, farmer)


@router.put("/api/farmers/me", response_model=FarmerProfileDetail)
def update_my_farmer_profile(
    payload: FarmerProfileUpdateRequest,
    current_user: User = Depends(require_roles("farmer")),
    farmer_id: int = Depends(get_current_farmer_id),
    db: Session = Depends(get_db),
):
    """
    Updates editable profile fields for the authenticated farmer.
    Security: Strictly rejects attempts to modify account role, verification,
    aadhaar/bank linkage flags, suspension, or other users' profiles.
    """
    farmer = db.query(Farmer).filter_by(farmer_id=farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer record not found.")

    if payload.farmer_category and payload.farmer_category not in ("small", "marginal", "large"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="farmer_category must be one of: 'small', 'marginal', 'large'",
        )

    # Apply only permitted updates
    if payload.name is not None and payload.name.strip():
        farmer.name = payload.name.strip()
    if payload.state is not None and payload.state.strip():
        farmer.state = payload.state.strip()
    if payload.district is not None:
        farmer.district = payload.district.strip() if payload.district else None
    if payload.village is not None:
        farmer.village = payload.village.strip() if payload.village else None
    if payload.farmer_category is not None:
        farmer.farmer_category = payload.farmer_category
    if payload.land_holding_ha is not None:
        farmer.land_holding_ha = Decimal(str(payload.land_holding_ha))
    if payload.primary_crop is not None:
        farmer.primary_crop = payload.primary_crop.strip() if payload.primary_crop else None
    if payload.profile_photo_url is not None:
        farmer.profile_photo_url = payload.profile_photo_url.strip() if payload.profile_photo_url else None

    db.commit()
    db.refresh(farmer)
    return _build_farmer_profile_detail(current_user, farmer)


@router.get("/api/farmers/me/dashboard", response_model=FarmerDashboardResponse)
def get_my_farmer_dashboard(
    current_user: User = Depends(require_roles("farmer")),
    farmer_id: int = Depends(get_current_farmer_id),
    db: Session = Depends(get_db),
):
    """Consolidated dashboard metrics and recent activity for the authenticated farmer."""
    farmer = db.query(Farmer).filter_by(farmer_id=farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer record not found.")

    # Insurance counts & recents
    ins_query = db.query(InsuranceRequest).filter(InsuranceRequest.farmer_id == farmer_id)
    total_ins = ins_query.count()
    pending_ins = ins_query.filter(InsuranceRequest.req_status == "pending").count()
    recent_ins_rows = ins_query.order_by(InsuranceRequest.submitted_at.desc()).limit(5).all()

    # Loan counts & recents
    loan_query = db.query(LoanApplication).filter(LoanApplication.farmer_id == farmer_id)
    total_loans = loan_query.count()
    pending_loans = loan_query.filter(LoanApplication.app_status == "pending").count()
    recent_loan_rows = loan_query.order_by(LoanApplication.submitted_at.desc()).limit(5).all()

    # Storage booking counts & recents
    booking_query = db.query(StorageBooking).filter(StorageBooking.farmer_id == farmer_id)
    total_bookings = booking_query.count()
    active_bookings = booking_query.filter(StorageBooking.booking_status == "active").count()
    recent_booking_rows = (
        db.query(StorageBooking, StorageFacility.name.label("facility_name"))
        .outerjoin(StorageFacility, StorageFacility.id == StorageBooking.facility_id)
        .filter(StorageBooking.farmer_id == farmer_id)
        .order_by(StorageBooking.booked_at.desc())
        .limit(5)
        .all()
    )

    recent_insurance = [
        FarmerInsuranceSummaryItem(
            id=r.id,
            request_type=r.request_type,
            crop_name=r.crop_name,
            district=r.district,
            req_status=r.req_status,
            submitted_at=r.submitted_at,
        )
        for r in recent_ins_rows
    ]

    recent_loans = [
        FarmerLoanSummaryItem(
            id=r.id,
            loan_type=r.loan_type,
            loan_amount=float(r.loan_amount),
            purpose=r.purpose,
            app_status=r.app_status,
            submitted_at=r.submitted_at,
        )
        for r in recent_loan_rows
    ]

    recent_bookings = [
        FarmerBookingSummaryItem(
            id=b.id,
            booking_ref=b.booking_ref,
            crop_type=b.crop_type,
            quantity_kg=float(b.quantity_kg),
            duration_months=b.duration_months,
            total_amount=float(b.total_amount) if b.total_amount is not None else None,
            booking_status=b.booking_status,
            booked_at=b.booked_at,
            facility_name=fac_name,
        )
        for b, fac_name in recent_booking_rows
    ]

    return FarmerDashboardResponse(
        profile=_build_farmer_profile_detail(current_user, farmer),
        total_insurance_requests=total_ins,
        pending_insurance_requests=pending_ins,
        total_loan_applications=total_loans,
        pending_loan_applications=pending_loans,
        total_storage_bookings=total_bookings,
        active_storage_bookings=active_bookings,
        recent_insurance=recent_insurance,
        recent_loans=recent_loans,
        recent_bookings=recent_bookings,
    )


@router.get("/api/farmers/me/insurance", response_model=FarmerInsuranceListResponse)
def get_my_insurance_requests(
    current_user: User = Depends(require_roles("farmer")),
    farmer_id: int = Depends(get_current_farmer_id),
    db: Session = Depends(get_db),
):
    """Lists all insurance requests belonging strictly to the authenticated farmer."""
    rows = (
        db.query(InsuranceRequest)
        .filter(InsuranceRequest.farmer_id == farmer_id)
        .order_by(InsuranceRequest.submitted_at.desc())
        .all()
    )
    items = [
        FarmerInsuranceSummaryItem(
            id=r.id,
            request_type=r.request_type,
            crop_name=r.crop_name,
            district=r.district,
            req_status=r.req_status,
            submitted_at=r.submitted_at,
        )
        for r in rows
    ]
    return FarmerInsuranceListResponse(requests=items, total=len(items))


@router.get("/api/farmers/me/loans", response_model=FarmerLoanListResponse)
def get_my_loan_applications(
    current_user: User = Depends(require_roles("farmer")),
    farmer_id: int = Depends(get_current_farmer_id),
    db: Session = Depends(get_db),
):
    """Lists all loan applications belonging strictly to the authenticated farmer."""
    rows = (
        db.query(LoanApplication)
        .filter(LoanApplication.farmer_id == farmer_id)
        .order_by(LoanApplication.submitted_at.desc())
        .all()
    )
    items = [
        FarmerLoanSummaryItem(
            id=r.id,
            loan_type=r.loan_type,
            loan_amount=float(r.loan_amount),
            purpose=r.purpose,
            app_status=r.app_status,
            submitted_at=r.submitted_at,
        )
        for r in rows
    ]
    return FarmerLoanListResponse(applications=items, total=len(items))


@router.get("/api/farmers/me/bookings", response_model=FarmerBookingListResponse)
def get_my_storage_bookings(
    current_user: User = Depends(require_roles("farmer")),
    farmer_id: int = Depends(get_current_farmer_id),
    db: Session = Depends(get_db),
):
    """Lists all storage bookings belonging strictly to the authenticated farmer."""
    rows = (
        db.query(StorageBooking, StorageFacility.name.label("facility_name"))
        .outerjoin(StorageFacility, StorageFacility.id == StorageBooking.facility_id)
        .filter(StorageBooking.farmer_id == farmer_id)
        .order_by(StorageBooking.booked_at.desc())
        .all()
    )
    items = [
        FarmerBookingSummaryItem(
            id=b.id,
            booking_ref=b.booking_ref,
            crop_type=b.crop_type,
            quantity_kg=float(b.quantity_kg),
            duration_months=b.duration_months,
            total_amount=float(b.total_amount) if b.total_amount is not None else None,
            booking_status=b.booking_status,
            booked_at=b.booked_at,
            facility_name=fac_name,
        )
        for b, fac_name in rows
    ]
    return FarmerBookingListResponse(bookings=items, total=len(items))


@router.get("/api/farmers/me/schemes", response_model=FarmerSchemeListResponse)
def get_my_schemes(
    current_user: User = Depends(require_roles("farmer")),
    farmer_id: int = Depends(get_current_farmer_id),
    db: Session = Depends(get_db),
):
    """Returns active government schemes and the authenticated farmer's past eligibility checks."""
    schemes_rows = (
        db.query(GovernmentScheme)
        .filter(GovernmentScheme.active == True)
        .order_by(GovernmentScheme.id.asc())
        .all()
    )
    schemes = [
        FarmerSchemeItem(
            id=s.id,
            slug=s.slug,
            name=s.name,
            scheme_type=s.scheme_type,
            benefit_summary=s.benefit_summary,
            storage_benefit_per_kg=float(s.storage_benefit_per_kg or 0.0),
            active=s.active,
        )
        for s in schemes_rows
    ]

    checks_rows = (
        db.query(SchemeEligibilityCheck, GovernmentScheme.name.label("scheme_name"))
        .outerjoin(GovernmentScheme, GovernmentScheme.id == SchemeEligibilityCheck.scheme_id)
        .filter(SchemeEligibilityCheck.farmer_id == farmer_id)
        .order_by(SchemeEligibilityCheck.checked_at.desc())
        .limit(20)
        .all()
    )
    past_checks = [
        FarmerEligibilityCheckItem(
            id=c.id,
            scheme_id=c.scheme_id,
            scheme_name=s_name,
            farmer_category=c.farmer_category,
            land_ha=float(c.land_ha) if c.land_ha is not None else None,
            crop_season=c.crop_season,
            is_eligible=c.is_eligible,
            result_message=c.result_message,
            checked_at=c.checked_at,
        )
        for c, s_name in checks_rows
    ]

    return FarmerSchemeListResponse(schemes=schemes, past_checks=past_checks)
