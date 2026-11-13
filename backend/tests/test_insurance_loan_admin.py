"""
Tests for Insurance & Loan Administration + Farmer Financial History — Prompt 8.
Executed against in-memory SQLite (via conftest.py) — zero connection to PostgreSQL.
"""

from decimal import Decimal
from datetime import date
import pytest
from app.models.auth_models import User, FarmerProfile
from app.models.models import Farmer, InsuranceRequest, PmfbyEnrollment, LoanApplication
from app.services.auth_service import hash_password, create_access_token


def _make_admin(db, *, mobile="9800000001"):
    pwd = hash_password("AdminPass123!")
    user = User(
        mobile=mobile,
        email="admin_p8@test.com",
        password_hash=pwd,
        role="admin",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    return user


def _make_farmer(db, *, suffix="01", name="Ramesh Kumar"):
    pwd = hash_password("FarmerPass123!")
    user = User(
        mobile=f"91000000{suffix}",
        email=f"farmer{suffix}@test.com",
        password_hash=pwd,
        role="farmer",
        is_active=True,
        is_suspended=False,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    farmer = Farmer(
        name=name,
        mobile=f"91000000{suffix}",
        state="Haryana",
        district="Karnal",
        village="Taraori",
        farmer_category="small",
        land_holding_ha=Decimal("2.50"),
        primary_crop="Wheat",
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


def _headers_for(user_id, role="admin"):
    token, _ = create_access_token(user_id, role)
    return {"Authorization": f"Bearer {token}"}


class TestAdminInsuranceManagement:
    def test_admin_can_list_and_search_insurance_requests(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000011")
        _, farmer1 = _make_farmer(db_session, suffix="11", name="Suresh Singh")
        _, farmer2 = _make_farmer(db_session, suffix="12", name="Anita Devi")

        req1 = InsuranceRequest(
            farmer_id=farmer1.farmer_id,
            farmer_name="Suresh Singh",
            district="Karnal",
            crop_name="Wheat",
            request_type="New Insurance Enrollment",
            description="PMFBY request for rabi",
            req_status="pending",
        )
        req2 = InsuranceRequest(
            farmer_id=farmer2.farmer_id,
            farmer_name="Anita Devi",
            district="Rohtak",
            crop_name="Mustard",
            request_type="Crop Loss Claim",
            description="Hailstorm damage",
            req_status="processing",
        )
        db_session.add_all([req1, req2])
        db_session.commit()

        headers = _headers_for(admin.id, "admin")

        # 1. List all
        r = client.get("/api/admin/insurance-requests", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 2

        # 2. Status filter
        r_filtered = client.get("/api/admin/insurance-requests?status=processing", headers=headers)
        assert r_filtered.status_code == 200
        assert all(item["req_status"] == "processing" for item in r_filtered.json()["requests"])

        # 3. Search by farmer name
        r_search = client.get("/api/admin/insurance-requests?search=Anita", headers=headers)
        assert r_search.status_code == 200
        assert len(r_search.json()["requests"]) == 1
        assert r_search.json()["requests"][0]["farmer_name"] == "Anita Devi"

        # 4. Search by application ID
        r_id = client.get(f"/api/admin/insurance-requests?search={req1.id}", headers=headers)
        assert r_id.status_code == 200
        assert any(item["id"] == req1.id for item in r_id.json()["requests"])

    def test_admin_can_view_insurance_detail_with_pmfby(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000013")
        _, farmer = _make_farmer(db_session, suffix="13", name="Kuldeep Yadav")

        req = InsuranceRequest(
            farmer_id=farmer.farmer_id,
            farmer_name="Kuldeep Yadav",
            district="Karnal",
            crop_name="Paddy",
            request_type="New Insurance Enrollment",
            description="Kharif enrollment",
            req_status="pending",
        )
        db_session.add(req)
        db_session.flush()

        pmfby = PmfbyEnrollment(
            insurance_request_id=req.id,
            farmer_id=farmer.farmer_id,
            crop_name="Paddy",
            land_records_verified=True,
            sowing_date=date(2026, 6, 15),
            season="Kharif",
            premium_calculated=Decimal("1250.00"),
        )
        db_session.add(pmfby)
        db_session.commit()

        headers = _headers_for(admin.id, "admin")

        r = client.get(f"/api/admin/insurance-requests/{req.id}", headers=headers)
        assert r.status_code == 200
        detail = r.json()
        assert detail["id"] == req.id
        assert detail["farmer_name"] == "Kuldeep Yadav"
        assert detail["farmer_mobile"] == farmer.mobile
        assert detail["state"] == "Haryana"
        assert detail["pmfby_enrollment"] is not None
        assert detail["pmfby_enrollment"]["season"] == "Kharif"
        assert detail["pmfby_enrollment"]["land_records_verified"] is True
        assert detail["pmfby_enrollment"]["premium_calculated"] == 1250.00

    def test_admin_insurance_stats_endpoint(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000014")
        headers = _headers_for(admin.id, "admin")

        r = client.get("/api/admin/insurance/stats", headers=headers)
        assert r.status_code == 200
        stats = r.json()
        assert "total" in stats
        assert "pending" in stats
        assert "processing" in stats
        assert "approved" in stats
        assert "rejected" in stats
        assert "total_pmfby" in stats

    def test_admin_insurance_status_transitions(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000015")
        _, farmer = _make_farmer(db_session, suffix="15", name="Harpreet Singh")

        req = InsuranceRequest(
            farmer_id=farmer.farmer_id,
            farmer_name="Harpreet Singh",
            district="Ambala",
            crop_name="Wheat",
            request_type="Crop Loss Claim",
            description="Storm loss",
            req_status="pending",
        )
        db_session.add(req)
        db_session.commit()

        headers = _headers_for(admin.id, "admin")

        # 1. Invalid transition (pending -> paid directly is forbidden)
        r_inv = client.patch(
            f"/api/admin/insurance-requests/{req.id}/status",
            json={"status": "paid", "notes": "Trying skip"},
            headers=headers,
        )
        assert r_inv.status_code == 400
        assert "Invalid transition" in r_inv.json()["detail"]

        # 2. Valid transition (pending -> processing)
        r_val = client.patch(
            f"/api/admin/insurance-requests/{req.id}/status",
            json={"status": "processing", "notes": "Officer assigned"},
            headers=headers,
        )
        assert r_val.status_code == 200
        assert r_val.json()["new_status"] == "processing"

        # 3. Valid transition (processing -> approved)
        r_app = client.patch(
            f"/api/admin/insurance-requests/{req.id}/status",
            json={"status": "approved", "notes": "Survey approved"},
            headers=headers,
        )
        assert r_app.status_code == 200
        assert r_app.json()["new_status"] == "approved"


class TestAdminLoanManagement:
    def test_admin_can_list_and_search_loan_applications(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000021")
        _, farmer = _make_farmer(db_session, suffix="21", name="Baldev Raj")

        l1 = LoanApplication(
            farmer_id=farmer.farmer_id,
            farmer_name="Baldev Raj",
            village="Taraori",
            loan_amount=Decimal("150000.00"),
            loan_type="Crop Loan",
            purpose="Fertilizers and seeds",
            app_status="pending",
        )
        l2 = LoanApplication(
            farmer_id=farmer.farmer_id,
            farmer_name="Baldev Raj",
            village="Taraori",
            loan_amount=Decimal("450000.00"),
            loan_type="Equipment Loan",
            purpose="Tractor purchase",
            app_status="under_review",
        )
        db_session.add_all([l1, l2])
        db_session.commit()

        headers = _headers_for(admin.id, "admin")

        # List all
        r = client.get("/api/admin/loan-applications", headers=headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 2

        # Search by loan type
        r_search = client.get("/api/admin/loan-applications?search=Equipment", headers=headers)
        assert r_search.status_code == 200
        assert any("Equipment" in app["loan_type"] for app in r_search.json()["applications"])

        # Search by ID
        r_id = client.get(f"/api/admin/loan-applications?search={l1.id}", headers=headers)
        assert r_id.status_code == 200
        assert any(app["id"] == l1.id for app in r_id.json()["applications"])

    def test_admin_can_view_loan_detail(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000022")
        _, farmer = _make_farmer(db_session, suffix="22", name="Gurmeet Kaur")

        loan = LoanApplication(
            farmer_id=farmer.farmer_id,
            farmer_name="Gurmeet Kaur",
            village="Nilokheri",
            loan_amount=Decimal("200000.00"),
            loan_type="Irrigation Loan",
            purpose="Tube well installation",
            app_status="pending",
        )
        db_session.add(loan)
        db_session.commit()

        headers = _headers_for(admin.id, "admin")

        r = client.get(f"/api/admin/loan-applications/{loan.id}", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == loan.id
        assert data["farmer_name"] == "Gurmeet Kaur"
        assert data["farmer_mobile"] == farmer.mobile
        assert data["state"] == "Haryana"
        assert data["loan_amount"] == 200000.00
        assert data["purpose"] == "Tube well installation"

    def test_admin_loan_stats_endpoint(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000023")
        headers = _headers_for(admin.id, "admin")

        r = client.get("/api/admin/loans/stats", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "pending" in data
        assert "under_review" in data
        assert "approved" in data
        assert "rejected" in data

    def test_admin_loan_status_transitions(self, client, db_session):
        admin = _make_admin(db_session, mobile="9800000024")
        _, farmer = _make_farmer(db_session, suffix="24", name="Virender Sehwag")

        loan = LoanApplication(
            farmer_id=farmer.farmer_id,
            farmer_name="Virender Sehwag",
            village="Jhajjar",
            loan_amount=Decimal("300000.00"),
            loan_type="Crop Loan",
            purpose="Seasonal cultivation",
            app_status="pending",
        )
        db_session.add(loan)
        db_session.commit()

        headers = _headers_for(admin.id, "admin")

        # Valid: pending -> under_review
        r_rev = client.patch(
            f"/api/admin/loan-applications/{loan.id}/status",
            json={"status": "under_review", "notes": "Reviewing land records"},
            headers=headers,
        )
        assert r_rev.status_code == 200
        assert r_rev.json()["new_status"] == "under_review"

        # Valid: under_review -> approved
        r_app = client.patch(
            f"/api/admin/loan-applications/{loan.id}/status",
            json={"status": "approved", "notes": "Approved by bank manager"},
            headers=headers,
        )
        assert r_app.status_code == 200
        assert r_app.json()["new_status"] == "approved"

        # Invalid: approved -> pending is not permitted
        r_back = client.patch(
            f"/api/admin/loan-applications/{loan.id}/status",
            json={"status": "pending", "notes": "Reopen"},
            headers=headers,
        )
        assert r_back.status_code == 400


class TestFarmerFinancialHistoryPrivacyAndIsolation:
    def test_farmer_can_view_own_consolidated_financial_history(self, client, db_session):
        user, farmer = _make_farmer(db_session, suffix="31", name="Ajay Devgan")

        ins = InsuranceRequest(
            farmer_id=farmer.farmer_id,
            farmer_name="Ajay Devgan",
            district="Karnal",
            crop_name="Wheat",
            request_type="New Insurance Enrollment",
            description="PMFBY",
            req_status="approved",
        )
        loan = LoanApplication(
            farmer_id=farmer.farmer_id,
            farmer_name="Ajay Devgan",
            village="Taraori",
            loan_amount=Decimal("100000.00"),
            loan_type="Crop Loan",
            purpose="Seed purchase",
            app_status="pending",
        )
        db_session.add_all([ins, loan])
        db_session.commit()

        farmer_headers = _headers_for(user.id, "farmer")

        # Consolidated history
        r = client.get("/api/farmers/me/financial-history", headers=farmer_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["summary"]["total_insurance_requests"] == 1
        assert data["summary"]["approved_insurance_requests"] == 1
        assert data["summary"]["total_loan_applications"] == 1
        assert data["summary"]["pending_loan_applications"] == 1
        assert len(data["insurance_requests"]) == 1
        assert len(data["loan_applications"]) == 1

        # Alias endpoints
        r_ins = client.get("/api/farmers/me/insurance-history", headers=farmer_headers)
        assert r_ins.status_code == 200
        assert r_ins.json()["total"] == 1

        r_loan = client.get("/api/farmers/me/loan-history", headers=farmer_headers)
        assert r_loan.status_code == 200
        assert r_loan.json()["total"] == 1

    def test_farmer_cross_account_isolation(self, client, db_session):
        user1, farmer1 = _make_farmer(db_session, suffix="32", name="Farmer One")
        user2, farmer2 = _make_farmer(db_session, suffix="33", name="Farmer Two")

        ins1 = InsuranceRequest(
            farmer_id=farmer1.farmer_id,
            farmer_name="Farmer One",
            district="Karnal",
            crop_name="Wheat",
            request_type="New Insurance Enrollment",
            description="Farmer One Private Claim",
            req_status="pending",
        )
        loan2 = LoanApplication(
            farmer_id=farmer2.farmer_id,
            farmer_name="Farmer Two",
            village="Taraori",
            loan_amount=Decimal("75000.00"),
            loan_type="Crop Loan",
            purpose="Farmer Two Private Loan",
            app_status="approved",
        )
        db_session.add_all([ins1, loan2])
        db_session.commit()

        headers1 = _headers_for(user1.id, "farmer")

        # Farmer 1 only sees their own insurance and zero loans
        r1 = client.get("/api/farmers/me/financial-history", headers=headers1)
        assert r1.status_code == 200
        data1 = r1.json()
        assert data1["summary"]["total_insurance_requests"] == 1
        assert data1["summary"]["total_loan_applications"] == 0
        assert data1["insurance_requests"][0]["id"] == ins1.id
        assert len(data1["loan_applications"]) == 0

    def test_unauthorized_and_cross_role_access_denied(self, client, db_session):
        user, _ = _make_farmer(db_session, suffix="34", name="Farmer Role Test")
        farmer_headers = _headers_for(user.id, "farmer")

        # 1. Unauthenticated to admin insurance
        r_unauth = client.get("/api/admin/insurance-requests")
        assert r_unauth.status_code == 401

        # 2. Farmer role forbidden from admin endpoints
        r_forbid_ins = client.get("/api/admin/insurance-requests", headers=farmer_headers)
        assert r_forbid_ins.status_code == 403

        r_forbid_loan = client.get("/api/admin/loan-applications", headers=farmer_headers)
        assert r_forbid_loan.status_code == 403

        # 3. Admin role forbidden from farmer financial history
        admin = _make_admin(db_session, mobile="9800000035")
        admin_headers = _headers_for(admin.id, "admin")
        r_admin_farmer = client.get("/api/farmers/me/financial-history", headers=admin_headers)
        assert r_admin_farmer.status_code == 403

