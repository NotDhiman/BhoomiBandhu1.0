from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator
import re


class UserRole(str, Enum):
    FARMER = "farmer"
    PSYCHIATRIST = "psychiatrist"
    WAREHOUSE_OWNER = "warehouse_owner"
    ADMIN = "admin"


def normalize_mobile(value: str) -> str:
    cleaned = re.sub(r"[^\d]", "", value)
    if len(cleaned) == 12 and cleaned.startswith("91"):
        cleaned = cleaned[2:]
    elif len(cleaned) == 11 and cleaned.startswith("0"):
        cleaned = cleaned[1:]
    if len(cleaned) != 10:
        raise ValueError("Mobile number must be a valid 10-digit Indian mobile number")
    return cleaned


class OtpSendRequest(BaseModel):
    mobile: str = Field(..., description="10-digit mobile number")
    purpose: str = Field("registration", max_length=30)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)


class OtpVerifyRequest(BaseModel):
    mobile: str = Field(..., description="10-digit mobile number")
    otp_code: str = Field(..., min_length=6, max_length=6)
    purpose: str = Field("registration", max_length=30)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)


class UserRegisterRequest(BaseModel):
    mobile: str
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = Field(None, max_length=150)
    role: str = Field("farmer")
    # Farmer specific optional fields
    state: Optional[str] = Field("Haryana", max_length=50)
    farmer_category: Optional[str] = Field("small", max_length=20)
    district: Optional[str] = Field(None, max_length=80)
    village: Optional[str] = Field(None, max_length=100)
    primary_crop: Optional[str] = Field(None, max_length=80)
    otp_code: Optional[str] = Field(None, min_length=6, max_length=6)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v_clean = v.strip().lower()
            if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v_clean):
                raise ValueError("Invalid email format")
            return v_clean
        return None

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(char.isdigit() or not char.isalnum() for char in v):
            raise ValueError("Password must contain at least one digit or special character")
        return v


class PsychiatristRegisterRequest(BaseModel):
    mobile: str
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = Field(None, max_length=150)
    license_number: str = Field(..., min_length=3, max_length=100)
    specialization: Optional[str] = Field(None, max_length=100)
    otp_code: Optional[str] = Field(None, min_length=6, max_length=6)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v_clean = v.strip().lower()
            if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v_clean):
                raise ValueError("Invalid email format")
            return v_clean
        return None


class WarehouseOwnerRegisterRequest(BaseModel):
    mobile: str
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = Field(None, max_length=150)
    company_name: str = Field(..., min_length=2, max_length=150)
    gstin: Optional[str] = Field(None, max_length=20)
    otp_code: Optional[str] = Field(None, min_length=6, max_length=6)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v_clean = v.strip().lower()
            if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v_clean):
                raise ValueError("Invalid email format")
            return v_clean
        return None


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Mobile number or Email address")
    password: str = Field(...)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(...)


class ForgotPasswordRequest(BaseModel):
    mobile: str

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)


class ResetPasswordRequest(BaseModel):
    mobile: str
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(char.isdigit() or not char.isalnum() for char in v):
            raise ValueError("Password must contain at least one digit or special character")
        return v


class UserResponse(BaseModel):
    id: int
    mobile: str
    email: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    is_suspended: bool
    created_at: Optional[datetime] = None
    profile_details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class MessageResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
