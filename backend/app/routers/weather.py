import math
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
import httpx
from ..core.config import OPENWEATHER_API_KEY
from ..schemas.schemas import WeatherResponse

router = APIRouter(tags=["Weather"])


def estimate_rainfall(humidity: float) -> int:
    """Estimates rainfall in mm based on relative humidity when precipitation is 0."""
    if humidity >= 85:
        return 350
    if humidity >= 70:
        return 230
    if humidity >= 55:
        return 150
    if humidity >= 40:
        return 90
    return 50


@router.get("/api/weather", response_model=WeatherResponse)
async def get_weather(city: str = Query(..., min_length=1, max_length=100)):
    city_clean = city.strip()
    if not city_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="city query parameter is required",
        )

    if not OPENWEATHER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENWEATHER_API_KEY is missing in .env",
        )

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city_clean,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error connecting to weather service: {exc}",
        )

    if resp.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="City not found",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=resp.json().get("message", "Weather API error"),
        )

    data = resp.json()
    main = data.get("main", {})
    rain_data = data.get("rain", {})
    wind_data = data.get("wind", {})
    weather_arr = data.get("weather", [])
    sys_data = data.get("sys", {})

    temp = round(main.get("temp", 0))
    feels_like = round(main.get("feels_like", 0))
    humidity = main.get("humidity", 0)

    # Rainfall calculation matching Express server:
    # rain in mm = (rain.1h or rain.3h or 0) * 30, or estimated from humidity
    rain_val = (rain_data.get("1h") or rain_data.get("3h") or 0) * 30
    rainfall_mm = round(rain_val) if rain_val else estimate_rainfall(humidity)

    description = weather_arr[0].get("description", "Current weather") if weather_arr else "Current weather"
    icon_code = weather_arr[0].get("icon") if weather_arr else None
    icon_url = f"https://openweathermap.org/img/wn/{icon_code}@2x.png" if icon_code else None

    # wind speed in m/s converted to km/h
    wind_kmh = round((wind_data.get("speed") or 0) * 3.6)

    return WeatherResponse(
        city=data.get("name", city_clean),
        country=sys_data.get("country"),
        temp_c=temp,
        feels_like_c=feels_like,
        humidity_pct=humidity,
        rainfall_mm=rainfall_mm,
        description=description,
        wind_kmh=wind_kmh,
        icon=icon_url,
    )
