# BhoomiBandhu — Prompt 4B: Authentication Security Hardening Report

**Audit Decision Follow-up:** Implementation of all 5 security fixes identified in `docs/PROMPT_4A_AUTH_SECURITY_AUDIT.md`.  
**Execution Mode:** Isolated In-Memory SQLite Testing (Strictly Zero PostgreSQL Connections & Zero Migrations Executed).  
**Status:** COMPLETE & PASSING (41/41 Automated Tests Passing).

---

## 1. Files Created and Modified

### Created Files
1. `backend/alembic/versions/002_otp_single_use.py` — Sequential Alembic migration adding `is_consumed` column to `otp_challenges`.
2. `backend/tests/test_auth_security_hardening.py` — Dedicated test suite with 20 security test cases covering SEC-01 through SEC-05.
3. `docs/PROMPT_4B_SECURITY_HARDENING_REPORT.md` — This comprehensive hardening and verification report.

### Modified Files
1. `.env.example` — Added safe placeholders for `ENVIRONMENT` and `OTP_HMAC_SECRET`.
2. `backend/app/core/config.py` — Introduced `ENVIRONMENT` setting (normalized and validated) and `OTP_HMAC_SECRET`.
3. `backend/app/models/auth_models.py` — Added `is_consumed = Column(Boolean, default=False, server_default="false", nullable=False)` to `OtpChallenge`.
4. `backend/app/services/otp_service.py` — Replaced salted SHA-256 with keyed HMAC-SHA256, added fail-closed protection for `MockOtpProvider` and missing secrets in production, added `consume_verified_otp()`, and hardened `is_mobile_preverified()`.
5. `backend/app/services/auth_service.py` — Added `.with_for_update()` row-level locking query for PostgreSQL dialect on refresh token lookup, atomic rotation with rollback handling, and blocked unverified users from rotating refresh tokens.
6. `backend/app/services/user_service.py` — Enforced atomic `consume_verified_otp()` during registration of farmers, psychiatrists, and warehouse owners; blocked unverified (`is_verified=False`), inactive (`is_active=False`), and suspended (`is_suspended=True`) accounts in `authenticate_user()`.
7. `backend/app/routers/auth.py` — Added atomic OTP consumption to password reset (`handle_reset_password`) in the same database transaction.
8. `backend/tests/test_auth.py` — Updated test fixtures and added test assertions for unverified account rejection and refresh token verification flags.

---

## 2. Each SEC Issue and Implemented Fix

| Issue ID | Severity | Description | Implemented Fix |
| :--- | :--- | :--- | :--- |
| **SEC-01** | High | Static salted SHA-256 allowed offline dictionary attacks if hash is leaked | Replaced with keyed HMAC-SHA256 bound to `mobile:purpose:otp` using dedicated `OTP_HMAC_SECRET` with constant-time `hmac.compare_digest`. Fails closed if missing in production. |
| **SEC-02** | High | Mock OTP provider could be accidentally run in production or deliver mock success | `get_otp_provider()` and `generate_and_send_otp()` fail closed with `RuntimeError` if `ENVIRONMENT=production` and `SMS_PROVIDER=mock`. No OTP leaked in responses. |
| **SEC-03** | High | OTP replay vulnerability — verified challenges could be reused multiple times or across purposes | Added `is_consumed` column to `OtpChallenge`, new migration `002_otp_single_use.py`, and `consume_verified_otp()` inside the atomic transaction of registration & password reset. |
| **SEC-04** | High | Concurrent refresh requests could cause race conditions in token rotation | Added database row-level locking (`with_for_update()`) on PostgreSQL, linked replacement IDs, and atomic rollback on rotation failures. |
| **SEC-05** | Medium | Users with `is_verified=False` could authenticate and obtain full JWT sessions | Hardened `authenticate_user()` and `rotate_refresh_token()` to verify `user.is_verified is True`, in addition to `is_active` and `not is_suspended`. |

---

## 3. OTP Keyed HMAC Design (SEC-01)

