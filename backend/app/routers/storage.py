import secrets
import time
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import GovernmentScheme, StorageFacility, StorageBooking
from ..schemas.schemas import (
    StorageFacilitiesListResponse,
    StorageBookingCreate,
    StorageBookingResponse,
    StorageBookingListResponse,
    StorageBookingItem,
)
from ..services.farmer_service import (
    clean_crop_name,
    is_valid_mobile,
    normalize_mobile,
    upsert_farmer,
)

router = APIRouter()

ALLOWED_STORAGE_TYPES = ["cold_storage", "warehouse", "offline"]
ALLOWED_MODES = ["online", "offline"]
ALLOWED_STORAGE_SCHEMES = ["pmkisan", "gramin_bhandaran", "state_subsidy"]


@router.get("/api/storage-facilities", response_model=StorageFacilitiesListResponse)
def get_storage_facilities(state: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = (
        db.query(StorageFacility)
        .filter(
            StorageFacility.status.in_(["available", "limited"]),
            StorageFacility.available_space_tons > 0,
        )
    )
    if state and state.strip():
        query = query.filter(StorageFacility.state == state.strip())

    facilities = (
        query.order_by(StorageFacility.govt_approved.desc(), StorageFacility.rating.desc())
        .limit(100)
        .all()
    )
    return {"facilities": facilities}


@router.post("/api/storage-bookings", response_model=StorageBookingResponse, status_code=status.HTTP_201_CREATED)
def create_storage_booking(payload: StorageBookingCreate, db: Session = Depends(get_db)):
    farmer_name = payload.farmer_name.strip()
    mobile = payload.mobile.strip()
    state = payload.state.strip()
    crop_name = clean_crop_name(payload.crop_type)
    quantity = payload.quantity_kg
    months = payload.duration_months
    mode = payload.mode.strip().lower()
    base_price = payload.base_price_per_kg
    storage_type = payload.storage_type.strip()
    scheme_slug = payload.scheme_slug.strip() if payload.scheme_slug else None

    if (
        not farmer_name
        or not is_valid_mobile(mobile)
        or not state
        or not crop_name
        or quantity <= 0
        or months < 1
        or mode not in ALLOWED_MODES
        or base_price <= 0
        or storage_type not in ALLOWED_STORAGE_TYPES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete the storage booking details using valid values.",
        )

    if scheme_slug and scheme_slug not in ALLOWED_STORAGE_SCHEMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid storage subsidy selected.",
        )

    try:
        farmer_id = upsert_farmer(
            db=db,
            name=farmer_name,
            mobile=mobile,
            state=state,
            primary_crop=crop_name,
        )

        scheme_id = None
        benefit = Decimal("0.00")
        if scheme_slug:
            scheme = (
                db.query(GovernmentScheme)
                .filter(GovernmentScheme.slug == scheme_slug, GovernmentScheme.active == True)
                .first()
            )
            if not scheme:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The selected storage scheme is not active in the database.",
                )
            scheme_id = scheme.id
            benefit = Decimal(str(scheme.storage_benefit_per_kg or 0.00))

        facility = (
            db.query(StorageFacility)
            .filter(
                StorageFacility.state == state,
                StorageFacility.storage_type == storage_type,
                StorageFacility.mode == mode,
                StorageFacility.status.in_(["available", "limited"]),
                StorageFacility.available_space_tons > 0,
            )
            .order_by(StorageFacility.rating.desc())
            .first()
        )
        facility_id = facility.id if facility else None

        base_dec = Decimal(str(base_price))
        effective = max(Decimal("0.00"), base_dec - benefit)
        total = round(effective * Decimal(str(quantity)) * Decimal(str(months)), 2)

        # Generate booking ref matching Express format: BB<last-8-digits-of-timestamp><4-hex-chars>
        timestamp_part = str(int(time.time() * 1000))[-8:]
        random_part = secrets.token_hex(2).upper()
        booking_ref = f"BB{timestamp_part}{random_part}"

        booking = StorageBooking(
            booking_ref=booking_ref,
            farmer_name=farmer_name,
            mobile=normalize_mobile(mobile),
            facility_id=facility_id,
            state=state,
            crop_type=crop_name,
            quantity_kg=Decimal(str(quantity)),
            duration_months=months,
            mode=mode,
            scheme_id=scheme_id,
            base_price_per_kg=base_dec,
            scheme_benefit_per_kg=benefit,
            effective_price_per_kg=effective,
            total_amount=total,
            booking_status="active",
            farmer_id=farmer_id,
        )
        db.add(booking)
        db.commit()

        return {
            "success": True,
            "booking_id": booking.id,
            "booking_ref": booking_ref,
            "total_amount": float(total),
            "effective_price_per_kg": float(effective),
            "facility_id": facility_id,
            "message": "Storage booking saved.",
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise e


@router.get("/api/storage-bookings", response_model=StorageBookingListResponse)
def get_storage_bookings(mobile: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if not mobile or not is_valid_mobile(mobile):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid mobile number to view storage bookings.",
        )

    norm_mobile = normalize_mobile(mobile)
    rows = (
        db.query(StorageBooking, StorageFacility.name.label("facility_name"))
        .outerjoin(StorageFacility, StorageFacility.id == StorageBooking.facility_id)
        .filter(StorageBooking.mobile == norm_mobile)
        .order_by(StorageBooking.booked_at.desc())
        .limit(50)
        .all()
    )

    bookings = []
    for b, fac_name in rows:
        bookings.append(
            StorageBookingItem(
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
        )

    return {"bookings": bookings}
