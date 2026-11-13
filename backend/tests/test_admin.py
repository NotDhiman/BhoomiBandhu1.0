"""
Admin Portal API Tests — BhoomiBandhu Prompt 6
Tests run against in-memory SQLite (via conftest.py) — zero PostgreSQL connection.

Covers:
1.  Unauthenticated → 401
2.  Farmer → 403
3.  Psychiatrist → 403
4.  Warehouse owner → 403
5.  Admin → 200
6.  Suspended admin → 403
7.  Pagination
8.  Role/status filters
9.  Pending approval grouping
10. Approve psychiatrist updates is_approved
11. Approve warehouse owner updates is_approved
12. Invalid status → 422/400
13. Nonexistent user → 404
14. Nonexistent insurance request → 404
15. Nonexistent loan application → 404
16. Inactive psychiatrist cannot be assigned
17. Unverified psychiatrist cannot be assigned
18. Mental health list does not expose message content
19. Admin actions use authenticated admin ID
20. Self-suspension prevention
"""

import pytest
from app.models.auth_models import User, PsychiatristProfile, WarehouseOwnerProfile
from app.models.models import InsuranceRequest, LoanApplication, MentalHealthRequest
from app.services.auth_service import hash_password, create_access_token


def _make_user(db, *, role="farmer", is_active=True, is_suspended=False, mobile_suffix="0"):
    """Helper to create a user and flush the session."""
    pwd = hash_password("Test1234!")
    user = User(
        mobile=f"900000000{mobile_suffix}",
        email=f"test{mobile_suffix}@test.com",
        password_hash=pwd,
        role=role,
        is_active=is_active,
        is_suspended=is_suspended,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    return user


def _admin_headers(user_id):
    """Generate Bearer token headers for admin auth."""
    token, _ = create_access_token(user_id, "admin")
    return {"Authorization": f"Bearer {token}"}


def _user_headers(user_id, role):
    token, _ = create_access_token(user_id, role)
    return {"Authorization": f"Bearer {token}"}


# ═══════════════════════════════════════════════════════════════
# TEST 1: Unauthenticated → 401
# ═══════════════════════════════════════════════════════════════

class TestAdminAuthEnforcement:
    def test_unauthenticated_returns_401(self, client):
        r = client.get("/api/admin/users")
        assert r.status_code == 401

    def test_farmer_returns_403(self, client, db_session):
        farmer = _make_user(db_session, role="farmer", mobile_suffix="1")
        headers = _user_headers(farmer.id, "farmer")
        r = client.get("/api/admin/users", headers=headers)
        assert r.status_code == 403

    def test_psychiatrist_returns_403(self, client, db_session):
        psych = _make_user(db_session, role="psychiatrist", mobile_suffix="2")
        PsychiatristProfile(
            user_id=psych.id,
            license_number="LIC002",
            specialization="General",
            is_approved=True,
        )
        db_session.flush()
        headers = _user_headers(psych.id, "psychiatrist")
        r = client.get("/api/admin/users", headers=headers)
        assert r.status_code == 403

    def test_warehouse_owner_returns_403(self, client, db_session):
        wh = _make_user(db_session, role="warehouse_owner", mobile_suffix="3")
        WarehouseOwnerProfile(
            user_id=wh.id,
            company_name="TestCorp",
            is_approved=True,
        )
        db_session.flush()
        headers = _user_headers(wh.id, "warehouse_owner")
        r = client.get("/api/admin/users", headers=headers)
        assert r.status_code == 403

    def test_admin_succeeds(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="4")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "users" in data
        assert "total" in data

    def test_suspended_admin_returns_403(self, client, db_session):
        admin = _make_user(db_session, role="admin", is_suspended=True, mobile_suffix="5")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users", headers=headers)
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════
# TEST 7: Pagination
# ═══════════════════════════════════════════════════════════════

class TestUserPagination:
    def test_pagination_params(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="6")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users?page=1&per_page=5", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["page"] == 1
        assert data["per_page"] == 5

    def test_per_page_max_100(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="7")
        headers = _admin_headers(admin.id)
        # per_page > 100 should be rejected by Pydantic validation
        r = client.get("/api/admin/users?per_page=200", headers=headers)
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════
# TEST 8: Role and Status Filters
# ═══════════════════════════════════════════════════════════════

class TestFilters:
    def test_valid_role_filter(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="8")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users?role=farmer", headers=headers)
        assert r.status_code == 200

    def test_invalid_role_filter(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="9")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users?role=superadmin", headers=headers)
        assert r.status_code == 400

    def test_valid_status_filter(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="10")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users?status=active", headers=headers)
        assert r.status_code == 200

    def test_invalid_status_filter(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="11")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users?status=banned", headers=headers)
        assert r.status_code == 400


# ═══════════════════════════════════════════════════════════════
# TEST 9: Pending Approval Grouping
# ═══════════════════════════════════════════════════════════════

class TestPendingApprovals:
    def test_pending_approvals_structure(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="12")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/pending-approvals", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "psychiatrists" in data
        assert "warehouse_owners" in data
        assert "total" in data
        assert isinstance(data["psychiatrists"], list)
        assert isinstance(data["warehouse_owners"], list)

    def test_pending_psychiatrist_appears(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="13")
        psych = _make_user(db_session, role="psychiatrist", mobile_suffix="14")
        profile = PsychiatristProfile(
            user_id=psych.id,
            license_number="LIC-PENDING-001",
            specialization="General",
            is_approved=False,
        )
        db_session.add(profile)
        db_session.flush()
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/pending-approvals", headers=headers)
        data = r.json()
        assert data["total"] >= 1
        psych_ids = [p["user_id"] for p in data["psychiatrists"]]
        assert psych.id in psych_ids


# ═══════════════════════════════════════════════════════════════
# TEST 10-11: Approving Professionals
# ═══════════════════════════════════════════════════════════════

class TestApproveFlow:
    def test_approve_psychiatrist(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="15")
        psych = _make_user(db_session, role="psychiatrist", mobile_suffix="16")
        profile = PsychiatristProfile(
            user_id=psych.id,
            license_number="LIC-APPROVE-001",
            specialization="CBT",
            is_approved=False,
        )
        db_session.add(profile)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/users/{psych.id}/status",
            json={"status": "active"},
            headers=headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["new_status"] == "active"

        # Verify profile was approved in DB
        db_session.refresh(profile)
        assert profile.is_approved is True

    def test_approve_warehouse_owner(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="17")
        wh = _make_user(db_session, role="warehouse_owner", mobile_suffix="18")
        profile = WarehouseOwnerProfile(
            user_id=wh.id,
            company_name="TestWarehouse",
            gstin="27AADCB1234F1Z5",
            is_approved=False,
        )
        db_session.add(profile)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/users/{wh.id}/status",
            json={"status": "active"},
            headers=headers,
        )
        assert r.status_code == 200

        db_session.refresh(profile)
        assert profile.is_approved is True


