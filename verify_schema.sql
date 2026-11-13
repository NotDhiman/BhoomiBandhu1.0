-- verify_schema.sql — run this in psql after init_db.py
-- Expected: each query returns the table/column name, not empty

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farmers' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'storage_booking' 
ORDER BY ordinal_position;

SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'farmers'::regclass;
