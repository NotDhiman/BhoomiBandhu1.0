from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import LoanApplication
from ..schemas.schemas import LoanApplicationCreate, LoanApplicationResponse
from ..services.farmer_service import is_valid_mobile, upsert_farmer

router = APIRouter()

ALLOWED_LOAN_TYPES = [
    "Crop Loan",
    "Equipment Loan",
    "Irrigation Loan",
    "Dairy / Livestock Loan",
]


@router.post("/api/loan-applications", response_model=LoanApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_loan(payload: LoanApplicationCreate, db: Session = Depends(get_db)):
    farmer_name = payload.farmer_name.strip()
    village = payload.village.strip()
    amount = payload.loan_amount
    loan_type = payload.loan_type.strip()
    purpose = payload.purpose.strip()
    mobile = payload.mobile.strip() if payload.mobile else None
    state = payload.state.strip() if payload.state else None

    if (
        not farmer_name
        or not village
        or not purpose
        or amount <= 0
        or loan_type not in ALLOWED_LOAN_TYPES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete all loan fields and enter an amount greater than zero.",
        )

    try:
        farmer_id = None
        if mobile:
            if not is_valid_mobile(mobile) or not state:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A valid mobile number and state are required when linking a farmer profile.",
                )
            farmer_id = upsert_farmer(
                db=db,
                name=farmer_name,
                mobile=mobile,
                state=state,
                village=village,
            )

        loan_app = LoanApplication(
            farmer_id=farmer_id,
            farmer_name=farmer_name,
            village=village,
            loan_amount=amount,
            loan_type=loan_type,
            purpose=purpose,
            app_status="pending",
        )
        db.add(loan_app)
        db.commit()

        return {
            "success": True,
            "application_id": loan_app.id,
            "status": "pending",
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise e