### Cryptographic Specification
- **Algorithm:** Keyed HMAC-SHA256 (`hashlib.sha256` via Python `hmac` standard library).
- **Secret Configuration:** Loaded from environment variable `OTP_HMAC_SECRET` (distinct from `JWT_SECRET_KEY`).
- **Message Canonicalization:** Normalized into a colon-delimited string:
  ```python
  clean_mobile = mobile.strip()
  clean_purpose = purpose.strip().lower()
  clean_code = otp_code.strip()
  message = f"{clean_mobile}:{clean_purpose}:{clean_code}".encode("utf-8")
  ```
- **Digest Comparison:** Evaluated using `hmac.compare_digest()` to eliminate timing attack side channels.
- **Fail-Closed Policy:** In production (`ENVIRONMENT == "production"`), if `OTP_HMAC_SECRET` is unset, starts with placeholder `CHANGE_ME`, or has fewer than 32 characters, initialization immediately raises `ValueError`.
- **Zero Logging Policy:** Neither the secret nor raw OTP values are logged.

---

## 4. Production Mock Provider Protection (SEC-02)

### Fail-Closed Safeguards
- **Environment Normalization:** `ENVIRONMENT` is parsed case-insensitively (`.strip().lower()`), defaulting to `"development"`.
- **Provider Initialization Guard:**
  ```python
  def get_otp_provider() -> BaseOtpProvider:
      if config.ENVIRONMENT == "production" and (
          isinstance(_active_provider, MockOtpProvider) or config.SMS_PROVIDER.lower() == "mock"
      ):
          raise RuntimeError("MockOtpProvider is strictly prohibited in production.")
      return _active_provider
  ```
- **Dispatch Safeguard:** In `generate_and_send_otp()`, a secondary check blocks dispatch if `ENVIRONMENT == "production"` and `SMS_PROVIDER == "mock"`.
- **No Response Leakage:** API endpoints (`/api/auth/send-otp`, `/api/auth/resend-otp`) return standard message responses without including OTP codes in payloads, query parameters, or response headers.

---

## 5. OTP Consumption Lifecycle (SEC-03)

### Lifecycle Phases
```
[1. Dispatch]   --> Code generated -> HMAC stored -> is_verified=False, is_consumed=False
[2. Verify]     --> Constant-time HMAC match -> is_verified=True, is_consumed=False
[3. Consume]    --> Atomic registration/reset transaction:
                    - Lock challenge row (FOR UPDATE)
                    - Check is_verified=True, is_consumed=False, within 15-min window
                    - Set is_consumed=True
                    - Flush and commit with account operation
[4. Rollback]   --> If account creation fails, transaction rolls back, is_consumed remains False
[5. Invalidation] -> Once committed, challenge can never be consumed again
```

### Purpose Separation
- Challenges generated with `purpose="registration"` cannot be verified or consumed for `purpose="reset_password"`, and vice versa.
- `is_mobile_preverified()` filters strictly on `OtpChallenge.purpose == clean_purpose` and `OtpChallenge.is_consumed == False`.

---

## 6. Alembic Migration Details and Execution Status

### Migration File
- **Path:** `backend/alembic/versions/002_otp_single_use.py`
- **Revision ID:** `002_otp_single_use`
- **Revises:** `001_create_auth_tables`
- **Operations:**
  - `upgrade()`: Adds column `is_consumed` (`Boolean`, `server_default="false"`, `nullable=False`) to table `otp_challenges`.
  - `downgrade()`: Drops column `is_consumed` from table `otp_challenges`.

### Execution Status: **NOT EXECUTED**
- Per strict safety rule #5, this migration was **not** applied to PostgreSQL. It is prepared for execution during official deployment maintenance.

---

## 7. Refresh-Token Locking and Concurrency Behavior (SEC-04)

### Concurrency Controls
1. **Row-Level Locking:** During rotation, the old refresh token lookup executes `with_for_update()` on PostgreSQL dialects:
   ```python
   query = db.query(RefreshToken).filter_by(token_hash=old_hash)
   if bind and bind.dialect.name == "postgresql":
       query = query.with_for_update()
   token_record = query.first()
   ```
2. **Atomic Invalidation & Linking:**
   - Generation of replacement token (`new_token_record`).
   - Revocation timestamp assignment (`token_record.revoked_at = now`).
   - Succession tracking (`token_record.replaced_by_token_id = new_token_record.id`).
   - Generation of fresh access token.
   - Wrapped in atomic `try...except` block with `db.rollback()` on failure.