# ═══════════════════════════════════════════════════════════════
# TEST 12: Invalid Status Values
# ═══════════════════════════════════════════════════════════════

class TestInvalidStatus:
    def test_invalid_status_rejected_by_schema(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="19")
        farmer = _make_user(db_session, role="farmer", mobile_suffix="20")
        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/users/{farmer.id}/status",
            json={"status": "deleted"},
            headers=headers,
        )
        assert r.status_code == 422  # Pydantic validation


# ═══════════════════════════════════════════════════════════════
# TEST 13-15: Nonexistent Resources → 404
# ═══════════════════════════════════════════════════════════════

class TestNotFound:
    def test_nonexistent_user(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="21")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/users/99999", headers=headers)
        assert r.status_code == 404

    def test_nonexistent_insurance_request(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="22")
        headers = _admin_headers(admin.id)
        r = client.patch(
            "/api/admin/insurance-requests/99999/status",
            json={"status": "processing"},
            headers=headers,
        )
        assert r.status_code == 404

    def test_nonexistent_loan_application(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="23")
        headers = _admin_headers(admin.id)
        r = client.patch(
            "/api/admin/loan-applications/99999/status",
            json={"status": "under_review"},
            headers=headers,
        )
        assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════
# TEST 16-17: Mental Health Assignment Validation
# ═══════════════════════════════════════════════════════════════

