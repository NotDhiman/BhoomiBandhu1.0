from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship
from ..core.database import Base


class Crop(Base):
    __tablename__ = "crops"

    crop_id = Column(Integer, primary_key=True, autoincrement=True)
    crop_name = Column(String(100), unique=True, nullable=False)
    crop_category = Column(String(50), nullable=True)


class Farmer(Base):
    __tablename__ = "farmers"

    farmer_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    mobile = Column(String(15), unique=True, nullable=False, index=True)
    state = Column(String(50), nullable=False, index=True)
    email = Column(String(150), nullable=True)
    district = Column(String(80), nullable=True)
    village = Column(String(100), nullable=True)
    farmer_category = Column(String(20), nullable=True)
    land_holding_ha = Column(Numeric(6, 2), nullable=True)
    primary_crop = Column(String(80), nullable=True)
    aadhaar_linked = Column(Boolean, default=False)
    bank_linked = Column(Boolean, default=False)
    profile_photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("farmer_category IN ('small', 'marginal', 'large')", name="chk_farmer_category"),
    )

    crop_predictions = relationship("CropPrediction", back_populates="farmer")
    insurance_requests = relationship("InsuranceRequest", back_populates="farmer")
    pmfby_enrollments = relationship("PmfbyEnrollment", back_populates="farmer")
    loan_applications = relationship("LoanApplication", back_populates="farmer")
    mental_health_requests = relationship("MentalHealthRequest", back_populates="farmer")
    scheme_eligibility_checks = relationship("SchemeEligibilityCheck", back_populates="farmer")
    storage_bookings = relationship("StorageBooking", back_populates="farmer")


class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    scheme_type = Column(String(20), nullable=True)
    benefit_summary = Column(Text, nullable=True)
    storage_benefit_per_kg = Column(Numeric(5, 2), default=0.00)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("scheme_type IN ('central', 'state')", name="chk_scheme_type"),
    )

    storage_bookings = relationship("StorageBooking", back_populates="scheme")
    scheme_eligibility_checks = relationship("SchemeEligibilityCheck", back_populates="scheme")


class StorageFacility(Base):
    __tablename__ = "storage_facilities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    storage_type = Column(String(30), nullable=True, index=True)
    location_text = Column(String(200), nullable=True)
    state = Column(String(60), nullable=True, index=True)
    district = Column(String(80), nullable=True)
    distance_km = Column(Numeric(5, 1), nullable=True)
    capacity_tons = Column(Numeric(10, 2), nullable=True)
    available_space_tons = Column(Numeric(10, 2), nullable=True)
    price_per_kg_month = Column(Numeric(5, 2), nullable=False)
    mode = Column(String(10), nullable=True)
    temperature_range = Column(String(30), nullable=True)
    suitable_crops = Column(Text, nullable=True)
    facilities = Column(Text, nullable=True)
    scheme_support = Column(Text, nullable=True)
    rating = Column(Numeric(3, 1), nullable=True)
    review_count = Column(Integer, default=0)
    govt_approved = Column(Boolean, default=False)
    status = Column(String(20), default="available", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("storage_type IN ('cold_storage', 'warehouse', 'offline')", name="storage_facilities_chk_1"),
        CheckConstraint("mode IN ('online', 'offline')", name="storage_facilities_chk_2"),
        CheckConstraint("status IN ('available', 'limited', 'full')", name="storage_facilities_chk_3"),
    )

    storage_bookings = relationship("StorageBooking", back_populates="facility")


class CropPrediction(Base):
    __tablename__ = "crop_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.farmer_id", ondelete="SET NULL"), nullable=True, index=True)
    rainfall_mm = Column(Numeric(7, 2), nullable=True)
    temperature_celsius = Column(Numeric(5, 2), nullable=True)
    soil_type = Column(String(20), nullable=True)
    recommended_crop = Column(String(80), nullable=True)
    yield_level = Column(String(10), nullable=True)
    risk_level = Column(String(10), nullable=True)
    confidence_percent = Column(Integer, nullable=True)
    ai_advice = Column(Text, nullable=True)
    predicted_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("soil_type IN ('loamy', 'clay', 'sandy', 'red', 'black')", name="crop_predictions_chk_1"),
        CheckConstraint("yield_level IN ('Low', 'Medium', 'High')", name="crop_predictions_chk_2"),
        CheckConstraint("risk_level IN ('Low', 'Medium', 'High')", name="crop_predictions_chk_3"),
    )

    farmer = relationship("Farmer", back_populates="crop_predictions")


class InsuranceRequest(Base):
    __tablename__ = "insurance_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.farmer_id", ondelete="SET NULL"), nullable=True, index=True)
    farmer_name = Column(String(100), nullable=False)
    district = Column(String(80), nullable=True)
    crop_name = Column(String(80), nullable=True)
    request_type = Column(String(30), nullable=True)
    description = Column(Text, nullable=True)
    req_status = Column(String(20), default="pending", index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("request_type IN ('New Insurance Enrollment', 'Crop Loss Claim')", name="insurance_requests_chk_1"),
        CheckConstraint("req_status IN ('pending', 'processing', 'approved', 'rejected', 'paid')", name="insurance_requests_chk_2"),
    )

    farmer = relationship("Farmer", back_populates="insurance_requests")
    pmfby_enrollments = relationship("PmfbyEnrollment", back_populates="insurance_request", cascade="all, delete-orphan")


