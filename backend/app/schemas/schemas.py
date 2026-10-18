from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field


# Farmer Schemas
class FarmerProfileCreate(BaseModel):
    name: str = Field(..., max_length=100)
    mobile: str = Field(..., max_length=20)
    state: str = Field(..., max_length=50)
    primary_crop: Optional[str] = Field(None, max_length=80)


class FarmerProfileResponse(BaseModel):
    success: bool
    farmer_id: int
    message: str


# Insurance Schemas
class InsuranceRequestCreate(BaseModel):
    farmer_name: str = Field(..., max_length=100)
    mobile: str = Field(..., max_length=20)
    district: str = Field(..., max_length=80)
    state: str = Field(..., max_length=50)
    crop_name: str = Field(..., max_length=80)
    request_type: str = Field(..., max_length=30)
    description: str = Field(..., max_length=5000)


class InsuranceRequestResponse(BaseModel):
    success: bool
    request_id: int
    status: str
    message: str


class InsuranceRequestItem(BaseModel):
    id: int
    farmer_name: str
    district: Optional[str]
    crop_name: Optional[str]
    request_type: Optional[str]
    req_status: Optional[str]
    submitted_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class InsuranceRequestListResponse(BaseModel):
    requests: List[InsuranceRequestItem]


# Loan Application Schemas
class LoanApplicationCreate(BaseModel):
    farmer_name: str = Field(..., max_length=100)
    village: str = Field(..., max_length=100)
    loan_amount: float = Field(..., gt=0)
    loan_type: str = Field(..., max_length=50)
    purpose: str = Field(..., max_length=5000)
    mobile: Optional[str] = Field(None, max_length=20)
    state: Optional[str] = Field(None, max_length=50)


class LoanApplicationResponse(BaseModel):
    success: bool
    application_id: int
    status: str


# Mental Health Schemas
class MentalHealthRequestCreate(BaseModel):
    farmer_name: str = Field(..., max_length=100)
    mobile: str = Field(..., max_length=20)
    concern_type: str = Field(..., max_length=50)
    message: Optional[str] = Field(None, max_length=5000)


class MentalHealthRequestResponse(BaseModel):
    success: bool
    request_id: int
    status: str


# Scheme Eligibility Schemas
class SchemeEligibilityCheckCreate(BaseModel):
    scheme_slug: str = Field(..., max_length=50)
    farmer_category: str = Field(..., max_length=20)
    land_ha: float = Field(..., ge=0)
    crop_season: str = Field(..., max_length=15)
    aadhaar_linked: Optional[bool] = False
    bank_linked: Optional[bool] = False
    is_eligible: Optional[bool] = False
    result_message: Optional[str] = Field(None, max_length=2000)


class SchemeEligibilityCheckResponse(BaseModel):
    success: bool
    check_id: int


# Storage Schemas
class StorageFacilityItem(BaseModel):
    id: int
    name: str
    storage_type: Optional[str]
    location_text: Optional[str]
    state: Optional[str]
    district: Optional[str]
    distance_km: Optional[float]
    capacity_tons: Optional[float]
    available_space_tons: Optional[float]
    price_per_kg_month: float
    mode: Optional[str]
    temperature_range: Optional[str]
    suitable_crops: Optional[str]
    facilities: Optional[str]
    scheme_support: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    govt_approved: Optional[bool]
    status: Optional[str]

    class Config:
        from_attributes = True


class StorageFacilitiesListResponse(BaseModel):
    facilities: List[StorageFacilityItem]


class StorageBookingCreate(BaseModel):
    farmer_name: str = Field(..., max_length=100)
    mobile: str = Field(..., max_length=20)
    state: str = Field(..., max_length=60)
    crop_type: str = Field(..., max_length=80)
    quantity_kg: float = Field(..., gt=0)
    duration_months: int = Field(..., ge=1)
    mode: str = Field(..., max_length=10)
    base_price_per_kg: float = Field(..., gt=0)
    storage_type: str = Field(..., max_length=30)
    scheme_slug: Optional[str] = Field(None, max_length=50)


class StorageBookingResponse(BaseModel):
    success: bool
    booking_id: int
    booking_ref: str
    total_amount: float
    effective_price_per_kg: float
    facility_id: Optional[int]
    message: str


class StorageBookingItem(BaseModel):
    id: int
    booking_ref: str
    crop_type: Optional[str]
    quantity_kg: float
    duration_months: int
    total_amount: Optional[float]
    booking_status: Optional[str]
    booked_at: Optional[datetime]
    facility_name: Optional[str] = None


class StorageBookingListResponse(BaseModel):
    bookings: List[StorageBookingItem]


# Crop Catalogue Schemas
class CropItem(BaseModel):
    crop_id: int
    crop_name: str
    crop_category: Optional[str]

    class Config:
        from_attributes = True


class CropListResponse(BaseModel):
    crops: List[CropItem]


# Government Scheme Catalogue Schemas
class GovernmentSchemeItem(BaseModel):
    id: int
    slug: str
    name: str
    scheme_type: Optional[str]
    benefit_summary: Optional[str]
    storage_benefit_per_kg: Optional[float]

    class Config:
        from_attributes = True


class GovernmentSchemeListResponse(BaseModel):
    schemes: List[GovernmentSchemeItem]


# Crop Prediction Schemas
class CropPredictionCreate(BaseModel):
    rainfall_mm: float = Field(..., ge=0)
    temperature_celsius: float
    soil_type: str = Field(..., max_length=20)
    recommended_crop: Optional[str] = Field(None, max_length=80)
    yield_level: Optional[str] = Field(None, max_length=10)
    risk_level: Optional[str] = Field(None, max_length=10)
    confidence_percent: Optional[float] = Field(None, ge=0, le=100)
    ai_advice: Optional[str] = Field(None, max_length=5000)
    mobile: Optional[str] = Field(None, max_length=20)
    # Optional context fields for ML prediction service
    season: Optional[str] = Field("kharif", max_length=20)
    irrigation: Optional[str] = Field("irrigated", max_length=20)


class CropPredictionResponse(BaseModel):
    success: bool
    prediction_id: int
    recommended_crop: Optional[str] = None
    confidence_percent: Optional[int] = None
    yield_level: Optional[str] = None
    risk_level: Optional[str] = None
    ai_advice: Optional[str] = None


# Weather Schemas
class WeatherResponse(BaseModel):
    city: str
    country: Optional[str]
    temp_c: int
    feels_like_c: int
    humidity_pct: int
    rainfall_mm: int
    description: str
    wind_kmh: int
    icon: Optional[str] = None


# AI Advisor (Gemini/Groq) Schemas
class AIChatRequest(BaseModel):
    prompt: str = Field(..., max_length=12000)


class AIChatResponse(BaseModel):
    reply: str


# External Schemes Schemas
class ExternalSchemeItem(BaseModel):
    id: Any = None
    slug: str
    name: str
    scheme_type: str
    benefit_summary: str
    eligibility: str
    official_url: str


class ExternalSchemesResponse(BaseModel):
    configured: bool
    count: int = 0
    schemes: List[Dict[str, Any]] = []
    message: Optional[str] = None
