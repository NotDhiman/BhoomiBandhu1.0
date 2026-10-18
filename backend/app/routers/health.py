from datetime import datetime, timezone
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.database import get_db

router = APIRouter()


@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "unavailable"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "unavailable"

    owm_key = os.getenv("OPENWEATHER_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    return {
        "status": "ok",
        "server": "BhoomiBandhu FastAPI Backend",
        "time": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "keys": {
            "openweather": "set" if owm_key else "missing",
            "groq": "set" if groq_key else "missing",
        },
    }