class PmfbyEnrollment(Base):
    __tablename__ = "pmfby_enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    insurance_request_id = Column(Integer, ForeignKey("insurance_requests.id", ondelete="CASCADE"), nullable=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.farmer_id"), nullable=True, index=True)
    crop_name = Column(String(80), nullable=True)
    land_records_verified = Column(Boolean, default=False)
    sowing_date = Column(Date, nullable=True)
    season = Column(String(15), nullable=True)
    premium_calculated = Column(Numeric(10, 2), nullable=True)
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("season IN ('Kharif', 'Rabi', 'Zaid')", name="pmfby_enrollments_chk_1"),
    )

    insurance_request = relationship("InsuranceRequest", back_populates="pmfby_enrollments")
    farmer = relationship("Farmer", back_populates="pmfby_enrollments")


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.farmer_id", ondelete="SET NULL"), nullable=True, index=True)
    farmer_name = Column(String(100), nullable=False)
    village = Column(String(100), nullable=True)
    loan_amount = Column(Numeric(12, 2), nullable=False)
    loan_type = Column(String(50), nullable=True)
    purpose = Column(Text, nullable=True)
    app_status = Column(String(20), default="pending", index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("loan_type IN ('Crop Loan', 'Equipment Loan', 'Irrigation Loan', 'Dairy / Livestock Loan')", name="loan_applications_chk_1"),
        CheckConstraint("app_status IN ('pending', 'under_review', 'approved', 'rejected')", name="loan_applications_chk_2"),
    )

    farmer = relationship("Farmer", back_populates="loan_applications")


class MentalHealthRequest(Base):
    __tablename__ = "mental_health_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.farmer_id", ondelete="SET NULL"), nullable=True, index=True)
    farmer_name = Column(String(100), nullable=False)
    mobile = Column(String(15), nullable=True)
    concern_type = Column(String(50), nullable=True)
    message = Column(Text, nullable=True)
    req_status = Column(String(20), default="pending", index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("concern_type IN ('Stress & Anxiety', 'Financial Pressure', 'Crop Loss Stress', 'Family or Personal Issues')", name="mental_health_requests_chk_1"),
        CheckConstraint("req_status IN ('pending', 'contacted', 'resolved')", name="mental_health_requests_chk_2"),
    )

    farmer = relationship("Farmer", back_populates="mental_health_requests")


class SchemeEligibilityCheck(Base):
    __tablename__ = "scheme_eligibility_checks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.farmer_id", ondelete="SET NULL"), nullable=True, index=True)
    scheme_id = Column(Integer, ForeignKey("government_schemes.id"), nullable=True, index=True)
    farmer_category = Column(String(20), nullable=True)
    land_ha = Column(Numeric(6, 2), nullable=True)
    crop_season = Column(String(15), nullable=True)
    aadhaar_linked = Column(Boolean, nullable=True)
    bank_linked = Column(Boolean, nullable=True)
    is_eligible = Column(Boolean, nullable=True)
    result_message = Column(Text, nullable=True)
    checked_at = Column(DateTime(timezone=True), server_default=func.now())

    farmer = relationship("Farmer", back_populates="scheme_eligibility_checks")
    scheme = relationship("GovernmentScheme", back_populates="scheme_eligibility_checks")


class StorageBooking(Base):
    __tablename__ = "storage_booking"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_ref = Column(String(20), unique=True, nullable=False)
    farmer_name = Column(String(100), nullable=True)
    mobile = Column(String(15), nullable=True)
    facility_id = Column(Integer, ForeignKey("storage_facilities.id"), nullable=True, index=True)
    state = Column(String(60), nullable=True)
    crop_type = Column(String(80), nullable=True)
    quantity_kg = Column(Numeric(10, 2), nullable=False)
    duration_months = Column(Integer, nullable=False)
    mode = Column(String(10), nullable=True)
    scheme_id = Column(Integer, ForeignKey("government_schemes.id"), nullable=True, index=True)
    base_price_per_kg = Column(Numeric(5, 2), nullable=True)
    scheme_benefit_per_kg = Column(Numeric(5, 2), default=0.00)
    effective_price_per_kg = Column(Numeric(5, 2), nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=True)
    booking_status = Column(String(20), default="active", index=True)
    booked_at = Column(DateTime(timezone=True), server_default=func.now())
    farmer_id = Column(Integer, ForeignKey("farmers.farmer_id", ondelete="SET NULL"), nullable=True, index=True)

    __table_args__ = (
        CheckConstraint("mode IN ('online', 'offline')", name="storage_booking_chk_1"),
        CheckConstraint("booking_status IN ('active', 'completed', 'cancelled')", name="storage_booking_chk_2"),
    )

    facility = relationship("StorageFacility", back_populates="storage_bookings")
    scheme = relationship("GovernmentScheme", back_populates="storage_bookings")
    farmer = relationship("Farmer", back_populates="storage_bookings")
