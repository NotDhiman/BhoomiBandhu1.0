import sys
from pathlib import Path

# Ensure backend directory is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    health,
    catalogues,
    farmers,
    insurance,
    loans,
    mental_health,
    schemes,
    storage,
    predictions,
    weather,
    ai_chat,
    external_schemes,
)

app = FastAPI(
    title="BhoomiBandhu API",
    description="A Trusted Friend for Every Farmer",
    version="1.0.0",
)

# Enable CORS for React frontend (Vite dev server and production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router)
app.include_router(catalogues.router)
app.include_router(farmers.router)
app.include_router(insurance.router)
app.include_router(loans.router)
app.include_router(mental_health.router)
app.include_router(schemes.router)
app.include_router(storage.router)
app.include_router(predictions.router)
app.include_router(weather.router)
app.include_router(ai_chat.router)
app.include_router(external_schemes.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to BhoomiBandhu API!",
        "status": "running",
    }