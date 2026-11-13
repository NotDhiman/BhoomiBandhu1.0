"""
Tests for Warehouse Owner Portal APIs — BhoomiBandhu Prompt 7
Tests run against in-memory SQLite (via conftest.py) — zero connection to PostgreSQL.
"""

import pytest
from app.models.auth_models import User, WarehouseOwnerProfile
from app.services.auth_service import hash_password, create_access_token


def _make_warehouse_owner(db, *, mobile_suffix="20", is_approved=True, is_active=True, is_suspended=False):
    """Creates a User and linked WarehouseOwnerProfile."""
    pwd = hash_password("WarehousePass123!")
    user = User(
        mobile=f"92000000{mobile_suffix}",
        email=f"wh{mobile_suffix}@test.com",
        password_hash=pwd,
        role="warehouse_owner",
        is_active=is_active,
        is_suspended=is_suspended,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    profile = WarehouseOwnerProfile(
        user_id=user.id,
        company_name=f"Shree Ram Warehousing {mobile_suffix}",
        gstin=f"06AAACR{mobile_suffix}001Z1",
        is_approved=is_approved,
    )
    db.add(profile)
    db.flush()

    return user, profile


def _headers_for(user_id, role="warehouse_owner"):
    token, _ = create_access_token(user_id, role)
    return {"Authorization": f"Bearer {token}"}


class TestWarehousePortalAuthAndApproval:
    def test_unauthenticated_access_denied(self, client):
        r = client.get("/api/warehouse/me")
        assert r.status_code == 401

    def test_non_warehouse_role_forbidden(self, client, db_session):
        farmer_user = User(
            mobile="9800000188",
            password_hash=hash_password("Pass123!"),
            role="farmer",
            is_active=True,
            is_suspended=False,
            is_verified=True,
        )
        db_session.add(farmer_user)
        db_session.flush()

        headers = _headers_for(farmer_user.id, "farmer")
        r = client.get("/api/warehouse/me", headers=headers)
        assert r.status_code == 403

    def test_unapproved_warehouse_owner_profile_accessible_but_dashboard_blocked(self, client, db_session):
        # A pending warehouse owner (is_approved=False) can view their profile:
        user, profile = _make_warehouse_owner(db_session, mobile_suffix="21", is_approved=False)
        headers = _headers_for(user.id, "warehouse_owner")

        # Profile view succeeds
        r_profile = client.get("/api/warehouse/me", headers=headers)
        assert r_profile.status_code == 200
        assert r_profile.json()["is_approved"] is False
        assert r_profile.json()["account_status"] == "pending_approval"

        # Operational dashboard is blocked with 403 pending approval
        r_dash = client.get("/api/warehouse/me/dashboard", headers=headers)
        assert r_dash.status_code == 403
        assert "pending administrative approval" in r_dash.json()["detail"].lower()

    def test_suspended_warehouse_owner_blocked(self, client, db_session):
        user, _ = _make_warehouse_owner(db_session, mobile_suffix="22", is_suspended=True)
        headers = _headers_for(user.id, "warehouse_owner")
        r = client.get("/api/warehouse/me", headers=headers)
        assert r.status_code == 403
        assert "suspended" in r.json()["detail"].lower()

    def test_rejected_warehouse_owner_blocked(self, client, db_session):
        user, _ = _make_warehouse_owner(db_session, mobile_suffix="26", is_active=False)
        headers = _headers_for(user.id, "warehouse_owner")
        r = client.get("/api/warehouse/me", headers=headers)
        assert r.status_code == 403
        assert "deactivated" in r.json()["detail"].lower()

    def test_admin_cannot_access_warehouse_endpoints_via_role_bypass(self, client, db_session):
        admin = User(
            mobile="9800000299",
            password_hash=hash_password("AdminPass123!"),
            role="admin",
            is_active=True,
            is_suspended=False,
            is_verified=True,
        )
        db_session.add(admin)
        db_session.flush()

        admin_headers = {"Authorization": f"Bearer {create_access_token(admin.id, 'admin')[0]}"}

        # Admin cannot call /api/warehouse/me
        r_me = client.get("/api/warehouse/me", headers=admin_headers)
        assert r_me.status_code == 403

        # Admin cannot call /api/warehouse/me/dashboard
        r_dash = client.get("/api/warehouse/me/dashboard", headers=admin_headers)
        assert r_dash.status_code == 403

        # Admin cannot call /api/warehouse/facilities
        r_fac = client.get("/api/warehouse/facilities", headers=admin_headers)
        assert r_fac.status_code == 403

        # Admin cannot call /api/warehouse/bookings
        r_book = client.get("/api/warehouse/bookings", headers=admin_headers)
        assert r_book.status_code == 403


class TestWarehouseOwnerProfileManagement:
    def test_approved_owner_accesses_dashboard(self, client, db_session):
        user, profile = _make_warehouse_owner(db_session, mobile_suffix="23", is_approved=True)
        headers = _headers_for(user.id, "warehouse_owner")

        r = client.get("/api/warehouse/me/dashboard", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["profile"]["is_approved"] is True
        assert data["profile"]["account_status"] == "active"
        assert "schema_limitation_notice" in data

    def test_owner_updates_permitted_profile_info(self, client, db_session):
        user, profile = _make_warehouse_owner(db_session, mobile_suffix="24", is_approved=True)
        headers = _headers_for(user.id, "warehouse_owner")

        payload = {
            "company_name": "New Logistics Corp",
            "gstin": "07AAAAA0000A1Z5",
        }
        r = client.put("/api/warehouse/me", json=payload, headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["company_name"] == "New Logistics Corp"
        assert data["gstin"] == "07AAAAA0000A1Z5"

        db_session.refresh(profile)
        assert profile.company_name == "New Logistics Corp"

    def test_facility_and_booking_endpoints_document_schema_notice(self, client, db_session):
        user, _ = _make_warehouse_owner(db_session, mobile_suffix="25", is_approved=True)
        headers = _headers_for(user.id, "warehouse_owner")

        r_fac = client.get("/api/warehouse/facilities", headers=headers)
        assert r_fac.status_code == 200
        assert "notice" in r_fac.json()
        assert r_fac.json()["total"] == 0

        r_book = client.get("/api/warehouse/bookings", headers=headers)
        assert r_book.status_code == 200
        assert "notice" in r_book.json()
        assert r_book.json()["total"] == 0


class TestWarehouseAccountStatusContract:
    """Prompt 7C/7D — verify the exact account_status contract returned by the API."""

    def test_pending_owner_profile_returns_pending_approval_status(self, client, db_session):
        """GET /api/warehouse/me for a pending owner must return account_status='pending_approval'."""
        user, profile = _make_warehouse_owner(db_session, mobile_suffix="30", is_approved=False)
        headers = _headers_for(user.id, "warehouse_owner")

        r = client.get("/api/warehouse/me", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["is_approved"] is False
        assert data["account_status"] == "pending_approval", (
            f"Expected 'pending_approval', got '{data['account_status']}'. "
            "Frontend checks this exact string value."
        )

    def test_approved_owner_profile_returns_active_status(self, client, db_session):
        """GET /api/warehouse/me for an approved owner must return account_status='active'."""
        user, profile = _make_warehouse_owner(db_session, mobile_suffix="31", is_approved=True)
        headers = _headers_for(user.id, "warehouse_owner")

        r = client.get("/api/warehouse/me", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["is_approved"] is True
        assert data["account_status"] == "active", (
            f"Expected 'active', got '{data['account_status']}'. "
            "Frontend gates operational features on account_status == 'active'."
        )

    def test_account_status_is_not_approval_status(self, client, db_session):
        """Verify the field name is account_status — NOT approval_status (which does not exist)."""
        user, _ = _make_warehouse_owner(db_session, mobile_suffix="32", is_approved=True)
        headers = _headers_for(user.id, "warehouse_owner")

        r = client.get("/api/warehouse/me", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "account_status" in data, "account_status field must be present in GET /api/warehouse/me response"
        assert "approval_status" not in data, (
            "'approval_status' is a non-existent field — frontend must NOT use it"
        )

    def test_pending_owner_can_update_company_profile(self, client, db_session):
        """A pending warehouse owner can still update company_name and gstin."""
        user, profile = _make_warehouse_owner(db_session, mobile_suffix="33", is_approved=False)
        headers = _headers_for(user.id, "warehouse_owner")

        payload = {"company_name": "Updated Pending Corp", "gstin": "07BBBBB0000B1Z5"}
        r = client.put("/api/warehouse/me", json=payload, headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["company_name"] == "Updated Pending Corp"
        assert data["gstin"] == "07BBBBB0000B1Z5"
        # Approval status must not have changed
        assert data["is_approved"] is False
        assert data["account_status"] == "pending_approval"

        db_session.refresh(profile)
        assert profile.company_name == "Updated Pending Corp"

    def test_rejected_inactive_owner_cannot_access_profile(self, client, db_session):
        """A rejected (is_active=False) owner gets 403 on profile access."""
        user, _ = _make_warehouse_owner(db_session, mobile_suffix="34", is_active=False)
        headers = _headers_for(user.id, "warehouse_owner")

        r = client.get("/api/warehouse/me", headers=headers)
        assert r.status_code == 403

