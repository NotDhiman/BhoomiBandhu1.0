from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# ═══════════════════════════════════════════════════════════════
# FARMER PORTAL SCHEMAS
# ═══════════════════════════════════════════════════════════════

class FarmerProfileDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    farmer_id: int
    name: str
    mobile: str
    email: Optional[str] = None
    state: str
    district: Optional[str] = None
    village: Optional[str] = None
    farmer_category: Optional[str] = None
    land_holding_ha: Optional[float] = None
    primary_crop: Optional[str] = None
    aadhaar_linked: bool = False
    bank_linked: bool = False
    profile_photo_url: Optional[str] = None
    profile_completion_percent: int = 0


class FarmerProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=80)
    village: Optional[str] = Field(None, max_length=100)
    farmer_category: Optional[str] = Field(None, max_length=20)
    land_holding_ha: Optional[float] = Field(None, ge=0.0)
    primary_crop: Optional[str] = Field(None, max_length=80)
    profile_photo_url: Optional[str] = Field(None, max_length=255)


class FarmerInsuranceSummaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_type: Optional[str] = None
    crop_name: Optional[str] = None
    district: Optional[str] = None
    req_status: str
    submitted_at: Optional[datetime] = None


class FarmerLoanSummaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_type: str
    loan_amount: float
    purpose: Optional[str] = None
    app_status: str
    submitted_at: Optional[datetime] = None


class FarmerBookingSummaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_ref: str
    crop_type: Optional[str] = None
    quantity_kg: float
    duration_months: int
    total_amount: Optional[float] = None
    booking_status: str
    booked_at: Optional[datetime] = None
    facility_name: Optional[str] = None


class FarmerDashboardResponse(BaseModel):
    profile: FarmerProfileDetail
    total_insurance_requests: int
    pending_insurance_requests: int
    total_loan_applications: int
    pending_loan_applications: int
    total_storage_bookings: int
    active_storage_bookings: int
    recent_insurance: List[FarmerInsuranceSummaryItem]
    recent_loans: List[FarmerLoanSummaryItem]
    recent_bookings: List[FarmerBookingSummaryItem]


class FarmerInsuranceListResponse(BaseModel):
    requests: List[FarmerInsuranceSummaryItem]
    total: int


class FarmerLoanListResponse(BaseModel):
    applications: List[FarmerLoanSummaryItem]
    total: int


class FarmerBookingListResponse(BaseModel):
    bookings: List[FarmerBookingSummaryItem]
    total: int


class FarmerSchemeItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    scheme_type: Optional[str] = None
    benefit_summary: Optional[str] = None
    storage_benefit_per_kg: float = 0.0
    active: bool = True


class FarmerEligibilityCheckItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scheme_id: Optional[int] = None
    scheme_name: Optional[str] = None
    farmer_category: Optional[str] = None
    land_ha: Optional[float] = None
    crop_season: Optional[str] = None
    is_eligible: Optional[bool] = None
    result_message: Optional[str] = None
    checked_at: Optional[datetime] = None


class FarmerSchemeListResponse(BaseModel):
    schemes: List[FarmerSchemeItem]
    past_checks: List[FarmerEligibilityCheckItem]


# ═══════════════════════════════════════════════════════════════
# WAREHOUSE OWNER PORTAL SCHEMAS
# ═══════════════════════════════════════════════════════════════

class WarehouseOwnerProfileDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    profile_id: int
    email: Optional[str] = None
    mobile: str
    company_name: str
    gstin: Optional[str] = None
    is_approved: bool
    account_status: str
    created_at: Optional[datetime] = None


class WarehouseOwnerProfileUpdateRequest(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=150)
    gstin: Optional[str] = Field(None, max_length=20)


class WarehouseDashboardResponse(BaseModel):
    profile: WarehouseOwnerProfileDetail
    total_facilities: int
    active_facilities: int
    total_bookings: int
    pending_bookings: int
    schema_limitation_notice: str


class WarehouseFacilityListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    storage_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    capacity_tons: Optional[float] = None
    available_space_tons: Optional[float] = None
    price_per_kg_month: float
    status: str
    rating: Optional[float] = None


class WarehouseFacilitiesResponse(BaseModel):
    facilities: List[WarehouseFacilityListItem]
    total: int
    notice: str


class WarehouseBookingsResponse(BaseModel):
    bookings: List[dict]
    total: int
    notice: str
