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


class TestLegacyFarmerEndpointSecurity:
    def test_unauthenticated_new_farmer_registration_succeeds(self, client, db_session):
        payload = {
            "name": "New Legacy Farmer",
            "mobile": "9998887766",
            "state": "Punjab",
            "primary_crop": "Wheat",
        }
        r = client.post("/api/farmers", json=payload)
        assert r.status_code == 200
        assert r.json()["success"] is True
        assert "farmer_id" in r.json()

    def test_unauthenticated_attempt_to_overwrite_registered_farmer_rejected(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="71", name="Registered Farmer")
        payload = {
            "name": "Attacker Hijack Name",
            "mobile": farmer.mobile,
            "state": "Attacker State",
            "primary_crop": "Sugarcane",
        }
        r = client.post("/api/farmers", json=payload)
        assert r.status_code == 401
        assert "registered account" in r.json()["detail"].lower()

        # Verify DB was NOT modified
        db_session.refresh(farmer)
        assert farmer.name == "Registered Farmer"

    def test_unauthenticated_attempt_to_overwrite_existing_legacy_farmer_rejected(self, client, db_session):
        # Create unlinked legacy farmer
        leg_farmer = Farmer(
            name="Existing Legacy",
            mobile="9991112233",
            state="Haryana",
            primary_crop="Rice",
        )
        db_session.add(leg_farmer)
        db_session.flush()

        payload = {
            "name": "Overwrite Attempt",
            "mobile": "9991112233",
            "state": "Haryana",
            "primary_crop": "Barley",
        }
        r = client.post("/api/farmers", json=payload)
        assert r.status_code == 403
        assert "already exists" in r.json()["detail"].lower()

        db_session.refresh(leg_farmer)
        assert leg_farmer.name == "Existing Legacy"

    def test_authenticated_farmer_can_update_own_profile_via_legacy_endpoint(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="72", name="Original Name")
        headers = _headers_for(user.id, "farmer")
        payload = {
            "name": "Legit Updated Name",
            "mobile": farmer.mobile,
            "state": "Punjab",
            "primary_crop": "Cotton",
        }
        r = client.post("/api/farmers", json=payload, headers=headers)
        assert r.status_code == 200
        assert r.json()["success"] is True

        db_session.refresh(farmer)
        assert farmer.name == "Legit Updated Name"
        assert farmer.primary_crop == "Cotton"

    def test_authenticated_farmer_cannot_overwrite_another_farmer_profile(self, client, db_session):
        user1, farmer1 = _make_farmer_account(db_session, mobile_suffix="73", name="Farmer Victim")
        user2, farmer2 = _make_farmer_account(db_session, mobile_suffix="74", name="Farmer Attacker")

        headers2 = _headers_for(user2.id, "farmer")
        payload = {
            "name": "Hijacked By Farmer 2",
            "mobile": farmer1.mobile,
            "state": "Haryana",
            "primary_crop": "Maize",
        }
        r = client.post("/api/farmers", json=payload, headers=headers2)
        assert r.status_code == 403
        assert "permission" in r.json()["detail"].lower()

        db_session.refresh(farmer1)
        assert farmer1.name == "Farmer Victim"

    # ── PROMPT 7B: Regression & Normalization Bypass Tests ──

    def test_unauthenticated_exact_stored_mobile_rejected_and_data_unchanged(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="75", name="Pristine Farmer")
        payload = {
            "name": "Attacker Hijack Exact",
            "mobile": farmer.mobile,
            "state": "Malicious State",
            "primary_crop": "Poppy",
        }
        r = client.post("/api/farmers", json=payload)
        assert r.status_code == 401
        db_session.refresh(farmer)
        assert farmer.name == "Pristine Farmer"
        assert farmer.state == "Haryana"
        assert farmer.primary_crop == "Wheat"

    def test_unauthenticated_formatted_parentheses_mobile_rejected_and_data_unchanged(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="76", name="Parentheses Farmer")
        # farmer.mobile is e.g. "9100000076". Format with parentheses: "(9100) 000076"
        formatted_mobile = f"({farmer.mobile[:4]}) {farmer.mobile[4:]}"
        payload = {
            "name": "Attacker Hijack Parentheses",
            "mobile": formatted_mobile,
            "state": "Malicious State",
            "primary_crop": "Poppy",
        }
        r = client.post("/api/farmers", json=payload)
        assert r.status_code == 401
        db_session.refresh(farmer)
        assert farmer.name == "Parentheses Farmer"
        assert farmer.state == "Haryana"
        assert farmer.primary_crop == "Wheat"

    def test_unauthenticated_formatted_spaces_and_hyphens_mobile_rejected_and_data_unchanged(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="77", name="Hyphen Farmer")
        # Format with spaces and hyphens: "9100-000-077"
        formatted_mobile = f"{farmer.mobile[:4]}-{farmer.mobile[4:7]}-{farmer.mobile[7:]}"
        payload = {
            "name": "Attacker Hijack Hyphen",
            "mobile": formatted_mobile,
            "state": "Malicious State",
            "primary_crop": "Poppy",
        }
        r = client.post("/api/farmers", json=payload)
        assert r.status_code == 401
        db_session.refresh(farmer)
        assert farmer.name == "Hyphen Farmer"
        assert farmer.state == "Haryana"
        assert farmer.primary_crop == "Wheat"

    def test_unauthenticated_formatted_combination_mobile_rejected_and_data_unchanged(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="78", name="Combo Farmer")
        # Format with combination: "(910) 000-0078"
        formatted_mobile = f"({farmer.mobile[:3]}) {farmer.mobile[3:6]}-{farmer.mobile[6:]}"
        payload = {
            "name": "Attacker Hijack Combo",
            "mobile": formatted_mobile,
            "state": "Malicious State",
            "primary_crop": "Poppy",
        }
        r = client.post("/api/farmers", json=payload)
        assert r.status_code == 401
        db_session.refresh(farmer)
        assert farmer.name == "Combo Farmer"
        assert farmer.state == "Haryana"
        assert farmer.primary_crop == "Wheat"

    def test_authenticated_farmer_can_update_own_profile_with_formatted_mobile(self, client, db_session):
        user, farmer = _make_farmer_account(db_session, mobile_suffix="79", name="Self Format Farmer")
        headers = _headers_for(user.id, "farmer")
        formatted_mobile = f"({farmer.mobile[:4]}) {farmer.mobile[4:7]}-{farmer.mobile[7:]}"
        payload = {
            "name": "Legit Self Updated",
            "mobile": formatted_mobile,
            "state": "Punjab",
            "primary_crop": "Barley",
        }
        r = client.post("/api/farmers", json=payload, headers=headers)
        assert r.status_code == 200
        assert r.json()["success"] is True

        db_session.refresh(farmer)
        assert farmer.name == "Legit Self Updated"
        assert farmer.primary_crop == "Barley"
        assert farmer.state == "Punjab"

    def test_authenticated_farmer_cannot_overwrite_another_farmer_with_formatted_mobile(self, client, db_session):
        user1, farmer1 = _make_farmer_account(db_session, mobile_suffix="80", name="Victim 80")
        user2, farmer2 = _make_farmer_account(db_session, mobile_suffix="81", name="Attacker 81")

        headers2 = _headers_for(user2.id, "farmer")
        formatted_victim_mobile = f"({farmer1.mobile[:4]}) {farmer1.mobile[4:7]}-{farmer1.mobile[7:]}"
        payload = {
            "name": "Attacker Overwrite Via Format",
            "mobile": formatted_victim_mobile,
            "state": "Rajasthan",
            "primary_crop": "Mustard",
        }
        r = client.post("/api/farmers", json=payload, headers=headers2)
        assert r.status_code == 403
        assert "permission" in r.json()["detail"].lower()

        db_session.refresh(farmer1)
        assert farmer1.name == "Victim 80"
        assert farmer1.state == "Haryana"
        assert farmer1.primary_crop == "Wheat"

    def test_supplied_invalid_or_expired_token_returns_401_not_silent_anonymous(self, client, db_session):
        # 1. Malformed token
        r_malformed = client.post(
            "/api/farmers",
            json={"name": "Test", "mobile": "9990001122", "state": "Punjab"},
            headers={"Authorization": "Bearer malformed.invalid.token"},
        )
        assert r_malformed.status_code == 401

        # 2. Expired or wrong signature token
        r_bad_sig = client.post(
            "/api/farmers",
            json={"name": "Test", "mobile": "9990001122", "state": "Punjab"},
            headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M"},
        )
        assert r_bad_sig.status_code == 401

    def test_empty_bearer_value_rejected(self, client, db_session):
        """Phase 4 edge-case: 'Authorization: Bearer ' (empty string after Bearer) must return 401."""
        r = client.post(
            "/api/farmers",
            json={"name": "Test", "mobile": "9990001133", "state": "Punjab"},
            headers={"Authorization": "Bearer "},
        )
        assert r.status_code == 401, (
            f"Empty Bearer value must not be treated as anonymous (got {r.status_code})"
        )

    def test_non_bearer_scheme_rejected(self, client, db_session):
        """Phase 4 edge-case: 'Authorization: Basic ...' must return 401 for optional-auth endpoints."""
        import base64
        basic_cred = base64.b64encode(b"user:password").decode()
        r = client.post(
            "/api/farmers",
            json={"name": "Test", "mobile": "9990001144", "state": "Punjab"},
            headers={"Authorization": f"Basic {basic_cred}"},
        )
        assert r.status_code == 401, (
            f"Non-Bearer authorization scheme must be rejected with 401 (got {r.status_code})"
        )

    def test_malformed_authorization_header_rejected(self, client, db_session):
        """Phase 4 edge-case: 'Authorization: just-a-value' (no scheme) must return 401."""
        r = client.post(
            "/api/farmers",
            json={"name": "Test", "mobile": "9990001155", "state": "Punjab"},
            headers={"Authorization": "just-a-value-no-scheme"},
        )
        assert r.status_code == 401, (
            f"Malformed Authorization header (no scheme) must be rejected with 401 (got {r.status_code})"
        )
