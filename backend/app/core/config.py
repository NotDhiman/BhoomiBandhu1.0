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

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_USE_32_PLUS_CHARS")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Application Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()

# OTP Configuration
OTP_HMAC_SECRET = os.getenv("OTP_HMAC_SECRET", "CHANGE_ME_OTP_HMAC_SECRET_32_PLUS_CHARS")
OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "3"))
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock")