class TestMentalHealthAssignment:
    def test_assign_to_inactive_psychiatrist_fails(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="24")
        psych = _make_user(db_session, role="psychiatrist", is_active=False, mobile_suffix="25")
        profile = PsychiatristProfile(
            user_id=psych.id,
            license_number="LIC-INACT-001",
            specialization="General",
            is_approved=True,
        )
        db_session.add(profile)
        mh = MentalHealthRequest(
            farmer_name="Test Farmer",
            concern_type="Stress & Anxiety",
            req_status="pending",
        )
        db_session.add(mh)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/mental-health-requests/{mh.id}/assign",
            json={"psychiatrist_user_id": psych.id},
            headers=headers,
        )
        assert r.status_code == 400
        assert "inactive" in r.json()["detail"].lower()

    def test_assign_to_unapproved_psychiatrist_fails(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="26")
        psych = _make_user(db_session, role="psychiatrist", mobile_suffix="27")
        profile = PsychiatristProfile(
            user_id=psych.id,
            license_number="LIC-UNAP-001",
            specialization="General",
            is_approved=False,
        )
        db_session.add(profile)
        mh = MentalHealthRequest(
            farmer_name="Test Farmer 2",
            concern_type="Financial Pressure",
            req_status="pending",
        )
        db_session.add(mh)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/mental-health-requests/{mh.id}/assign",
            json={"psychiatrist_user_id": psych.id},
            headers=headers,
        )
        assert r.status_code == 400
        assert "verified" in r.json()["detail"].lower()

    def test_assign_to_suspended_psychiatrist_fails(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="27a")
        psych = _make_user(db_session, role="psychiatrist", is_suspended=True, mobile_suffix="27b")
        profile = PsychiatristProfile(
            user_id=psych.id,
            license_number="LIC-SUSP-001",
            specialization="General",
            is_approved=True,
        )
        db_session.add(profile)
        mh = MentalHealthRequest(
            farmer_name="Test Farmer Susp",
            concern_type="Stress & Anxiety",
            req_status="pending",
        )
        db_session.add(mh)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/mental-health-requests/{mh.id}/assign",
            json={"psychiatrist_user_id": psych.id},
            headers=headers,
        )
        assert r.status_code == 400
        assert "suspended" in r.json()["detail"].lower()

    def test_assign_to_nonexistent_psychiatrist_fails(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="27c")
        mh = MentalHealthRequest(
            farmer_name="Test Farmer NonEx",
            concern_type="Stress & Anxiety",
            req_status="pending",
        )
        db_session.add(mh)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/mental-health-requests/{mh.id}/assign",
            json={"psychiatrist_user_id": 99999},
            headers=headers,
        )
        assert r.status_code == 404
        assert "not found" in r.json()["detail"].lower()

    def test_assign_to_non_psychiatrist_fails(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="27d")
        farmer = _make_user(db_session, role="farmer", mobile_suffix="27e")
        wh = _make_user(db_session, role="warehouse_owner", mobile_suffix="27f")
        mh = MentalHealthRequest(
            farmer_name="Test Farmer NonPsych",
            concern_type="Stress & Anxiety",
            req_status="pending",
        )
        db_session.add(mh)
        db_session.flush()

        headers = _admin_headers(admin.id)

        # Farmer assignment fails
        r1 = client.patch(
            f"/api/admin/mental-health-requests/{mh.id}/assign",
            json={"psychiatrist_user_id": farmer.id},
            headers=headers,
        )
        assert r1.status_code == 400
        assert "not a psychiatrist" in r1.json()["detail"].lower()

        # Warehouse owner assignment fails
        r2 = client.patch(
            f"/api/admin/mental-health-requests/{mh.id}/assign",
            json={"psychiatrist_user_id": wh.id},
            headers=headers,
        )
        assert r2.status_code == 400
        assert "not a psychiatrist" in r2.json()["detail"].lower()

    def test_assign_does_not_mutate_status_or_claim_persistence(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="27g")
        psych = _make_user(db_session, role="psychiatrist", mobile_suffix="27h")
        profile = PsychiatristProfile(
            user_id=psych.id,
            license_number="LIC-PERSIST-001",
            specialization="General",
            is_approved=True,
        )
        db_session.add(profile)
        mh = MentalHealthRequest(
            farmer_name="Test Farmer Persist",
            concern_type="Stress & Anxiety",
            req_status="pending",
        )
        db_session.add(mh)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/mental-health-requests/{mh.id}/assign",
            json={"psychiatrist_user_id": psych.id},
            headers=headers,
        )
        assert r.status_code == 200
        data = r.json()
        # Per Prompt 6B: do NOT pretend assignment is complete
        assert data["success"] is False
        assert "cannot be persisted" in data["message"].lower()

        # Per Prompt 6B: do NOT use status as a substitute for assignment
        db_session.refresh(mh)
        assert mh.req_status == "pending"