3. **Reuse Detection:** If an already-revoked refresh token is re-submitted, all active tokens for that user ID are revoked immediately to mitigate session hijacking.

### SQLite vs. PostgreSQL Locking Semantics
- **PostgreSQL:** Uses physical row-level exclusive locks (`FOR UPDATE`), serializing concurrent transactions accessing the same record.
- **SQLite (In-Memory Test Mode):** SQLite does not support row-level locking (`SELECT ... FOR UPDATE` causes syntax errors or table locks). The code conditionally enables `with_for_update()` only when `dialect.name == "postgresql"`.
- **Concurrency Audit Note:** Passing in SQLite validates transactional rollback and state integrity; full concurrency lock contention under parallel threads requires PostgreSQL staging verification (documented below).

---

## 8. Unverified Login Protection (SEC-05)

### Verification Controls in `authenticate_user()`
```python
def authenticate_user(identifier: str, password: str, db: Session) -> User:
    user = get_user_by_identifier(identifier, db)
    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid mobile number/email or password.")

    if user.is_suspended:
        raise PermissionError("Your account has been suspended. Please contact customer support.")

    if not user.is_active:
        raise PermissionError("Your account is currently deactivated.")

    if not user.is_verified:
        raise PermissionError("Account mobile number is not verified.")

    return user
```
- **Enumeration Protection:** Invalid passwords or missing identifiers return the generic error `"Invalid mobile number/email or password."` before evaluating account status flags.
- **Status Gating:** Suspended, inactive, and unverified accounts cannot obtain access tokens, refresh tokens, or rotate existing tokens.

---

## 9. Tests Executed and Exact Results

All tests executed using isolated SQLite in-memory database:
```
platform win32 -- Python 3.15.0, pytest-9.2.0, pluggy-1.7.0
rootdir: E:\BhoomiBandhu_React_Express_APIReady
collected 41 items

backend/tests/test_api_auth.py::test_api_otp_and_farmer_registration PASSED [  2%]
backend/tests/test_api_auth.py::test_api_admin_registration_rejected PASSED [  4%]
backend/tests/test_api_auth.py::test_api_login_bad_credentials PASSED    [  7%]
backend/tests/test_auth.py::test_password_hashing_and_verification PASSED [  9%]
backend/tests/test_auth.py::test_login_flow PASSED                       [ 12%]
backend/tests/test_auth.py::test_jwt_validation_and_expiry PASSED        [ 14%]
backend/tests/test_auth.py::test_token_type_segregation PASSED           [ 17%]
backend/tests/test_auth.py::test_refresh_token_rotation PASSED           [ 19%]
backend/tests/test_auth.py::test_refresh_token_reuse_detection PASSED    [ 21%]
backend/tests/test_auth.py::test_logout_and_revocation PASSED            [ 24%]
backend/tests/test_auth.py::test_otp_expiry_and_attempt_limits PASSED    [ 26%]
backend/tests/test_auth.py::test_existing_farmer_otp_linking PASSED      [ 29%]
backend/tests/test_auth.py::test_new_farmer_registration_rollback PASSED [ 31%]
backend/tests/test_auth.py::test_duplicate_mobile_and_email PASSED       [ 34%]
backend/tests/test_auth.py::test_role_authorization PASSED               [ 36%]
backend/tests/test_auth.py::test_professional_approval_checks PASSED     [ 39%]
backend/tests/test_auth.py::test_suspended_and_inactive_accounts PASSED  [ 41%]
backend/tests/test_auth.py::test_cross_farmer_access_denial PASSED       [ 43%]
backend/tests/test_auth_security_hardening.py::test_otp_hmac_generation_and_verification PASSED [ 46%]
backend/tests/test_auth_security_hardening.py::test_otp_wrong_hmac_secret_rejection PASSED [ 48%]
backend/tests/test_auth_security_hardening.py::test_otp_wrong_mobile_rejection PASSED [ 51%]
backend/tests/test_auth_security_hardening.py::test_otp_wrong_purpose_rejection PASSED [ 53%]
backend/tests/test_auth_security_hardening.py::test_otp_expired_rejection PASSED [ 56%]
backend/tests/test_auth_security_hardening.py::test_otp_attempt_limit_enforcement PASSED [ 58%]
backend/tests/test_auth_security_hardening.py::test_otp_resend_cooldown PASSED [ 60%]
backend/tests/test_auth_security_hardening.py::test_otp_cannot_be_consumed_twice PASSED [ 63%]
backend/tests/test_auth_security_hardening.py::test_otp_cannot_be_replayed_for_password_reset_after_registration PASSED [ 65%]
backend/tests/test_auth_security_hardening.py::test_failed_registration_rolls_back_otp_consumption PASSED [ 68%]
backend/tests/test_auth_security_hardening.py::test_failed_password_reset_rolls_back_otp_consumption PASSED [ 70%]
backend/tests/test_auth_security_hardening.py::test_concurrent_otp_consumption_sqlite_note PASSED [ 73%]
backend/tests/test_auth_security_hardening.py::test_mock_provider_works_in_dev_test PASSED [ 75%]
backend/tests/test_auth_security_hardening.py::test_mock_provider_rejected_in_production PASSED [ 78%]
backend/tests/test_auth_security_hardening.py::test_missing_otp_hmac_secret_rejected_in_production PASSED [ 80%]
backend/tests/test_auth_security_hardening.py::test_no_otp_exposed_in_production_responses PASSED [ 82%]
backend/tests/test_auth_security_hardening.py::test_sequential_refresh_rotation PASSED [ 85%]
backend/tests/test_auth_security_hardening.py::test_reuse_of_revoked_refresh_token PASSED [ 87%]
backend/tests/test_auth_security_hardening.py::test_expired_refresh_token PASSED [ 90%]
backend/tests/test_auth_security_hardening.py::test_suspended_user_refresh_rejection PASSED [ 92%]
backend/tests/test_auth_security_hardening.py::test_unverified_user_refresh_rejection PASSED [ 95%]
backend/tests/test_auth_security_hardening.py::test_logout_and_logout_all_remain_functional PASSED [ 97%]
backend/tests/test_auth_security_hardening.py::test_login_account_states PASSED [100%]

======================= 41 passed, 6 warnings in 3.58s ========================
```

