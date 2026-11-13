# BHOOMIBANDHU — PROMPT 4A: AUTHENTICATION SECURITY & CODE VERIFICATION REPORT

**Document Reference:** `docs/PROMPT_4A_AUTH_SECURITY_AUDIT.md`  
**Execution Context:** Prompt 4A — Strictly Read-Only Security & Code Verification Audit  
**Date:** November 1, 2026  
**Auditor:** Senior Security Architect & FastAPI Lead Engineer  

---

## 1. EXECUTIVE SUMMARY

An independent, strictly read-only code audit was conducted on the authentication backend implemented in Prompt 4. The audit evaluated security posture, cryptographic controls, database isolation, transactional atomicity, role authorization, and Alembic migration integrity.

### Overall Assessment: **PASS WITH FIXES**

- **Architectural Integrity:** The decoupled identity architecture (`users` &rarr; `farmer_profiles` &rarr; legacy `farmers`) was successfully implemented without modifying any of the 11 legacy domain models or foreign keys.
- **Cryptographic Standards:** Argon2id is properly configured for password hashing (64 MB memory cost, time cost 2, 32-byte hash length). JWT access tokens enforce signature, expiration, subject, and token type validation.
- **Refresh Token Safety:** Refresh tokens are never stored in plaintext (SHA-256 digests only). Token rotation and reuse detection are implemented.
- **Database Safety:** Zero connections were made to PostgreSQL; all automated tests were executed against an isolated, in-memory SQLite database (`sqlite:///:memory:`).
- **Areas Requiring Hardening Prior to Production:**
  1. Transitioning OTP hash to keyed HMAC (`hmac.new`) with a dedicated secret.
  2. Adding fail-closed behavior for `SMS_PROVIDER=mock` in production environments.
  3. Adding an `is_consumed` flag to `OtpChallenge` to prevent replay within the 15-minute verification window.
  4. Adding `with_for_update()` row locking on refresh token rotation to eliminate concurrent race windows.
  5. Enforcing `is_verified` checks in `authenticate_user`.
  6. Scoping the 12 legacy routers to authenticated identities in subsequent prompts.

---

## 2. FILE-BY-FILE AUDIT FINDINGS

### 2.1 [backend/app/models/auth_models.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/models/auth_models.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - `User`: Primary key `id`, unique indexed `mobile` and `email`, Argon2id `password_hash`, `role` constrained by check constraint `chk_user_role` (`'farmer', 'psychiatrist', 'warehouse_owner', 'admin'`). Default boolean flags `is_active=True`, `is_suspended=False`, `is_verified=False`.
  - `FarmerProfile`: Enforces strict 1-to-1 mappings with `unique=True` on both `user_id` (`ondelete="CASCADE"`) and `legacy_farmer_id` (`ondelete="RESTRICT"`). Safeguards legacy farmer rows against cascading deletes.
  - `PsychiatristProfile`: Enforces `unique=True` on `license_number` and default `is_approved=False`.
  - `WarehouseOwnerProfile`: Enforces default `is_approved=False`.
  - `RefreshToken`: Maps `user_id`, indexed unique `token_hash`, `expires_at`, `revoked_at`, and `replaced_by_token_id`.
  - `OtpChallenge`: Captures `mobile`, `otp_hash`, `purpose`, `attempts`, `max_attempts`, `expires_at`, `is_verified`.

### 2.2 [backend/app/schemas/auth_schemas.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/schemas/auth_schemas.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - Validates and normalizes Indian mobile numbers (`10` digits, stripping `+91` or leading `0`).
  - Enforces minimum 8-character password length and complexity (must contain at least one digit or special character). Maximum length capped at 128 characters to mitigate hash DoS.
  - Email addresses are normalized to lowercase.
  - `UserResponse` strips `password_hash` completely.

### 2.3 [backend/app/services/auth_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/auth_service.py)
- **Status:** **VERIFIED WITH OBSERVATIONS**
- **Findings:**
  - Uses `argon2.PasswordHasher(time_cost=2, memory_cost=65536, parallelism=1, hash_len=32)`.
  - Access token generation sets `exp` to 15 minutes, `type: "access"`, and unique `jti`.
  - Refresh tokens generate 64 hex characters prefixed with `rft_`. Only SHA-256 hash is saved to DB.
  - `rotate_refresh_token`: Detects reuse of revoked tokens and revokes all active sessions for that user account.
  - *Observation:* Lacks row-level locking (`with_for_update()`) on PostgreSQL during token lookup, creating a potential concurrency race condition if two requests hit `/refresh` simultaneously.