# ═══════════════════════════════════════════════════════════════
# TEST 18: Mental Health List Privacy
# ═══════════════════════════════════════════════════════════════

class TestMentalHealthPrivacy:
    def test_list_does_not_expose_message(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="28")
        mh = MentalHealthRequest(
            farmer_name="Private Farmer",
            mobile="9999999999",
            concern_type="Crop Loss Stress",
            message="THIS IS PRIVATE CONTENT THAT MUST NOT APPEAR",
            req_status="pending",
        )
        db_session.add(mh)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/mental-health-requests", headers=headers)
        assert r.status_code == 200
        data = r.json()
        raw = r.text
        assert "THIS IS PRIVATE CONTENT" not in raw
        # Verify request items don't have 'message' field
        for item in data["requests"]:
            assert "message" not in item


# ═══════════════════════════════════════════════════════════════
# TEST 19: Self-Suspension Prevention
# ═══════════════════════════════════════════════════════════════

class TestAdminSafeguards:
    def test_cannot_suspend_self(self, client, db_session):
        admin1 = _make_user(db_session, role="admin", mobile_suffix="29a")
        admin2 = _make_user(db_session, role="admin", mobile_suffix="29b")
        headers = _admin_headers(admin1.id)
        r = client.patch(
            f"/api/admin/users/{admin1.id}/status",
            json={"status": "suspended"},
            headers=headers,
        )
        assert r.status_code == 400
        assert "own" in r.json()["detail"].lower()

    def test_cannot_reject_self(self, client, db_session):
        admin1 = _make_user(db_session, role="admin", mobile_suffix="30a")
        admin2 = _make_user(db_session, role="admin", mobile_suffix="30b")
        headers = _admin_headers(admin1.id)
        r = client.patch(
            f"/api/admin/users/{admin1.id}/status",
            json={"status": "rejected"},
            headers=headers,
        )
        assert r.status_code == 400
        assert "own" in r.json()["detail"].lower()

    def test_last_active_admin_cannot_be_suspended(self, client, db_session):
        # Single active admin in database
        admin = _make_user(db_session, role="admin", mobile_suffix="30c")
        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/users/{admin.id}/status",
            json={"status": "suspended"},
            headers=headers,
        )
        assert r.status_code == 400
        assert "last active administrator" in r.json()["detail"].lower()

    def test_last_active_admin_cannot_be_rejected(self, client, db_session):
        # Single active admin in database
        admin = _make_user(db_session, role="admin", mobile_suffix="30d")
        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/users/{admin.id}/status",
            json={"status": "rejected"},
            headers=headers,
        )
        assert r.status_code == 400
        assert "last active administrator" in r.json()["detail"].lower()

    def test_multiple_active_admins_stepwise_suspension(self, client, db_session):
        # 3 active admins
        admin1 = _make_user(db_session, role="admin", mobile_suffix="30e")
        admin2 = _make_user(db_session, role="admin", mobile_suffix="30f")
        admin3 = _make_user(db_session, role="admin", mobile_suffix="30g")

        headers = _admin_headers(admin1.id)

        # Suspending admin2 succeeds (2 active admins remain: admin1, admin3)
        r1 = client.patch(
            f"/api/admin/users/{admin2.id}/status",
            json={"status": "suspended"},
            headers=headers,
        )
        assert r1.status_code == 200
        assert r1.json()["new_status"] == "suspended"

        # Suspending admin3 succeeds (1 active admin remains: admin1)
        r2 = client.patch(
            f"/api/admin/users/{admin3.id}/status",
            json={"status": "suspended"},
            headers=headers,
        )
        assert r2.status_code == 200
        assert r2.json()["new_status"] == "suspended"

        # Suspending admin1 now fails because admin1 is the last active admin
        r3 = client.patch(
            f"/api/admin/users/{admin1.id}/status",
            json={"status": "suspended"},
            headers=headers,
        )
        assert r3.status_code == 400
        assert "last active administrator" in r3.json()["detail"].lower()

    def test_cannot_suspend_already_suspended_admin(self, client, db_session):
        admin1 = _make_user(db_session, role="admin", mobile_suffix="30h")
        admin2 = _make_user(db_session, role="admin", mobile_suffix="30i")

        headers = _admin_headers(admin1.id)

        # First suspension succeeds
        r1 = client.patch(
            f"/api/admin/users/{admin2.id}/status",
            json={"status": "suspended"},
            headers=headers,
        )
        assert r1.status_code == 200

        # Repeated suspension is rejected because user is already suspended
        r2 = client.patch(
            f"/api/admin/users/{admin2.id}/status",
            json={"status": "suspended"},
            headers=headers,
        )
        assert r2.status_code == 400
        assert "already in 'suspended' status" in r2.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════════
