"""
Tests for Farmer Dashboard APIs — BhoomiBandhu Prompt 7
Tests run against in-memory SQLite (via conftest.py) — zero connection to PostgreSQL.
"""

from decimal import Decimal
import pytest
from app.models.auth_models import User, FarmerProfile
from app.models.models import Farmer, InsuranceRequest, LoanApplication, StorageBooking, GovernmentScheme
from app.services.auth_service import hash_password, create_access_token


def _make_farmer_account(db, *, mobile_suffix="01", is_active=True, is_suspended=False, name="Ramesh Kumar"):
    """Creates a User and linked FarmerProfile + Farmer legacy record."""
    pwd = hash_password("FarmerTest123!")
    user = User(
        mobile=f"91000000{mobile_suffix}",
        email=f"farmer{mobile_suffix}@test.com",
        password_hash=pwd,
        role="farmer",
        is_active=is_active,
        is_suspended=is_suspended,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    farmer = Farmer(
        name=name,
        mobile=f"91000000{mobile_suffix}",
        state="Haryana",
        district="Karnal",
        village="Taraori",
        farmer_category="small",
        land_holding_ha=Decimal("2.50"),
        primary_crop="Wheat",
        aadhaar_linked=True,
        bank_linked=True,
    )
    db.add(farmer)
    db.flush()

    profile = FarmerProfile(
        user_id=user.id,
        legacy_farmer_id=farmer.farmer_id,
    )
    db.add(profile)
    db.flush()

    return user, farmer


def _headers_for(user_id, role="farmer"):
    token, _ = create_access_token(user_id, role)
    return {"Authorization": f"Bearer {token}"}


class TestFarmerDashboardAuth:
    def test_unauthenticated_access_denied(self, client):
        r = client.get("/api/farmers/me")
        assert r.status_code == 401

    def test_non_farmer_role_forbidden(self, client, db_session):
        # Create an admin user attempting to access farmer endpoint
        admin = User(
            mobile="9800000099",
            password_hash=hash_password("Pass123!"),
            role="admin",
            is_active=True,
            is_suspended=False,
            is_verified=True,
        )
        db_session.add(admin)
        db_session.flush()

        headers = _headers_for(admin.id, "admin")
        r = client.get("/api/farmers/me", headers=headers)
        assert r.status_code == 403

    def test_suspended_farmer_forbidden(self, client, db_session):
        user, _ = _make_farmer_account(db_session, mobile_suffix="02", is_suspended=True)
        headers = _headers_for(user.id, "farmer")
        r = client.get("/api/farmers/me", headers=headers)
        assert r.status_code == 403
        assert "suspended" in r.json()["detail"].lower()

    def test_deactivated_farmer_forbidden(self, client, db_session):
        user, _ = _make_farmer_account(db_session, mobile_suffix="03", is_active=False)
        headers = _headers_for(user.id, "farmer")
        r = client.get("/api/farmers/me", headers=headers)
        assert r.status_code == 403
        assert "deactivated" in r.json()["detail"].lower()


class TestFarmerProfileEndpoints:
    def test_get_farmer_profile_success(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="04", name="Suresh Dahiya")
        headers = _headers_for(user.id, "farmer")

        r = client.get("/api/farmers/me", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == user.id
        assert data["farmer_id"] == farmer.farmer_id
        assert data["name"] == "Suresh Dahiya"
        assert data["primary_crop"] == "Wheat"
        assert data["profile_completion_percent"] > 0

    def test_update_farmer_profile_permitted_fields(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="05")
        headers = _headers_for(user.id, "farmer")

        payload = {
            "name": "Updated Name",
            "village": "New Village",
            "primary_crop": "Mustard",
            "land_holding_ha": 3.75,
            "farmer_category": "large",
        }
        r = client.put("/api/farmers/me", json=payload, headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Updated Name"
        assert data["village"] == "New Village"
        assert data["primary_crop"] == "Mustard"
        assert data["land_holding_ha"] == 3.75
        assert data["farmer_category"] == "large"

        # Verify DB was persisted
        db_session.refresh(farmer)
        assert farmer.name == "Updated Name"
        assert farmer.primary_crop == "Mustard"

    def test_invalid_farmer_category_rejected(self, client, db_session):
        user, _ = _make_farmer_account(db_session, mobile_suffix="06")
        headers = _headers_for(user.id, "farmer")
        r = client.put("/api/farmers/me", json={"farmer_category": "invalid_category"}, headers=headers)
        assert r.status_code == 400


class TestFarmerDashboardAndDataIsolation:
    def test_dashboard_aggregates_own_data(self, client, db_session):
        user1, farmer1 = _make_farmer_account(db_session, mobile_suffix="07", name="Farmer One")
        user2, farmer2 = _make_farmer_account(db_session, mobile_suffix="08", name="Farmer Two")

        # Add records for Farmer 1
        ins1 = InsuranceRequest(farmer_id=farmer1.farmer_id, farmer_name="Farmer One", req_status="pending")
        loan1 = LoanApplication(farmer_id=farmer1.farmer_id, farmer_name="Farmer One", loan_amount=100000, loan_type="Crop Loan", app_status="pending")
        book1 = StorageBooking(farmer_id=farmer1.farmer_id, booking_ref="BB-F1-001", quantity_kg=1000, duration_months=3, booking_status="active")
        db_session.add_all([ins1, loan1, book1])

        # Add records for Farmer 2
        ins2 = InsuranceRequest(farmer_id=farmer2.farmer_id, farmer_name="Farmer Two", req_status="approved")
        db_session.add(ins2)
        db_session.flush()

        headers1 = _headers_for(user1.id, "farmer")
        r = client.get("/api/farmers/me/dashboard", headers=headers1)
        assert r.status_code == 200
        data = r.json()

        # Farmer 1 only sees their own 1 insurance, 1 loan, 1 booking
        assert data["total_insurance_requests"] == 1
        assert data["total_loan_applications"] == 1
        assert data["total_storage_bookings"] == 1
        assert len(data["recent_insurance"]) == 1
        assert data["recent_insurance"][0]["id"] == ins1.id

    def test_cross_farmer_data_isolation(self, client, db_session):
        user1, farmer1 = _make_farmer_account(db_session, mobile_suffix="09", name="Isolated One")
        user2, farmer2 = _make_farmer_account(db_session, mobile_suffix="10", name="Isolated Two")

        ins2 = InsuranceRequest(farmer_id=farmer2.farmer_id, farmer_name="Isolated Two", req_status="pending")
        loan2 = LoanApplication(farmer_id=farmer2.farmer_id, farmer_name="Isolated Two", loan_amount=50000, loan_type="Equipment Loan", app_status="pending")
        book2 = StorageBooking(farmer_id=farmer2.farmer_id, booking_ref="BB-F2-001", quantity_kg=500, duration_months=1, booking_status="active")
        db_session.add_all([ins2, loan2, book2])
        db_session.flush()

        # Farmer 1 calls endpoints
        headers1 = _headers_for(user1.id, "farmer")

        r_ins = client.get("/api/farmers/me/insurance", headers=headers1)
        assert r_ins.status_code == 200
        assert r_ins.json()["total"] == 0

        r_loan = client.get("/api/farmers/me/loans", headers=headers1)
        assert r_loan.status_code == 200
        assert r_loan.json()["total"] == 0

        r_book = client.get("/api/farmers/me/bookings", headers=headers1)
        assert r_book.status_code == 200
        assert r_book.json()["total"] == 0
