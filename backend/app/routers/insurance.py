from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import Farmer, InsuranceRequest, PmfbyEnrollment
from ..schemas.schemas import (
    InsuranceRequestCreate,
    InsuranceRequestResponse,
    InsuranceRequestListResponse,
)
from ..services.farmer_service import (
    is_valid_mobile,
    normalize_mobile,
    clean_crop_name,
    upsert_farmer,
)

router = APIRouter()


@router.post("/api/insurance-requests", response_model=InsuranceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_insurance_request(payload: InsuranceRequestCreate, db: Session = Depends(get_db)):
    farmer_name = payload.farmer_name.strip()
    district = payload.district.strip()
    crop_name = clean_crop_name(payload.crop_name)
    request_type = payload.request_type.strip()
    description = payload.description.strip()
    state = payload.state.strip()
    mobile = payload.mobile.strip()

    if (
        not farmer_name
        or not district
        or not crop_name
        or not description
        or request_type not in ["New Insurance Enrollment", "Crop Loss Claim"]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete all insurance form fields with a valid request type.",
        )

    if not is_valid_mobile(mobile) or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid mobile number and state are required to link your request to your farmer profile.",
        )

    try:
        farmer_id = upsert_farmer(
            db=db,
            name=farmer_name,
            mobile=mobile,
            state=state,
            district=district,
            primary_crop=crop_name,
        )

        insurance_req = InsuranceRequest(
            farmer_id=farmer_id,
            farmer_name=farmer_name,
            district=district,
            crop_name=crop_name,
            request_type=request_type,
            description=description,
            req_status="pending",
        )
        db.add(insurance_req)
        db.flush()

        if request_type == "New Insurance Enrollment":
            pmfby_row = PmfbyEnrollment(
                insurance_request_id=insurance_req.id,
                farmer_id=farmer_id,
                crop_name=crop_name,
                land_records_verified=False,
            )
            db.add(pmfby_row)

        db.commit()

        return {
            "success": True,
            "request_id": insurance_req.id,
            "status": "pending",
            "message": "Insurance request saved.",
        }
    except Exception as e:
        db.rollback()
        raise e


@router.get("/api/insurance-requests", response_model=InsuranceRequestListResponse)
def get_insurance_requests(mobile: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if not mobile or not is_valid_mobile(mobile):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter the mobile number used when submitting the insurance request.",
        )

    norm_mobile = normalize_mobile(mobile)
    rows = (
        db.query(InsuranceRequest)
        .join(Farmer, Farmer.farmer_id == InsuranceRequest.farmer_id)
        .filter(Farmer.mobile == norm_mobile)
        .order_by(InsuranceRequest.submitted_at.desc())
        .limit(50)
        .all()
    )

    return {"requests": rows}
