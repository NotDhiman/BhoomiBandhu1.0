import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.database import engine, Base
from app.models import (
    Crop,
    Farmer,
    GovernmentScheme,
    StorageFacility,
    CropPrediction,
    InsuranceRequest,
    PmfbyEnrollment,
    LoanApplication,
    MentalHealthRequest,
    SchemeEligibilityCheck,
    StorageBooking,
)


def init_db():
    print("Initializing PostgreSQL tables using SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


if __name__ == "__main__":
    init_db()
