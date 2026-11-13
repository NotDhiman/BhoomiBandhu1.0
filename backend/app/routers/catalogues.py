from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import Crop, GovernmentScheme
from ..schemas.schemas import CropListResponse, GovernmentSchemeListResponse

router = APIRouter()


@router.get("/api/crops", response_model=CropListResponse)
def get_crops(db: Session = Depends(get_db)):
    crops = db.query(Crop).order_by(Crop.crop_name).all()
    return {"crops": crops}


@router.get("/api/government-schemes", response_model=GovernmentSchemeListResponse)
def get_government_schemes(db: Session = Depends(get_db)):
    schemes = (
        db.query(GovernmentScheme)
        .filter(GovernmentScheme.active == True)
        .order_by(GovernmentScheme.name)
        .all()
    )
    return {"schemes": schemes}