### 2.4 [backend/app/services/otp_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/otp_service.py)
- **Status:** **REQUIRES HARDENING**
- **Findings:**
  - Generates 6-digit integers using `secrets.randbelow(900000) + 100000`.
  - Enforces 60-second resend cooldown and 3-attempt limit.
  - Challenges expire after 5 minutes.
  - *Vulnerability 1:* Uses `hashlib.sha256(f"{mobile}:{otp_code}:{salt}")` instead of standard keyed `hmac.new()`.
  - *Vulnerability 2:* `MockOtpProvider` is instantiated by default without checking whether `ENVIRONMENT == "production"`.
  - *Vulnerability 3:* Once `is_verified` is set to `True`, `is_mobile_preverified` allows consumption for up to 15 minutes without marking the record as consumed (`is_consumed=True`).

### 2.5 [backend/app/services/user_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/user_service.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - Atomic transactions with explicit `db.commit()` and `db.rollback()` on exception.
  - Scenario A: Correctly identifies existing legacy farmer, verifies OTP, and links `FarmerProfile` without modifying the `farmers` row.
  - Scenario B: Atomically creates `User`, `Farmer`, and `FarmerProfile`. Rollback tested and verified.
  - `authenticate_user`: Enforces `is_suspended` and `is_active` rejection.
  - *Observation:* Does not check `is_verified` during login.

### 2.6 [backend/app/core/dependencies.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/core/dependencies.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - `get_current_user`: Decodes token, asserts `type == "access"`, resolves user, rejects inactive or suspended accounts.
  - `require_roles`: Restricts access by role; raises `403 Forbidden` on mismatch.
  - `require_approved_professional`: Rejects unapproved psychiatrists and warehouse owners with `403 Forbidden`.
  - `get_current_farmer_id`: Resolves `legacy_farmer_id` for authenticated farmers only.

### 2.7 [backend/app/routers/auth.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/routers/auth.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - Explicitly rejects public registration attempts with `role="admin"` with `403 Forbidden`.
  - Forgot password endpoint returns constant generic message to prevent account enumeration.
  - Login returns generic error on credential mismatch.
  - Exposes 10 typed endpoints.

### 2.8 [backend/app/core/config.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/core/config.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - Reads JWT and OTP variables with safe defaults.
  - Preserves all database and third-party API configurations intact.

### 2.9 [backend/main.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/main.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - Includes `auth.router`.
  - Preserves all 12 legacy routers in exact registered order.

### 2.10 [backend/alembic/versions/001_create_auth_tables.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/alembic/versions/001_create_auth_tables.py)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - Creates exactly 6 tables: `users`, `farmer_profiles`, `psychiatrist_profiles`, `warehouse_owner_profiles`, `refresh_tokens`, `otp_challenges`.
  - Foreign key to `farmers.farmer_id` uses `RESTRICT`.
  - Downgrade drops only the 6 tables in reverse dependency order.
  - Migration remains unexecuted.

### 2.11 [backend/tests/](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/tests)
- **Status:** **VERIFIED SECURE**
- **Findings:**
  - Uses `sqlite:///:memory:`. Zero calls to PostgreSQL.
  - All 18 automated tests pass.

---

## 3. CLASSIFICATION OF ISSUES

