from fastapi import APIRouter, HTTPException, status
import httpx
from ..core.config import GROQ_API_KEY
from ..schemas.schemas import AIChatRequest, AIChatResponse

router = APIRouter(tags=["AI Advisor"])

SYSTEM_PROMPT = (
    "You are BhoomiBandhu AI — a knowledgeable and friendly agricultural advisor for Indian farmers.\n"
    "- Give practical, actionable crop advice in simple language (Hindi/English mix is fine when the user writes in Hinglish).\n"
    "- Focus on crop selection, sowing time, irrigation, fertiliser, pest/disease management and government schemes.\n"
    "- Keep answers concise (under 200 words) unless the user asks for detail.\n"
    "- End with one practical tip the farmer can act on today.\n"
    "- Do not discuss unrelated topics."
)


@router.post("/api/gemini", response_model=AIChatResponse)
async def chat_ai(payload: AIChatRequest):
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="prompt (string) is required",
        )

    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is missing in .env. Get a key at https://console.groq.com/keys",
        )

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
    }
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt[:12000]},
        ],
        "temperature": 0.7,
        "max_tokens": 600,
        "top_p": 0.9,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=body)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error connecting to AI service: {exc}",
        )

    if resp.status_code != 200:
        err_msg = "Groq API error"
        try:
            err_data = resp.json()
            err_msg = err_data.get("error", {}).get("message", err_msg)
        except Exception:
            pass
        raise HTTPException(status_code=resp.status_code, detail=err_msg)

    data = resp.json()
    reply = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "No response.")
    )
    return AIChatResponse(reply=reply)