# TEST: Dashboard Stats
# ═══════════════════════════════════════════════════════════════

class TestDashboardStats:
    def test_stats_structure(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="31")
        headers = _admin_headers(admin.id)
        r = client.get("/api/admin/stats", headers=headers)
        assert r.status_code == 200
        data = r.json()
        expected_keys = [
            "total_farmers",
            "total_psychiatrists",
            "total_warehouse_owners",
            "pending_approvals",
            "total_insurance_requests",
            "pending_insurance_requests",
            "total_loan_applications",
            "pending_loan_applications",
            "total_mental_health_requests",
            "pending_mental_health_requests",
            "total_storage_bookings",
            "active_storage_bookings",
        ]
        for key in expected_keys:
            assert key in data
            assert isinstance(data[key], int)


# ═══════════════════════════════════════════════════════════════
# TEST: User Detail
# ═══════════════════════════════════════════════════════════════

class TestUserDetail:
    def test_user_detail_no_password(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="32")
        farmer = _make_user(db_session, role="farmer", mobile_suffix="33")
        headers = _admin_headers(admin.id)
        r = client.get(f"/api/admin/users/{farmer.id}", headers=headers)
        assert r.status_code == 200
        raw = r.text
        assert "password_hash" not in raw
        assert "token_hash" not in raw
        assert "otp_hash" not in raw


# ═══════════════════════════════════════════════════════════════
# TEST: Insurance/Loan Status Transitions
# ═══════════════════════════════════════════════════════════════