| ID | Issue Description | File / Location | Severity | Recommended Fix |
|---|---|---|---|---|
| SEC-01 | **OTP hashing uses salted SHA-256 instead of keyed HMAC** | [backend/app/services/otp_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/otp_service.py#L50-L55) | **MEDIUM** | Replace `hashlib.sha256` with `hmac.new(key, msg, hashlib.sha256).hexdigest()` using a dedicated `OTP_HMAC_SECRET` key. |
| SEC-02 | **Mock OTP provider active by default without production environment check** | [backend/app/services/otp_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/otp_service.py#L38) | **MEDIUM** | Add a check: if `SMS_PROVIDER == "mock"` in production, fail closed with `RuntimeError` rather than silently buffering OTPs. |
| SEC-03 | **OTP pre-verification lacks single-use / consumption invalidation** | [backend/app/services/otp_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/otp_service.py#L151-L170) | **MEDIUM** | Add `is_consumed = Column(Boolean, default=False)` to `OtpChallenge`. Mark `is_consumed = True` immediately upon successful registration or reset. |
| SEC-04 | **Potential concurrency race condition on refresh token rotation** | [backend/app/services/auth_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/auth_service.py#L89) | **LOW** | Add `.with_for_update()` to the `RefreshToken` lookup query to serialize concurrent rotation requests at the database engine level. |
| SEC-05 | **Unverified user status not enforced during login** | [backend/app/services/user_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/user_service.py#L236-L251) | **LOW** | In `authenticate_user()`, add `if not user.is_verified: raise PermissionError("Account mobile number is not verified.")`. |
| SEC-06 | **12 legacy feature routers operate anonymously on raw query parameters** | [backend/app/routers/](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/routers) (`insurance.py`, `storage.py`, etc.) | **HIGH** *(Known Scope)* | Planned for Prompt 5/6: inject `get_current_user` and `get_current_farmer_id` into all domain endpoints. |

---

## 4. OTP SECURITY AUDIT

1. **Random Generation:** Verified. Uses `secrets.randbelow(900000) + 100000` (Python's OS-backed CSPRNG).
2. **Keyed HMAC:** Currently uses salted SHA-256 (`mobile:code:JWT_SECRET_KEY`). While salting prevents generic rainbow table attacks, standard `hmac.new` is formally required for cryptographic compliance.
3. **Server-side Expiry:** Verified. Checked against `challenge.expires_at` using UTC timestamps.
4. **Attempt Limits:** Verified. Increments `attempts` on failure; blocks further validation once `attempts >= max_attempts` (default 3).
5. **Resend Cooldown:** Verified. Compares `created_at` of recent challenge against `OTP_RESEND_COOLDOWN_SECONDS` (60s).
6. **Single-Use Replay Protection:** When submitted via `verify_otp_challenge`, it sets `is_verified = True`. However, `is_mobile_preverified` permits re-reading this verified state within a 15-minute window without marking it consumed.
7. **Purpose Binding:** Verified. Challenges store `purpose` (`"registration"`, `"reset_password"`). Verification strictly filters by `purpose`.
8. **Exposure in Responses/Logs:** Verified. No logging statements print the OTP code. API responses return generic confirmation messages.

---

## 5. REGISTRATION & TRANSACTION AUDIT

- **Scenario A (Existing Farmer):**
  - Mobile match found in `farmers`.
  - Checks if `FarmerProfile` already exists for `legacy_farmer_id`.
  - Creates `User` and `FarmerProfile` in a single atomic transaction.
  - Zero modifications to the `farmers` table. Historical foreign keys in domain tables remain valid.
- **Scenario B (New Farmer):**
  - Legacy farmer not found.
  - Creates `User`, new legacy `Farmer`, and `FarmerProfile` within a single `try / except` block with `db.rollback()`.
- **Integrity Constraints:**
  - `FarmerProfile.user_id` has a unique constraint.
  - `FarmerProfile.legacy_farmer_id` has a unique constraint.
  - `User.mobile` and `User.email` are unique.
  - Duplicate registration raises `ValueError` before database write.

---

## 6. JWT & REFRESH TOKEN AUDIT

- **Argon2id:** Verified. Uses official `argon2-cffi` implementation.
- **Token Segregation:** Access tokens have `type: "access"`. Refresh tokens have `type: "refresh"`. Calling `decode_access_token` on a refresh token fails verification because `type != "access"`.
- **Storage:** Only SHA-256 hashes are persisted in `refresh_tokens.token_hash`.
- **Rotation:** Verified. Old token is marked `revoked_at = now` and linked via `replaced_by_token_id`.
- **Reuse Detection:** Verified. If a token with `revoked_at is not None` is presented, all refresh tokens for that user are revoked immediately.
- **Suspended Users:** Inactive or suspended users cannot refresh tokens or access endpoints.

---

## 7. AUTHORIZATION AUDIT

- **`get_current_user`:** Validates Bearer token signature, expiration, and user active status.
- **`require_roles`:** Enforces role membership.
- **`require_approved_professional`:** Verified. Psychiatrists and warehouse owners with `is_approved == False` are rejected with `403 Forbidden`.
- **`get_current_farmer_id`:** Resolves `legacy_farmer_id` strictly from `current_user.farmer_profile`.
- **Admin Isolation:** Public registration as admin is rejected with `403 Forbidden`.
- **Legacy Routers Vulnerability:** As noted in Prompt 3A, existing routers ([insurance.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/routers/insurance.py#L94), [storage.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/routers/storage.py#L172)) accept unauthenticated `?mobile=...` query parameters. These must be wired to `get_current_farmer_id` in subsequent prompts.

---

## 8. ALEMBIC MIGRATION AUDIT

- **Table Count:** Exactly 6 tables created: `users`, `farmer_profiles`, `psychiatrist_profiles`, `warehouse_owner_profiles`, `refresh_tokens`, `otp_challenges`.
- **Legacy Table Preservation:** Zero `alter_table` or `drop_table` calls on the 11 legacy tables.
- **Foreign Keys:**
  - `farmer_profiles.user_id` &rarr; `users.id` (`ondelete="CASCADE"`)
  - `farmer_profiles.legacy_farmer_id` &rarr; `farmers.farmer_id` (`ondelete="RESTRICT"`)
  - `refresh_tokens.user_id` &rarr; `users.id` (`ondelete="CASCADE"`)
- **Downgrade:** Drops only the 6 authentication tables in correct reverse dependency order.
- **Execution Status:** **UNEXECUTED**. Complies with safety rules.

---

## 9. TEST COVERAGE MATRIX

All 18 automated tests in `backend/tests/` passed:

| Test Name | File | Verified Security Property | Status |
|---|---|---|---|
| `test_password_hashing_and_verification` | `test_auth.py` | Argon2id salt generation and constant-time match/mismatch | **PASS** |
| `test_login_flow` | `test_auth.py` | Mobile & email login; invalid password & identifier rejection | **PASS** |
| `test_jwt_validation_and_expiry` | `test_auth.py` | Expiration check, signature validation, tampering rejection | **PASS** |
| `test_token_type_segregation` | `test_auth.py` | Access token vs refresh token separation | **PASS** |
| `test_refresh_token_rotation` | `test_auth.py` | Single-use rotation and replacement tracking | **PASS** |
| `test_refresh_token_reuse_detection` | `test_auth.py` | Compromised session invalidation on token reuse | **PASS** |
| `test_logout_and_revocation` | `test_auth.py` | Single token revocation and logout-all revocation | **PASS** |
| `test_otp_expiry_and_attempt_limits` | `test_auth.py` | Attempt exhaustion and failure message tracking | **PASS** |
| `test_existing_farmer_otp_linking` | `test_auth.py` | Scenario A: Verified OTP links legacy farmer without data loss | **PASS** |
| `test_new_farmer_registration_rollback` | `test_auth.py` | Scenario B: Unverified OTP rolls back atomic transaction | **PASS** |
| `test_duplicate_mobile_and_email` | `test_auth.py` | Duplicate rejection on unique constraint fields | **PASS** |
| `test_role_authorization` | `test_auth.py` | Role checking and 403 Forbidden enforcement | **PASS** |
| `test_professional_approval_checks` | `test_auth.py` | Pending approval blocks access until approved | **PASS** |
| `test_suspended_and_inactive_accounts` | `test_auth.py` | Suspended and deactivated accounts blocked from authentication | **PASS** |
| `test_cross_farmer_access_denial` | `test_auth.py` | Identity isolation prevents cross-role/tenant data leaks | **PASS** |
| `test_api_otp_and_farmer_registration` | `test_api_auth.py` | End-to-end HTTP registration, `/me`, refresh, logout | **PASS** |
| `test_api_admin_registration_rejected` | `test_api_auth.py` | Public admin registration blocked over HTTP | **PASS** |
| `test_api_login_bad_credentials` | `test_api_auth.py` | Generic 401 on bad credentials over HTTP | **PASS** |

---

## 10. EXACT RECOMMENDED FIXES (FOR NEXT PHASE)

1. **HMAC OTP Storage:** In `backend/app/services/otp_service.py`, replace `_hash_otp` with:
   ```python
   import hmac
   def _hash_otp(mobile: str, otp_code: str) -> str:
       key = config.JWT_SECRET_KEY.encode("utf-8")
       msg = f"{mobile}:{otp_code}".encode("utf-8")
       return hmac.new(key, msg, hashlib.sha256).hexdigest()
   ```
2. **OTP Challenge Invalidation:** Add `is_consumed: bool = False` to `OtpChallenge`. In `register_farmer()`, mark the challenge `is_consumed = True` upon successful account creation.
3. **Production Mock Guard:** In `backend/app/services/otp_service.py`:
   ```python
   if config.SMS_PROVIDER == "mock" and os.getenv("ENVIRONMENT") == "production":
       raise RuntimeError("MockOtpProvider is strictly prohibited in production!")
   ```
4. **Row Locking on Refresh:** In `backend/app/services/auth_service.py`:
   ```python
   token_record = db.query(RefreshToken).filter_by(token_hash=old_hash).with_for_update().first()
   ```

---

## 11. FINAL DECISION

### **PASS WITH FIXES**

The Prompt 4 implementation is **architecturally sound, mathematically robust in its password and token handling, and strictly adheres to database isolation constraints**. The recommended fixes represent defense-in-depth hardening to be incorporated alongside the router protection workflows in Prompt 5.

---

### VERIFICATION CONFIRMATIONS

- [x] **No project files were modified, created (except this audit report), or deleted.**
- [x] **No packages were installed or uninstalled during this audit.**
- [x] **No connection was made to PostgreSQL.**
- [x] **No migrations or database initialization scripts were executed.**
- [x] **No credentials, secrets, or `.env` files were modified or exposed.**
- [x] **Zero changes were made to existing database records.**
- [x] **All tests executed in SQLite in-memory isolation.**
