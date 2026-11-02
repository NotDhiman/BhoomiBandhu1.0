import pytest


def test_api_otp_and_farmer_registration(client, mock_otp):
    mobile = "9812345678"
    # 1. Send OTP
    resp = client.post("/api/auth/send-otp", json={"mobile": mobile, "purpose": "registration"})
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    otp_code = mock_otp.dispatched_otps[mobile]

    # 2. Register Farmer
    reg_payload = {
        "mobile": mobile,
        "password": "Password123!",
        "name": "Ramesh Kumar",
        "role": "farmer",
        "state": "Haryana",
        "otp_code": otp_code,
    }
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["mobile"] == mobile
    assert data["user"]["role"] == "farmer"

    access_token = data["access_token"]
    refresh_token = data["refresh_token"]

    # 3. GET /me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["mobile"] == mobile
    assert me_resp.json()["role"] == "farmer"

    # 4. Refresh token
    ref_resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_resp.status_code == 200
    new_tokens = ref_resp.json()
    assert "access_token" in new_tokens
    assert new_tokens["refresh_token"] != refresh_token

    # 5. Logout
    logout_resp = client.post("/api/auth/logout", json={"refresh_token": new_tokens["refresh_token"]})
    assert logout_resp.status_code == 200


def test_api_admin_registration_rejected(client):
    resp = client.post("/api/auth/register", json={
        "mobile": "9812345679",
        "password": "Password123!",
        "name": "Malicious Admin",
        "role": "admin",
    })
    assert resp.status_code == 403
    assert "prohibited" in resp.json()["detail"].lower()


def test_api_login_bad_credentials(client):
    resp = client.post("/api/auth/login", json={
        "identifier": "9999999999",
        "password": "WrongPassword123!",
    })
    assert resp.status_code == 401
