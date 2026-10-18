import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

env_path = Path(__file__).with_name(".env")
load_dotenv(env_path)

try:
    with psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), version();")
            database, version = cur.fetchone()
            print("Database connection successful!")
            print("Database:", database)
            print("PostgreSQL:", version.split(",")[0])
except Exception as exc:
    print("Database connection failed.")
    print(type(exc).__name__ + ":", exc)