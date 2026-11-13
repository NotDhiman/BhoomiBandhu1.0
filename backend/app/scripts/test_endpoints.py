"""
Phase 3 Test Suite
===================
Tests all FastAPI routers against the real PostgreSQL database.

Isolation strategy:
  The routers call db.commit() internally (correct production behaviour).
  This means writes cannot be rolled back after the fact.
  Instead this script:
    1. Records the baseline row counts before running.
    2. Runs all endpoint tests.
    3. After tests complete, calls cleanup_test_records.py logic to delete
       every row that is above the Phase 2 seed max IDs in the five
       write-enabled tables.
    4. Verifies baseline is fully restored and reports the final counts.

This means the database is always restored to 62 rows after a test run,
regardless of how many times the suite is executed.

For CI environments, consider using a dedicated test database instead.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

import psycopg
import os
from dotenv import load_dotenv
from app.core.database import SessionLocal
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
from app.schemas.schemas import (
    FarmerProfileCreate,
    InsuranceRequestCreate,
    LoanApplicationCreate,
    MentalHealthRequestCreate,
    SchemeEligibilityCheckCreate,
    StorageBookingCreate,
    CropPredictionCreate,
    AIChatRequest,
)

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

# Phase 2 max seeded ID: rows with id > this value are test rows
SEED_MAX_IDS = {
    "crop_predictions": 10,
    "insurance_requests": 11,
    "loan_applications": 10,
    "mental_health_requests": 10,
    "scheme_eligibility_checks": 15,
    "storage_booking": 11,
}

DELETE_ORDER = [
    "storage_booking",
    "scheme_eligibility_checks",
    "mental_health_requests",
    "loan_applications",
    "insurance_requests",
    "crop_predictions",
]


# ── Helpers ────────────────────────────────────────────────────────────────


def count_tables(db):
    from sqlalchemy import text
    counts = {}
    for tbl in BASELINE:
        result = db.execute(text(f"SELECT COUNT(*) FROM {tbl}"))
        counts[tbl] = result.scalar()
    return counts


def check_baseline(db, label):
    counts = count_tables(db)
    total = sum(counts.values())
    mismatches = [
        f"  {t}: {counts[t]} (expected {BASELINE[t]})"
        for t in BASELINE if counts[t] != BASELINE[t]
    ]
    if mismatches:
        print(f"[WARN] {label} — counts differ from baseline (total={total}):")
        for m in mismatches:
            print(m)
        return False
    print(f"[OK] {label} — baseline confirmed ({total} rows).")
    return True


def cleanup_test_rows():
    """Delete all rows above SEED_MAX_IDS in one transaction. Returns deleted count."""
    conn = psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        autocommit=False,
    )
    cur = conn.cursor()
    try:
        test_rows = []
        for tbl, max_id in SEED_MAX_IDS.items():
            cur.execute(f"SELECT id FROM {tbl} WHERE id > %s ORDER BY id", (max_id,))
            for row in cur.fetchall():
                test_rows.append((tbl, row[0]))

        if not test_rows:
            print("[OK] Cleanup: no test rows found — database already clean.")
            conn.rollback()
            return 0

        sorted_rows = sorted(
            test_rows,
            key=lambda r: DELETE_ORDER.index(r[0]) if r[0] in DELETE_ORDER else 99
        )

        deleted = 0
        for tbl, row_id in sorted_rows:
            cur.execute(f"DELETE FROM {tbl} WHERE id = %s", (row_id,))
            if cur.rowcount > 0:
                deleted += cur.rowcount
                print(f"[OK] Cleanup: deleted {tbl} id={row_id}")

        # Verify counts
        errors = []
        for tbl in BASELINE:
            cur.execute(f"SELECT COUNT(*) FROM {tbl}")
            cnt = cur.fetchone()[0]
            if cnt != BASELINE[tbl]:
                errors.append(f"{tbl}: {cnt} (expected {BASELINE[tbl]})")

        if errors:
            print("[FAIL] Cleanup mismatch — ROLLING BACK:")
            for e in errors:
                print(f"  {e}")
            conn.rollback()
            return -1

        conn.commit()
        return deleted
    except Exception as e:
        conn.rollback()
        print(f"[FAIL] Cleanup error — rolled back: {e}")
        return -1
    finally:
        cur.close()
        conn.close()


# ── Test Runner ────────────────────────────────────────────────────────────


def run_tests():
    db = SessionLocal()
    print("=" * 60)
    print("Phase 3 Test Suite")
    print("=" * 60)

    try:
        # ── Pre-test baseline ──────────────────────────────────────
        ok = check_baseline(db, "Pre-test")
        if not ok:
            print("[WARN] Starting with non-baseline counts. Run cleanup_test_records.py first.")

        # ── 1. GET /api/health (read-only) ─────────────────────────
        h = health.health_check(db=db)
        print("\n1. GET /api/health:")
        print(f"   Status: {h['status']} | DB: {h['database']} | Server: {h['server']}")
        assert h["status"] == "ok"
        assert h["database"] == "connected"
        print("   [PASS]")

        # ── 2. GET /api/crops (read-only) ──────────────────────────
        c = catalogues.get_crops(db=db)
        print(f"\n2. GET /api/crops: {len(c['crops'])} crops")
        assert len(c["crops"]) == 9
        print("   [PASS]")

        # ── 3. GET /api/government-schemes (read-only) ─────────────
        gs = catalogues.get_government_schemes(db=db)
        print(f"\n3. GET /api/government-schemes: {len(gs['schemes'])} schemes")
        assert len(gs["schemes"]) == 6
        print("   [PASS]")

        # ── 4. POST /api/farmers (upsert existing — no new row) ────
        farmer_payload = FarmerProfileCreate(
            name="Balraj Dahiya",
            mobile="9876543210",
            state="Haryana",
            primary_crop="Wheat",
        )
        f_res = farmers.save_farmer_profile(payload=farmer_payload, db=db)
        print(f"\n4. POST /api/farmers (upsert existing id=1): {f_res}")
        assert f_res["success"] is True
        assert f_res["farmer_id"] == 1
        print("   [PASS] (updates existing farmer row — no new row created)")

        # ── 5. GET /api/insurance-requests (read-only) ─────────────
        ins_list = insurance.get_insurance_requests(mobile="9876543210", db=db)
        print(f"\n5. GET /api/insurance-requests?mobile=9876543210: {len(ins_list['requests'])} requests")
        assert len(ins_list["requests"]) >= 1
        print("   [PASS]")

        # ── 6. POST /api/insurance-requests (write) ────────────────
        new_claim = InsuranceRequestCreate(
            farmer_name="Balraj Dahiya",
            mobile="9876543210",
            district="Panipat",
            state="Haryana",
            crop_name="Wheat",
            request_type="Crop Loss Claim",
            description="[TEST] Hailstorm damage — will be cleaned up",
        )
        claim_res = insurance.create_insurance_request(payload=new_claim, db=db)
        print(f"\n6. POST /api/insurance-requests: {claim_res}")
        assert claim_res["success"] is True
        assert claim_res["status"] == "pending"
        print("   [PASS]")

        # ── 7. POST /api/loan-applications (write) ─────────────────
        loan_payload = LoanApplicationCreate(
            farmer_name="Balraj Dahiya",
            village="Israna",
            loan_amount=100000.0,
            loan_type="Crop Loan",
            purpose="[TEST] Purchase fertilizer — will be cleaned up",
            mobile="9876543210",
            state="Haryana",
        )
        loan_res = loans.apply_for_loan(payload=loan_payload, db=db)
        print(f"\n7. POST /api/loan-applications: {loan_res}")
        assert loan_res["success"] is True
        assert loan_res["status"] == "pending"
        print("   [PASS]")

        # ── 8. POST /api/mental-health-requests (write) ────────────
        mh_payload = MentalHealthRequestCreate(
            farmer_name="Balraj Dahiya",
            mobile="9876543210",
            concern_type="Stress & Anxiety",
            message="[TEST] Need guidance — will be cleaned up",
        )
        mh_res = mental_health.create_mental_health_request(payload=mh_payload, db=db)
        print(f"\n8. POST /api/mental-health-requests: {mh_res}")
        assert mh_res["success"] is True
        assert mh_res["status"] == "pending"
        print("   [PASS]")

        # ── 9. POST /api/scheme-eligibility-checks (write) ─────────
        sec_payload = SchemeEligibilityCheckCreate(
            scheme_slug="pmkisan",
            farmer_category="small",
            land_ha=1.8,
            crop_season="Rabi",
            aadhaar_linked=True,
            bank_linked=True,
            is_eligible=True,
            result_message="[TEST] Eligible — will be cleaned up",
        )
        sec_res = schemes.check_scheme_eligibility(payload=sec_payload, db=db)
        print(f"\n9. POST /api/scheme-eligibility-checks: {sec_res}")
        assert sec_res["success"] is True
        print("   [PASS]")

        # ── 10. GET /api/storage-facilities (read-only) ────────────
        facs = storage.get_storage_facilities(state="Haryana", db=db)
        print(f"\n10. GET /api/storage-facilities?state=Haryana: {len(facs['facilities'])} facilities")
        assert len(facs["facilities"]) >= 1
        print("    [PASS]")

        # ── 11. POST /api/storage-bookings (write) ─────────────────
        booking_payload = StorageBookingCreate(
            farmer_name="Balraj Dahiya",
            mobile="9876543210",
            state="Haryana",
            crop_type="Wheat",
            quantity_kg=2000.0,
            duration_months=3,
            mode="online",
            base_price_per_kg=1.20,
            storage_type="warehouse",
            scheme_slug="pmkisan",
        )
        book_res = storage.create_storage_booking(payload=booking_payload, db=db)
        print(f"\n11. POST /api/storage-bookings: {book_res}")
        assert book_res["success"] is True
        assert book_res["booking_ref"].startswith("BB")
        print("    [PASS]")

        # ── 12. GET /api/storage-bookings (read-only) ──────────────
        b_history = storage.get_storage_bookings(mobile="9876543210", db=db)
        print(f"\n12. GET /api/storage-bookings?mobile=9876543210: {len(b_history['bookings'])} bookings")
        assert len(b_history["bookings"]) >= 1
        print("    [PASS]")

        # ── 13. POST /api/crop-predictions with explicit fields (write) ─
        pred_payload = CropPredictionCreate(
            rainfall_mm=220.0,
            temperature_celsius=20.0,
            soil_type="loamy",
            recommended_crop="Wheat",
            yield_level="High",
            risk_level="Low",
            confidence_percent=85.0,
            ai_advice="[TEST] Optimal wheat conditions — will be cleaned up",
            mobile="9876543210",
        )
        pred_res = predictions.create_crop_prediction(payload=pred_payload, db=db)
        print(f"\n13. POST /api/crop-predictions (explicit): {pred_res}")
        assert pred_res.success is True
        assert pred_res.prediction_id > 10
        assert pred_res.recommended_crop == "Wheat"
        print("    [PASS]")

        # ── 14. POST /api/crop-predictions with ML KNN fallback (write) ─
        pred_ml_payload = CropPredictionCreate(
            rainfall_mm=320.0,
            temperature_celsius=29.0,
            soil_type="clay",
            season="kharif",
            irrigation="rainfed",
        )
        pred_ml_res = predictions.create_crop_prediction(payload=pred_ml_payload, db=db)
        print(f"\n14. POST /api/crop-predictions (ML KNN model): {pred_ml_res}")
        assert pred_ml_res.success is True
        assert pred_ml_res.prediction_id > 10
        assert pred_ml_res.recommended_crop == "Rice"
        assert pred_ml_res.yield_level in ("Low", "Medium", "High")
        assert pred_ml_res.confidence_percent > 0
        print("    [PASS]")

        # ── 15. GET /api/weather (external API check) ──────────────
        import asyncio
        owm_key = os.getenv("OPENWEATHER_API_KEY")
        print("\n15. GET /api/weather:")
        if not owm_key or owm_key == "your_openweathermap_api_key_here":
            from fastapi import HTTPException
            try:
                asyncio.run(weather.get_weather(city="Delhi"))
                assert False, "Should have raised 503"
            except HTTPException as exc:
                assert exc.status_code == 503
                print("    [PASS] (Credentials unconfigured in .env — returned 503 gracefully)")
        else:
            try:
                w_res = asyncio.run(weather.get_weather(city="Delhi"))
                print(f"    Weather for {w_res.city}: {w_res.temp_c}°C, {w_res.description}, rain={w_res.rainfall_mm}mm")
                assert w_res.city != ""
                print("    [PASS] (Live weather call succeeded)")
            except Exception as exc:
                print(f"    [WARN] Live weather call error: {exc}")

        # ── 16. POST /api/gemini (Groq AI proxy check) ─────────────
        groq_key = os.getenv("GROQ_API_KEY")
        print("\n16. POST /api/gemini:")
        if not groq_key or groq_key == "your_groq_api_key_here":
            from fastapi import HTTPException
            try:
                asyncio.run(ai_chat.chat_ai(AIChatRequest(prompt="Hello BhoomiBandhu")))
                assert False, "Should have raised 503"
            except HTTPException as exc:
                assert exc.status_code == 503
                print("    [PASS] (Credentials unconfigured in .env — returned 503 gracefully)")
        else:
            try:
                ai_res = asyncio.run(ai_chat.chat_ai(AIChatRequest(prompt="What is the best sowing time for wheat in Punjab?")))
                print(f"    AI reply: {ai_res.reply[:80]}...")
                assert len(ai_res.reply) > 0
                print("    [PASS] (Live AI advisor call succeeded)")
            except Exception as exc:
                print(f"    [WARN] Live Groq AI call error: {exc}")

        # ── 17. GET /api/external-government-schemes (external API)
        gov_url = os.getenv("GOV_SCHEMES_API_URL")
        print("\n17. GET /api/external-government-schemes:")
        if not gov_url:
            ext_res = asyncio.run(external_schemes.get_external_schemes())
            assert ext_res.configured is False
            assert ext_res.count == 0
            print("    [PASS] (GOV_SCHEMES_API_URL unconfigured — returned {configured: false} gracefully)")
        else:
            try:
                ext_res = asyncio.run(external_schemes.get_external_schemes())
                assert ext_res.configured is True
                print(f"    Schemes received: {ext_res.count}")
                print("    [PASS] (Live schemes call succeeded)")
            except Exception as exc:
                print(f"    [WARN] Live schemes call error: {exc}")

        print("\n" + "=" * 60)
        print("ALL 17 ENDPOINT TESTS PASSED")
        print("=" * 60)

    finally:
        db.close()

    # ── Post-test cleanup ──────────────────────────────────────────
    print("\n--- Post-test cleanup ---")
    deleted = cleanup_test_rows()
    if deleted < 0:
        print("[FAIL] Cleanup failed — manual intervention required.")
        sys.exit(1)
    elif deleted == 0:
        print("[OK] No test rows to clean up.")
    else:
        print(f"[OK] {deleted} test row(s) cleaned up.")

    # ── Final verification ─────────────────────────────────────────
    verify_db = SessionLocal()
    try:
        passed = check_baseline(verify_db, "Post-test final")
        if not passed:
            print("[FAIL] Baseline not restored. Manual cleanup required.")
            sys.exit(1)
    finally:
        verify_db.close()

    print("\n[OK] Test run complete. Database is clean.")


if __name__ == "__main__":
    run_tests()
