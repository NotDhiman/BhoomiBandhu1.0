import psycopg, os
from dotenv import load_dotenv
load_dotenv(r'backend\.env')
conn = psycopg.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD')
)
cur = conn.cursor()
query = "SELECT sequencename, last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename"
cur.execute(query)
for r in cur.fetchall():
    print(r)
conn.close()
