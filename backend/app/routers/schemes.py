from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import GovernmentScheme, SchemeEligibilityCheck
from ..schemas.schemas import SchemeEligibilityCheckCreate, SchemeEligibilityCheckResponse

router = APIRouter()

ALLOWED_SLUGS = ["pmkisan", "pmfby", "kcc"]
ALLOWED_CATEGORIES = ["small", "marginal", "large"]
ALLOWED_SEASONS = ["Kharif", "Rabi", "Zaid"]


@router.post("/api/scheme-eligibility-checks", response_model=SchemeEligibilityCheckResponse, status_code=status.HTTP_201_CREATED)
def check_scheme_eligibility(payload: SchemeEligibilityCheckCreate, db: Session = Depends(get_db)):
    slug = payload.scheme_slug.strip()
    category = payload.farmer_category.strip()
    land = payload.land_ha
    season = payload.crop_season.strip()

    if (
        slug not in ALLOWED_SLUGS
        or category not in ALLOWED_CATEGORIES
        or land < 0
        or season not in ALLOWED_SEASONS
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scheme eligibility details.",
        )

    scheme = (
        db.query(GovernmentScheme)
        .filter(GovernmentScheme.slug == slug, GovernmentScheme.active == True)
        .first()
    )
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The selected government scheme is not available in the database.",
        )

    check = SchemeEligibilityCheck(
        scheme_id=scheme.id,
        farmer_category=category,
        land_ha=Decimal(str(land)),
        crop_season=season,
        aadhaar_linked=bool(payload.aadhaar_linked),
        bank_linked=bool(payload.bank_linked),
        is_eligible=bool(payload.is_eligible),
        result_message=payload.result_message.strip() if payload.result_message else None,
    )
    db.add(check)
    db.commit()

    return {
        "success": True,
        "check_id": check.id,
    }