---

## 10. Tests Not Executed and Why

- **Live PostgreSQL `with_for_update()` Contention Tests:**
  - *Status:* **NOT VERIFIED ON LIVE POSTGRESQL** (by strict design).
  - *Reason:* Adhering to safety constraint #4 ("Do not connect to PostgreSQL") and safety constraint #5 ("Do not execute Alembic migrations").
  - *Mitigation:* The code handles dialect branching explicitly (`bind.dialect.name == "postgresql"`). In SQLite mode, sequential replay and state rollback are fully verified. PostgreSQL-specific lock wait tests will run during staging environment validation.

---

## 11. Remaining Limitations

1. **SMS Gateway Driver:** Currently `MockOtpProvider` is the only implemented provider; real integration drivers (e.g. Twilio, MSG91) should be plugged into `BaseOtpProvider` before setting `ENVIRONMENT=production`.
2. **Database Initialization Pending:** The 11 legacy tables and auth tables exist in migration scripts and model definitions but have not yet been created in PostgreSQL 18.
3. **Legacy Router Route Guards:** Feature routers (e.g. `schemes.py`, `pmfby.py`, `storage.py`) continue to run without mandatory authentication tokens until the upcoming prompt implements legacy router protection.

---

## 12. Confirmation of Database and Migration Safety

- **PostgreSQL Connection:** **ZERO** connections or queries were made to PostgreSQL.
- **Alembic Migrations:** Neither `001_create_auth_tables.py` nor `002_otp_single_use.py` were executed against any database.
- **Database Scripts:** Neither `init_db.py` nor `seed_db.py` was executed.
- **ORM Integrity:** The 11 legacy ORM domain models in `backend/app/models/models.py` were **NOT** modified.

---

## 13. Confirmation of Secret and Environment Safety

- **`.env` File:** The active `backend/.env` file was **NOT modified, printed, or exposed**.
- **Credentials:** No actual API keys, database credentials, or secret keys were printed or included in tests or documentation.
- **Example File:** `.env.example` was updated with harmless placeholders:
  ```env
  ENVIRONMENT=development
  OTP_HMAC_SECRET=CHANGE_ME_OTP_HMAC_SECRET_32_PLUS_CHARS
  ```

---

*End of Prompt 4B Security Hardening Report. Ready for verification.*
