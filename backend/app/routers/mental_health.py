from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import Farmer, MentalHealthRequest
from ..schemas.schemas import MentalHealthRequestCreate, MentalHealthRequestResponse
from ..services.farmer_service import is_valid_mobile, normalize_mobile

router = APIRouter()

ALLOWED_CONCERNS = [
    "Stress & Anxiety",
    "Financial Pressure",
    "Crop Loss Stress",
    "Family or Personal Issues",
]


@router.post("/api/mental-health-requests", response_model=MentalHealthRequestResponse, status_code=status.HTTP_201_CREATED)
def create_mental_health_request(payload: MentalHealthRequestCreate, db: Session = Depends(get_db)):
    farmer_name = payload.farmer_name.strip()
    mobile = payload.mobile.strip()
    concern_type = payload.concern_type.strip()
    message = payload.message.strip() if payload.message else None

    if not farmer_name or not is_valid_mobile(mobile) or concern_type not in ALLOWED_CONCERNS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide your name, valid mobile number and a listed concern type.",
        )

    norm_mobile = normalize_mobile(mobile)
    farmer = db.query(Farmer).filter(Farmer.mobile == norm_mobile).first()
    farmer_id = farmer.farmer_id if farmer else None

    req = MentalHealthRequest(
        farmer_id=farmer_id,
        farmer_name=farmer_name,
        mobile=norm_mobile,
        concern_type=concern_type,
        message=message,
        req_status="pending",
    )
    db.add(req)
    db.commit()

    return {
        "success": True,
        "request_id": req.id,
        "status": "pending",
    }
