"""
Pydantic schemas for Admin Portal API endpoints.
Derived from actual existing ORM model fields and constraints.
"""

from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator


# ── Status Enums (derived from actual DB constraints) ──

class AccountAction(str, Enum):
    """Valid target states for admin account management.
    Mapped to User.is_active / User.is_suspended booleans.
    """
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class InsuranceStatus(str, Enum):
    """Matches insurance_requests_chk_2 constraint."""
    PENDING = "pending"
    PROCESSING = "processing"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"


class LoanStatus(str, Enum):
    """Matches loan_applications_chk_2 constraint."""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class MentalHealthStatus(str, Enum):
    """Matches mental_health_requests_chk_2 constraint."""
    PENDING = "pending"
    CONTACTED = "contacted"
    RESOLVED = "resolved"


# ── Request Schemas ──

class UserStatusUpdateRequest(BaseModel):
    status: AccountAction
    reason: Optional[str] = Field(None, max_length=500)


class InsuranceStatusUpdateRequest(BaseModel):
    status: InsuranceStatus
    notes: Optional[str] = Field(None, max_length=500)


class LoanStatusUpdateRequest(BaseModel):
    status: LoanStatus
    notes: Optional[str] = Field(None, max_length=500)


class MentalHealthAssignRequest(BaseModel):
    psychiatrist_user_id: int
    appointment_at: Optional[datetime] = None


class MentalHealthStatusUpdateRequest(BaseModel):
    status: MentalHealthStatus
    notes: Optional[str] = Field(None, max_length=500)


# ── Response Schemas ──

class AdminUserListItem(BaseModel):
    id: int
    email: Optional[str] = None
    mobile: str
    role: str
    account_status: str  # Computed from is_active + is_suspended + is_approved
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    users: List[AdminUserListItem]
    total: int
    page: int
    per_page: int


class AdminUserDetailResponse(BaseModel):
    id: int
    email: Optional[str] = None
    mobile: str
    role: str
    account_status: str
    is_verified: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    profile: Optional[dict] = None

    class Config:
        from_attributes = True


class UserStatusUpdateResponse(BaseModel):
    success: bool
    user_id: int
    new_status: str


class PendingPsychiatrist(BaseModel):
    user_id: int
    email: Optional[str] = None
    full_name: Optional[str] = None
    license_number: str
    specialization: Optional[str] = None
    registration_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class PendingWarehouseOwner(BaseModel):
    user_id: int
    email: Optional[str] = None
    full_name: Optional[str] = None
    company_name: str
    gstin: Optional[str] = None
    contact_mobile: Optional[str] = None
    registration_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class PendingApprovalsResponse(BaseModel):
    psychiatrists: List[PendingPsychiatrist]
    warehouse_owners: List[PendingWarehouseOwner]
    total: int


class DashboardStatsResponse(BaseModel):
    total_farmers: int = 0
    total_psychiatrists: int = 0
    total_warehouse_owners: int = 0
    pending_approvals: int = 0
    total_insurance_requests: int = 0
    pending_insurance_requests: int = 0
    total_loan_applications: int = 0
    pending_loan_applications: int = 0
    total_mental_health_requests: int = 0
    pending_mental_health_requests: int = 0
    total_storage_bookings: int = 0
    active_storage_bookings: int = 0


class InsuranceStatusUpdateResponse(BaseModel):
    success: bool
    request_id: int
    new_status: str


class LoanStatusUpdateResponse(BaseModel):
    success: bool
    application_id: int
    new_status: str


class AdminInsuranceItem(BaseModel):
    id: int
    farmer_name: str
    district: Optional[str] = None
    crop_name: Optional[str] = None
    request_type: Optional[str] = None
    req_status: str
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminInsuranceListResponse(BaseModel):
    requests: List[AdminInsuranceItem]
    total: int
    page: int
    per_page: int


class AdminLoanItem(BaseModel):
    id: int
    farmer_name: str
    village: Optional[str] = None
    loan_amount: float
    loan_type: Optional[str] = None
    app_status: str
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminLoanListResponse(BaseModel):
    applications: List[AdminLoanItem]
    total: int
    page: int
    per_page: int


class AdminMentalHealthItem(BaseModel):
    id: int
    farmer_name: str
    concern_type: Optional[str] = None
    req_status: str
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminMentalHealthListResponse(BaseModel):
    requests: List[AdminMentalHealthItem]
    total: int
    page: int
    per_page: int


class MentalHealthAssignResponse(BaseModel):
    success: bool
    request_id: int
    message: str