class TestStatusTransitions:
    def test_insurance_valid_transition(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="34")
        ins = InsuranceRequest(
            farmer_name="Test Farmer",
            req_status="pending",
        )
        db_session.add(ins)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/insurance-requests/{ins.id}/status",
            json={"status": "processing"},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["new_status"] == "processing"

    def test_insurance_invalid_transition(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="35")
        ins = InsuranceRequest(
            farmer_name="Test Farmer 2",
            req_status="rejected",
        )
        db_session.add(ins)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/insurance-requests/{ins.id}/status",
            json={"status": "approved"},
            headers=headers,
        )
        assert r.status_code == 400

    def test_loan_valid_transition(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="36")
        loan = LoanApplication(
            farmer_name="Test Farmer 3",
            loan_amount=50000,
            app_status="pending",
        )
        db_session.add(loan)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/loan-applications/{loan.id}/status",
            json={"status": "under_review"},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["new_status"] == "under_review"

    def test_loan_invalid_transition(self, client, db_session):
        admin = _make_user(db_session, role="admin", mobile_suffix="37")
        loan = LoanApplication(
            farmer_name="Test Farmer 4",
            loan_amount=50000,
            app_status="approved",
        )
        db_session.add(loan)
        db_session.flush()

        headers = _admin_headers(admin.id)
        r = client.patch(
            f"/api/admin/loan-applications/{loan.id}/status",
            json={"status": "rejected"},
            headers=headers,
        )
        assert r.status_code == 400


# ═══════════════════════════════════════════════════════════════
# PROMPT 6B: Security Gap Tests
# ═══════════════════════════════════════════════════════════════

class TestUnauthorizedRoleAccessToAllEndpoints:
    """Verifies that non-admin roles and unauthenticated callers are blocked from all admin endpoints."""

    ADMIN_ENDPOINTS = [
        "/api/admin/users",
        "/api/admin/stats",
        "/api/admin/pending-approvals",
        "/api/admin/insurance-requests",
        "/api/admin/loan-applications",
        "/api/admin/mental-health-requests",
    ]

    def test_unauthenticated_blocked_from_all_endpoints(self, client):
        for ep in self.ADMIN_ENDPOINTS:
            r = client.get(ep)
            assert r.status_code == 401, f"Expected 401 for unauthenticated {ep}, got {r.status_code}"

    def test_farmer_blocked_from_all_endpoints(self, client, db_session):
        farmer = _make_user(db_session, role="farmer", mobile_suffix="901")
        headers = _user_headers(farmer.id, "farmer")
        for ep in self.ADMIN_ENDPOINTS:
            r = client.get(ep, headers=headers)
            assert r.status_code == 403, f"Expected 403 for farmer {ep}, got {r.status_code}"

    def test_psychiatrist_blocked_from_all_endpoints(self, client, db_session):
        psych = _make_user(db_session, role="psychiatrist", mobile_suffix="902")
        headers = _user_headers(psych.id, "psychiatrist")
        for ep in self.ADMIN_ENDPOINTS:
            r = client.get(ep, headers=headers)
            assert r.status_code == 403, f"Expected 403 for psychiatrist {ep}, got {r.status_code}"

    def test_warehouse_owner_blocked_from_all_endpoints(self, client, db_session):
        wh = _make_user(db_session, role="warehouse_owner", mobile_suffix="903")
        headers = _user_headers(wh.id, "warehouse_owner")
        for ep in self.ADMIN_ENDPOINTS:
            r = client.get(ep, headers=headers)
            assert r.status_code == 403, f"Expected 403 for warehouse_owner {ep}, got {r.status_code}"


class TestRejectedUserProtectedOperations:
    """Verifies that rejected (is_active=False) users cannot perform any protected operations."""

    def test_rejected_user_token_rejected_at_auth_me(self, client, db_session):
        rejected_farmer = _make_user(db_session, role="farmer", is_active=False, mobile_suffix="910")
        headers = _user_headers(rejected_farmer.id, "farmer")
        r = client.get("/api/auth/me", headers=headers)
        assert r.status_code == 403
        assert "deactivated" in r.json()["detail"].lower()

    def test_rejected_admin_cannot_access_admin_api(self, client, db_session):
        rejected_admin = _make_user(db_session, role="admin", is_active=False, mobile_suffix="911")
        headers = _admin_headers(rejected_admin.id)
        r = client.get("/api/admin/stats", headers=headers)
        assert r.status_code == 403
        assert "deactivated" in r.json()["detail"].lower()

