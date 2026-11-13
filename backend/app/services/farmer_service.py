import re
from typing import Optional
from sqlalchemy.orm import Session
from ..models.models import Farmer


def normalize_mobile(mobile: Optional[str]) -> str:
    if not mobile:
        return ""
    return re.sub(r"[\s()-]", "", mobile.strip())


def is_valid_mobile(mobile: Optional[str]) -> bool:
    norm = normalize_mobile(mobile)
    return bool(re.match(r"^\+?[0-9]{7,15}$", norm))


def clean_crop_name(name: Optional[str]) -> Optional[str]:
    if not name or not isinstance(name, str):
        return None
    # Strip emojis and whitespace
    cleaned = re.sub(r"[\U00010000-\U0010ffff]", "", name)
    cleaned = re.sub(r"[\uFE0F\u200D]", "", cleaned).strip()[:80]
    return cleaned if cleaned else None


def upsert_farmer(
    db: Session,
    name: str,
    mobile: str,
    state: str,
    district: Optional[str] = None,
    village: Optional[str] = None,
    primary_crop: Optional[str] = None,
) -> Optional[int]:
    if not name or not mobile or not state:
        return None
    norm_mobile = normalize_mobile(mobile)
    farmer = db.query(Farmer).filter(Farmer.mobile == norm_mobile).first()
    if farmer:
        farmer.name = name.strip()[:100]
        farmer.state = state.strip()[:50]
        if district:
            farmer.district = district.strip()[:80]
        if village:
            farmer.village = village.strip()[:100]
        if primary_crop:
            cleaned = clean_crop_name(primary_crop)
            if cleaned:
                farmer.primary_crop = cleaned
        db.flush()
        return farmer.farmer_id
    else:
        new_farmer = Farmer(
            name=name.strip()[:100],
            mobile=norm_mobile,
            state=state.strip()[:50],
            district=district.strip()[:80] if district else None,
            village=village.strip()[:100] if village else None,
            primary_crop=clean_crop_name(primary_crop),
        )
        db.add(new_farmer)
        db.flush()
        return new_farmer.farmer_id
