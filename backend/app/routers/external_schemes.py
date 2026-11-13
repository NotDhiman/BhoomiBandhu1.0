from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, status
import httpx
from ..core.config import (
    GOV_SCHEMES_API_URL,
    GOV_SCHEMES_API_KEY,
    GOV_SCHEMES_API_KEY_HEADER,
    GOV_SCHEMES_API_KEY_PREFIX,
)
from ..schemas.schemas import ExternalSchemesResponse

router = APIRouter(tags=["External Government Schemes"])


@router.get("/api/external-government-schemes", response_model=ExternalSchemesResponse)
async def get_external_schemes():
    if not GOV_SCHEMES_API_URL:
        return ExternalSchemesResponse(
            configured=False,
            count=0,
            schemes=[],
            message="External scheme API is not configured. Set GOV_SCHEMES_API_URL in .env.",
        )

    try:
        parsed = urlparse(GOV_SCHEMES_API_URL)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOV_SCHEMES_API_URL must be a valid HTTP or HTTPS URL.",
        )

    headers = {"Accept": "application/json"}
    if GOV_SCHEMES_API_KEY:
        header_name = GOV_SCHEMES_API_KEY_HEADER or "Authorization"
        prefix = GOV_SCHEMES_API_KEY_PREFIX
        if prefix == "none":
            headers[header_name] = GOV_SCHEMES_API_KEY
        else:
            pfx = prefix or "Bearer"
            headers[header_name] = f"{pfx} {GOV_SCHEMES_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(GOV_SCHEMES_API_URL, headers=headers)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External schemes provider connection failed: {exc}",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External schemes provider returned HTTP {resp.status_code}.",
        )

    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="External schemes provider response was not valid JSON.",
        )

    # Normalize rows matching Express server logic
    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        rows = (
            payload.get("schemes")
            or payload.get("data")
            or payload.get("results")
            or payload.get("items")
            or payload.get("records")
            or []
        )
    else:
        rows = []

    if not isinstance(rows, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="External API response must be an array or contain a schemes/data/results/items/records array.",
        )

    schemes = []
    for idx, item in enumerate(rows):
        if not isinstance(item, dict):
            continue
        schemes.append({
            "id": item.get("id") or item.get("scheme_id") or item.get("code") or idx + 1,
            "slug": item.get("slug") or item.get("code") or item.get("scheme_id") or item.get("id") or f"external-{idx + 1}",
            "name": item.get("name") or item.get("scheme_name") or item.get("title") or item.get("schemeName") or "Government scheme",
            "scheme_type": item.get("scheme_type") or item.get("type") or item.get("category") or item.get("government") or "central",
            "benefit_summary": item.get("benefit_summary") or item.get("description") or item.get("benefits") or item.get("short_description") or item.get("objective") or "",
            "eligibility": item.get("eligibility") or item.get("eligibility_criteria") or item.get("eligibilityCriteria") or "",
            "official_url": item.get("official_url") or item.get("url") or item.get("link") or item.get("apply_url") or item.get("application_url") or "",
        })

    return ExternalSchemesResponse(
        configured=True,
        count=len(schemes),
        schemes=schemes,
    )
