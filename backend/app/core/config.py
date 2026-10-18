import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "bhoomi_bandhu")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# External APIs
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GOV_SCHEMES_API_URL = os.getenv("GOV_SCHEMES_API_URL", "")
GOV_SCHEMES_API_KEY = os.getenv("GOV_SCHEMES_API_KEY", "")
GOV_SCHEMES_API_KEY_HEADER = os.getenv("GOV_SCHEMES_API_KEY_HEADER", "Authorization")
GOV_SCHEMES_API_KEY_PREFIX = os.getenv("GOV_SCHEMES_API_KEY_PREFIX", "Bearer")
