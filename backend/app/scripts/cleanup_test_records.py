"""
Phase 3 Remediation: Safe Cleanup Script
Deletes ONLY rows that exceed the Phase 2 baseline maximum IDs.
Uses a single transaction - rolls back entirely on any error.
Idempotent: safe to run multiple times (no-ops when already clean).

Phase 2 baseline max IDs (last seeded row per table):
  insurance_requests:        max_seed_id = 11
  loan_applications:         max_seed_id = 10
  mental_health_requests:    max_seed_id = 10
  scheme_eligibility_checks: max_seed_id = 15
  storage_booking:           max_seed_id = 11

All other tables have no test rows above seed range and are not touched.

Sequences: NOT reset. Current values are already above remaining max IDs,
so leaving them prevents future duplicate-key errors.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

import psycopg
import os
from dotenv import load_dotenv

load_dotenv(backend_dir / ".env")

# Phase 2 baseline: expected row count per table
BASELINE = {
    "crops": 9,
    "farmers": 6,
    "government_schemes": 6,
    "storage_facilities": 5,
    "crop_predictions": 5,
    "insurance_requests": 6,
    "pmfby_enrollments": 5,
    "loan_applications": 5,
    "mental_health_requests": 5,
    "scheme_eligibility_checks": 5,
    "storage_booking": 5,
}

# Phase 2 max seeded ID per table (rows with id > this are test rows)
# Tables not listed here have no id-based test rows.
SEED_MAX_IDS = {
    "crop_predictions": 10,
    "insurance_requests": 11,
    "loan_applications": 10,
    "mental_health_requests": 10,
    "scheme_eligibility_checks": 15,
    "storage_booking": 11,
}


def get_conn():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        autocommit=False,
    )


def count_tables(cur):
    counts = {}
    for tbl in BASELINE:
        cur.execute(f"SELECT COUNT(*) FROM {tbl}")
        counts[tbl] = cur.fetchone()[0]
    return counts


def find_test_rows(cur):
    """Return list of (table, id) for all rows above the seed max ID."""
    found = []
    for tbl, max_seed_id in SEED_MAX_IDS.items():
        cur.execute(f"SELECT id FROM {tbl} WHERE id > %s ORDER BY id", (max_seed_id,))
        rows = cur.fetchall()
        for row in rows:
            found.append((tbl, row[0]))
    return found


def main():
    print("=" * 60)
    print("Phase 3 Remediation: Safe Test-Record Cleanup")
    print("=" * 60)

    conn = get_conn()
    cur = conn.cursor()

    try:
        pre_counts = count_tables(cur)
        total_pre = sum(pre_counts.values())
        print(f"\nPre-cleanup total rows: {total_pre}")
        for tbl, cnt in pre_counts.items():
            baseline = BASELINE[tbl]
            marker = " <- test rows present" if cnt > baseline else ""
            print(f"  {tbl}: {cnt}{marker}")

        test_rows = find_test_rows(cur)
        if not test_rows:
            print("\n[OK] No test records found - database is already clean. Nothing to delete.")
            conn.rollback()
            return

        print(f"\nFound {len(test_rows)} test record(s) to delete:")
        for tbl, row_id in test_rows:
            print(f"  DELETE FROM {tbl} WHERE id = {row_id}")

        # Delete in reverse FK-safe order (storage_booking first, then independent tables)
        DELETE_ORDER = [
            "storage_booking",
            "scheme_eligibility_checks",
            "mental_health_requests",
            "loan_applications",
            "insurance_requests",
            "crop_predictions",
        ]
        # Sort test_rows so storage_booking goes first
        sorted_rows = sorted(
            test_rows,
            key=lambda r: DELETE_ORDER.index(r[0]) if r[0] in DELETE_ORDER else 99
        )

        deleted_count = 0
        for tbl, row_id in sorted_rows:
            cur.execute(f"DELETE FROM {tbl} WHERE id = %s", (row_id,))
            n = cur.rowcount
            if n > 0:
                print(f"  [OK] Deleted {n} row from {tbl} (id={row_id})")
                deleted_count += n
            else:
                print(f"  [--] Row not found in {tbl} (id={row_id}) - already gone")

        post_counts = count_tables(cur)
        total_post = sum(post_counts.values())
        print(f"\nPost-cleanup total rows: {total_post}")

        errors = []
        for tbl, cnt in post_counts.items():
            baseline = BASELINE[tbl]
            status_marker = "[OK]" if cnt == baseline else "[MISMATCH]"
            print(f"  {tbl}: {cnt} (expected {baseline}) {status_marker}")
            if cnt != baseline:
                errors.append(f"{tbl}: got {cnt}, expected {baseline}")

        if errors:
            print(f"\n[FAIL] Baseline mismatch - ROLLING BACK")
            for e in errors:
                print(f"  {e}")
            conn.rollback()
            sys.exit(1)

        conn.commit()
        print(f"\n[OK] COMMIT: {deleted_count} test row(s) removed. Baseline restored.")
        print("[OK] Sequences NOT reset (already above remaining max IDs).")

    except Exception as e:
        conn.rollback()
        print(f"\n[FAIL] ERROR - rolled back: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
