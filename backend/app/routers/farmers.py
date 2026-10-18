from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..schemas.schemas import FarmerProfileCreate, FarmerProfileResponse
from ..services.farmer_service import is_valid_mobile, upsert_farmer

router = APIRouter()


@router.post("/api/farmers", response_model=FarmerProfileResponse, status_code=status.HTTP_200_OK)
def save_farmer_profile(payload: FarmerProfileCreate, db: Session = Depends(get_db)):
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
