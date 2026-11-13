import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..core.database import get_db
from ..models.models import CropPrediction, Farmer
from ..schemas.schemas import CropPredictionCreate, CropPredictionResponse
from ..services.crop_service import knn_predict, clean_crop_name

router = APIRouter(tags=["Crop Predictions"])

ALLOWED_SOILS = {"loamy", "clay", "sandy", "red", "black"}
ALLOWED_LEVELS = {"Low", "Medium", "High"}


@router.post(
    "/api/crop-predictions",
    response_model=CropPredictionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_crop_prediction(
    payload: CropPredictionCreate,
    db: Session = Depends(get_db),
):
    # Soil validation
    soil = payload.soil_type.strip().lower()
    if soil not in ALLOWED_SOILS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid soil type '{payload.soil_type}'. Must be one of: {', '.join(sorted(ALLOWED_SOILS))}.",
        )

    # If crop recommendation fields are omitted, run the ML KNN model
    recommended_crop = clean_crop_name(payload.recommended_crop) if payload.recommended_crop else None
    yield_level = payload.yield_level
    risk_level = payload.risk_level
    confidence_percent = payload.confidence_percent
    ai_advice = payload.ai_advice

    if not recommended_crop or not yield_level or not risk_level or confidence_percent is None:
        ml_res = knn_predict(
            rainfall_mm=payload.rainfall_mm,
            temperature_c=payload.temperature_celsius,
            soil_type=soil,
            season=payload.season or "kharif",
            irrigation=payload.irrigation or "irrigated",
        )
        if not recommended_crop:
            recommended_crop = ml_res["recommended_crop"]
        if not yield_level:
            yield_level = ml_res["yield_level"]
        if not risk_level:
            risk_level = ml_res["risk_level"]
        if confidence_percent is None:
            confidence_percent = ml_res["confidence_percent"]
        if not ai_advice:
            ai_advice = ml_res["ai_advice"]

    # Validate levels against schema check constraints
    if yield_level not in ALLOWED_LEVELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid yield_level '{yield_level}'. Must be Low, Medium, or High.",
        )
    if risk_level not in ALLOWED_LEVELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid risk_level '{risk_level}'. Must be Low, Medium, or High.",
        )

    # Optional farmer link via mobile
    farmer_id = None
    if payload.mobile:
        norm_mobile = "".join(c for c in payload.mobile if c.isdigit() or c == "+")
        farmer = db.execute(
            select(Farmer).filter(Farmer.mobile == norm_mobile).limit(1)
        ).scalar_one_or_none()
        if farmer:
            farmer_id = farmer.farmer_id

    prediction = CropPrediction(
        farmer_id=farmer_id,
        rainfall_mm=payload.rainfall_mm,
        temperature_celsius=payload.temperature_celsius,
        soil_type=soil,
        recommended_crop=recommended_crop,
        yield_level=yield_level,
        risk_level=risk_level,
        confidence_percent=int(round(confidence_percent)),
        ai_advice=ai_advice,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return CropPredictionResponse(
        success=True,
        prediction_id=prediction.id,
        recommended_crop=prediction.recommended_crop,
        confidence_percent=prediction.confidence_percent,
        yield_level=prediction.yield_level,
        risk_level=prediction.risk_level,
        ai_advice=prediction.ai_advice,
    )
