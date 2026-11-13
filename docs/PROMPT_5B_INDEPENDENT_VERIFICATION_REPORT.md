# BhoomiBandhu — Prompt 5B: Independent Frontend Authentication Audit & Verification Report

**Auditor:** Senior Independent React, FastAPI & Application Security Auditor  
**Audit Target:** BhoomiBandhu Frontend Authentication & Role Portal Implementation (Prompt 5)  
**Audit Mode:** STRICTLY READ-ONLY (Zero application files modified during this audit)  
**Final Verdict:** **REQUIRES FIXES**

---

## 1. Executive Summary

This independent audit conducted a thorough, line-by-line inspection of the React frontend authentication subsystem, its contract alignment with FastAPI backend routers and Pydantic schemas, token storage mechanisms, role-based access control, and automated test quality.

### Key Audit Findings
1. **API Contract Alignment:** Highly accurate overall. 12 out of 13 endpoints in [client/src/services/authService.js](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/services/authService.js) strictly match backend schemas, HTTP methods, and status codes.
2. **Confirmed Workflow Defect (CRITICAL):** In [client/src/pages/auth/RegisterPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/RegisterPage.jsx), clicking the "Verify" button pre-verifies the OTP (`is_verified=True` on backend). However, form submission continues to pass `otp_code` in the payload. The backend detects `data.otp_code` and executes `verify_otp_challenge()` a second time. Because the challenge was already verified, the second check fails (`is_verified=False` filter returns None), causing registration to **fail with HTTP 400**.
3. **Role Over-Privilege:** [client/src/App.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/App.jsx) allows `admin` to access `/portal/psychiatrist` and `/portal/warehouse`, violating least privilege and Prompt 5 Phase 3 requirements.
4. **Token Security:** `localStorage` is used per the backend JSON API contract. However, `authService.refreshSession()` lacks concurrent request deduplication, risking accidental trigger of the backend's refresh token reuse detection under parallel requests.
5. **Existing Features:** All 12 legacy farmer feature routes remain intact and functional.

---

## 2. Files Inspected

### Backend
- [backend/app/schemas/auth_schemas.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/schemas/auth_schemas.py)
- [backend/app/routers/auth.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/routers/auth.py)
- [backend/app/services/auth_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/auth_service.py)
- [backend/app/services/user_service.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/user_service.py)
- [backend/app/core/dependencies.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/core/dependencies.py)
- [backend/app/models/auth_models.py](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/models/auth_models.py)

### Frontend
- [client/src/services/authService.js](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/services/authService.js)
- [client/src/context/AuthContext.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/context/AuthContext.jsx)
- [client/src/components/ProtectedRoute.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/components/ProtectedRoute.jsx)
- [client/src/components/RoleProtectedRoute.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/components/RoleProtectedRoute.jsx)
- [client/src/components/Navbar.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/components/Navbar.jsx)
- [client/src/pages/auth/LoginPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/LoginPage.jsx)
- [client/src/pages/auth/RegisterPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/RegisterPage.jsx)
- [client/src/pages/auth/ForgotPasswordPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/ForgotPasswordPage.jsx)
- [client/src/pages/auth/ResetPasswordPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/ResetPasswordPage.jsx)
- [client/src/pages/portals/FarmerDashboardPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/portals/FarmerDashboardPage.jsx)
- [client/src/pages/portals/PsychiatristPortalPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/portals/PsychiatristPortalPage.jsx)
- [client/src/pages/portals/WarehousePortalPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/portals/WarehousePortalPage.jsx)
- [client/src/pages/portals/AdminPortalPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/portals/AdminPortalPage.jsx)
- [client/src/pages/portals/PendingApprovalPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/portals/PendingApprovalPage.jsx)
- [client/src/pages/portals/UnauthorizedPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/portals/UnauthorizedPage.jsx)
- [client/src/App.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/App.jsx)
- [client/src/main.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/main.jsx)
- [client/src/pages/IndexPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/IndexPage.jsx)
- [client/tests/frontend_auth.test.mjs](file:///e:/BhoomiBandhu_React_Express_APIReady/client/tests/frontend_auth.test.mjs)
- [package.json](file:///e:/BhoomiBandhu_React_Express_APIReady/package.json)

---

## 3. Backend API Contract Comparison

| Endpoint | Method | Backend Schema & Status | Frontend Implementation | Match Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/send-otp` | POST | `OtpSendRequest`: `{ mobile, purpose }` -> `MessageResponse` (200, 429) | `authService.sendOtp(mobile, purpose)` | **MATCH** | Normalizes mobile to 10 digits; handles cooldown 429. |
| `/api/auth/resend-otp` | POST | `OtpSendRequest`: `{ mobile, purpose }` -> `MessageResponse` (200, 429) | `authService.resendOtp(mobile, purpose)` | **MATCH** | Enforces 60s cooldown. |
| `/api/auth/verify-otp` | POST | `OtpVerifyRequest`: `{ mobile, otp_code, purpose }` -> `MessageResponse` (200, 400) | `authService.verifyOtp(mobile, otp_code, purpose)` | **MATCH** | Constant-time HMAC match on backend. |
| `/api/auth/register` | POST | `UserRegisterRequest`: `{ mobile, password, name, email?, role, state?, farmer_category?, district?, village?, primary_crop?, otp_code? }` -> `TokenResponse` (201, 400, 403, 500) | `authService.registerFarmer(formData)` | **MATCH** | Backend accepts both pre-verified mobile or `otp_code`. |
| `/api/auth/register/psychiatrist` | POST | `PsychiatristRegisterRequest`: `{ mobile, password, name, email?, license_number, specialization?, otp_code? }` -> `TokenResponse` (201, 400) | `authService.registerPsychiatrist(formData)` | **MATCH** | Requires `license_number`; sets `is_approved=false`. |
| `/api/auth/register/warehouse-owner` | POST | `WarehouseOwnerRegisterRequest`: `{ mobile, password, name, email?, company_name, gstin?, otp_code? }` -> `TokenResponse` (201, 400) | `authService.registerWarehouseOwner(formData)` | **MATCH** | Requires `company_name`; sets `is_approved=false`. |
| `/api/auth/login` | POST | `LoginRequest`: `{ identifier, password }` -> `TokenResponse` (200, 401, 403) | `authService.login(identifier, password)` | **MATCH** | Handles generic 401 and specific 403 status. |
| `/api/auth/refresh` | POST | `RefreshTokenRequest`: `{ refresh_token }` -> `TokenResponse` (200, 401) | `authService.refreshSession()` | **MATCH** | Rotates refresh token pair; clears tokens on 401. |
| `/api/auth/logout` | POST | `RefreshTokenRequest`: `{ refresh_token }` -> `MessageResponse` (200) | `authService.logout()` | **MATCH** | Revokes single refresh token. |
| `/api/auth/logout-all` | POST | Header: `Authorization: Bearer <token>` -> `MessageResponse` (200, 401) | `authService.logoutAll()` | **MATCH** | Revokes all active refresh tokens for user. |
| `/api/auth/forgot-password` | POST | `ForgotPasswordRequest`: `{ mobile }` -> `MessageResponse` (200) | `authService.forgotPassword(mobile)` | **MATCH** | Always returns generic message to prevent enumeration. |
| `/api/auth/reset-password` | POST | `ResetPasswordRequest`: `{ mobile, otp_code, new_password }` -> `MessageResponse` (200, 400, 404, 500) | `authService.resetPassword(mobile, otp_code, new_password)` | **MATCH** | Consumes OTP atomically with password update. |
| `/api/auth/me` | GET | Header: `Authorization: Bearer <token>` -> `UserResponse` (200, 401) | `authService.getCurrentUser()` | **MATCH** | Retrieves profile details and approval status. |

---

## 4. OTP and Registration Workflow Findings

### Confirmed Defect: Double Verification Rejection
- **Location:** [client/src/pages/auth/RegisterPage.jsx:83-101](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/RegisterPage.jsx#L83-L101), lines 148, 165, 182.
- **Trace:**
  1. User enters mobile number and clicks "Send OTP". Backend creates `OtpChallenge` with `is_verified=False`.
  2. User inputs the 6-digit OTP and clicks the "Verify" button (`handleVerifyOtp`).
  3. `authService.verifyOtp()` executes `POST /api/auth/verify-otp`.
  4. Backend marks `challenge.is_verified = True`. UI sets `otpVerified = true` and shows "✓ Mobile verified".
  5. User fills remaining registration fields and clicks "Complete Registration".
  6. In `handleSubmit`, the payload is constructed:
     ```javascript
     otp_code: otpCode.trim() || undefined
     ```
     Because `otpCode` is non-empty, `otp_code` is passed to `POST /api/auth/register`.
  7. In [backend/app/services/user_service.py:46-55](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/user_service.py#L46-L55):
     ```python
     if data.otp_code:
         ok, _ = verify_otp_challenge(data.mobile, data.otp_code, "registration", db)
         verified = ok
     else:
         verified = is_mobile_preverified(data.mobile, "registration", db)
     ```
  8. In [backend/app/services/otp_service.py:156](file:///e:/BhoomiBandhu_React_Express_APIReady/backend/app/services/otp_service.py#L156):
     `verify_otp_challenge` queries:
     `.filter_by(mobile=clean_mobile, purpose=clean_purpose, is_verified=False, is_consumed=False)`
  9. **Failure Point:** Since `is_verified` was already set to `True` in step 4, the query finds **no challenge matching `is_verified=False`**.
  10. `verify_otp_challenge` returns `(False, "No active verification code found. Please request a new one.")`.
  11. `user_service.py` raises `ValueError("Mobile ownership must be verified via OTP before registration.")`.
  12. Registration fails with HTTP 400!

### Why automated tests did not catch this
- `client/tests/frontend_auth.test.mjs` test 4 calls `authService.registerFarmer()` directly without previously calling `authService.verifyOtp()`.
- If `verifyOtp` is **not** clicked in the UI, registration succeeds because `data.otp_code` is verified for the first time by the backend.
- But if the user clicks the explicit "Verify" button provided in the UI, registration fails.

### Required Correction
In [client/src/pages/auth/RegisterPage.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/RegisterPage.jsx), if `otpVerified` is `true`, `otp_code` should be omitted (`undefined`):
```javascript
otp_code: otpVerified ? undefined : (otpCode.trim() || undefined)
```
This allows the backend to take the `else: verified = is_mobile_preverified(...)` branch, which expects `is_verified=True`.

---

## 5. Token Security Findings

### 1. Storage Mechanism & XSS Exposure
- [client/src/services/authService.js:18-47](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/services/authService.js#L18-L47):
  Both `access_token` and `refresh_token` are stored in `window.localStorage`.
- **Honest Risk Assessment:**
  - `localStorage` is vulnerable to token exfiltration if an XSS vulnerability exists on the origin.
  - The Prompt 5 implementation correctly documented this trade-off, noting that the backend currently returns tokens in JSON format rather than setting `HttpOnly`, `Secure` cookies.
  - Raw passwords are never stored in localStorage, sessionStorage, or state.

### 2. Concurrent Refresh Race Condition
- [client/src/services/authService.js:174-195](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/services/authService.js#L174-L195):
  `authService.refreshSession()` does not implement request deduplication (in-flight promise pooling) or a locking mutex.
- **Risk:** If two components or browser tabs call `refreshSession()` concurrently with the same refresh token:
  1. Request A arrives at the backend first, locks the row, rotates the token to `refresh_token_B`, and commits.
  2. Request B arrives with the old `refresh_token_A`.
  3. The backend detects that `token_record.revoked_at is not None`.
  4. Backend triggers **REFRESH TOKEN REUSE DETECTION**, revoking ALL active tokens for the user and logging them out across all devices.

---

## 6. Role and Approval Findings

### 1. Professional Approval Gating — VERIFIED
- [client/src/context/AuthContext.jsx:105-109](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/context/AuthContext.jsx#L105-L109):
  `isApproved` derives directly from `user.profile_details?.is_approved`.
- [client/src/components/RoleProtectedRoute.jsx:32-34](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/components/RoleProtectedRoute.jsx#L32-L34):
  `if (requireApproval && !isApproved) return <Navigate to="/pending-approval" replace />;`.
  Unapproved psychiatrists and warehouse owners are strictly barred from accessing their operational portals.

### 2. Confirmed Issue: Administrator Over-Privilege
- [client/src/App.jsx:49-60](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/App.jsx#L49-L60):
  ```javascript
  <Route
    path="/portal/psychiatrist"
    element={
      <RoleProtectedRoute allowedRoles={['psychiatrist', 'admin']} requireApproval={true}>
        <PsychiatristPortalPage />
      </RoleProtectedRoute>
    }
  />
  <Route
    path="/portal/warehouse"
    element={
      <RoleProtectedRoute allowedRoles={['warehouse_owner', 'admin']} requireApproval={true}>
        <WarehousePortalPage />
      </RoleProtectedRoute>
    }
  />
  ```
- **Violation:** Prompt 5 Phase 3 specifies:
  - *"Psychiatrist accounts should access only their authorized portal."*
  - *"Warehouse owners should access only their authorized portal."*
  - *"Admin accounts should access the administration portal."*
- Permitting `admin` on `/portal/psychiatrist` and `/portal/warehouse` causes errors because an admin account does not possess psychiatrist or warehouse profile details (`profile.license_number` or `profile.company_name` are undefined).
- **Correction:** `/portal/psychiatrist` must have `allowedRoles={['psychiatrist']}`; `/portal/warehouse` must have `allowedRoles={['warehouse_owner']}`.

---

## 7. Routing Findings

1. **Hierarchy Integrity:**
   - [client/src/App.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/App.jsx) cleanly wraps routes inside `BrowserRouter -> AuthProvider -> Routes`.
   - `BrowserRouter` is not duplicated.
2. **Public vs. Protected Boundaries:**
   - Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/unauthorized`, `/pending-approval`.
   - Protected: `/dashboard`, `/portal/psychiatrist`, `/portal/warehouse`, `/portal/admin`.
3. **Location Preservation:**
   - `ProtectedRoute` and `RoleProtectedRoute` pass `state: { from: location }`.
   - `LoginPage.jsx` inspects `location.state?.from?.pathname` and redirects back to the originating page upon successful authentication.
4. **No Redirect Loops:** Verified across all account states.

---

## 8. Test-Quality Classification

Every test in [client/tests/frontend_auth.test.mjs](file:///e:/BhoomiBandhu_React_Express_APIReady/client/tests/frontend_auth.test.mjs) was inspected and classified:

| Test # | Test Title | Classification | Description & Coverage |
| :---: | :--- | :--- | :--- |
| **1** | tokenStorage stores and retrieves tokens | **B. Service-level test** | Tests `tokenStorage` object against in-memory `mockLocalStorageStore`. |
| **2** | Login validation | **C. Mocked API test** | Mocks `fetch` to test error handling (401 invalid, 403 suspended, 403 unverified). |
| **3** | OTP verification flow | **C. Mocked API test** | Mocks `fetch` to verify `/send-otp`, `/resend-otp` (429 cooldown), and `/verify-otp`. |
| **4** | Farmer registration | **C. Mocked API test** | Mocks `fetch` with `UserRegisterRequest` payload. |
| **5** | Psychiatrist registration | **C. Mocked API test** | Mocks `fetch` with `PsychiatristRegisterRequest` payload (`is_approved=false`). |
| **6** | Warehouse-owner registration | **C. Mocked API test** | Mocks `fetch` with `WarehouseOwnerRegisterRequest` payload (`is_approved=false`). |
| **7** | Password recovery flow | **C. Mocked API test** | Mocks `fetch` for `/forgot-password` and `/reset-password`. |
| **8** | Session restoration | **C. Mocked API test** | Mocks `fetch` for `GET /me` with `Authorization` header verification. |
| **9** | Refresh-token rotation | **C. Mocked API test** | Mocks `fetch` for `POST /refresh` and asserts storage wipe on 401. |
| **10** | Logout and Logout-all | **C. Mocked API test** | Mocks `fetch` for `/logout` and `/logout-all`. |
| **11** | Protected-route behavior | **D. Static/source logic test** | Evaluates pure function `isUserAuthenticated(user) => !!user`. Does not mount React component. |
| **12** | Role-based access control | **D. Static/source logic test** | Evaluates pure function `checkRoleAccess(role, allowed)`. Does not mount React component. |
| **13** | Pending professional approval | **D. Static/source logic test** | Evaluates pure function `canAccessProfessionalPortal(user)`. Does not mount React component. |
| **14** | Existing farmer features regression | **D. Static/source inspection test** | Inspects hardcoded string array of route paths. Does not verify DOM or network. |

### Summary of Test Limitations
- **Zero React DOM Component Tests:** Tests run in plain Node.js without `@testing-library/react` or JSDOM. Components like `<LoginPage />` and `<RegisterPage />` are not rendered.
- **Zero Live API Calls:** All network requests mock `global.fetch`. (Complies with safety rules, but cannot be classified as end-to-end integration tests).

---

## 9. Existing Feature Preservation

All 12 pre-existing farmer feature routes remain registered in [client/src/App.jsx](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/App.jsx) and their components/scripts are 100% preserved:
1. `/` -> `IndexPage.jsx`
2. `/storage` -> `StoragePage.jsx`
3. `/insurance` -> `InsurancePage.jsx`
4. `/schemes` -> `SchemesPage.jsx`
5. `/financial` -> `FinancialPage.jsx`
6. `/ml-crop-advisor` -> `MlCropAdvisorPage.jsx`
7. `/gemini-advisor` -> `GeminiAdvisorPage.jsx`
8. `/mental-health` -> `MentalHealthPage.jsx`
9. `/status-tracking` -> `StatusTrackingPage.jsx`
10. `/pmfby-enrollment` -> `PmfbyEnrollmentPage.jsx`
11. `/claim-filing` -> `ClaimFilingPage.jsx`
12. `/risk-awareness` -> `RiskAwarenessPage.jsx`

No legacy JavaScript engines in `client/src/legacy/` were modified.

---

## 10. Critical Issues

### CRIT-01: Registration Fails When User Clicks "Verify" Button
- **File:** [client/src/pages/auth/RegisterPage.jsx:148](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/RegisterPage.jsx#L148), [client/src/pages/auth/RegisterPage.jsx:165](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/RegisterPage.jsx#L165), [client/src/pages/auth/RegisterPage.jsx:182](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/auth/RegisterPage.jsx#L182)
- **Problem:** When a user completes the two-step verification UI by clicking "Verify", `OtpChallenge.is_verified` becomes `True`. On form submit, `RegisterPage.jsx` still sends `otp_code`. The backend re-attempts verification on an already-verified challenge, failing with HTTP 400.
- **Correction:** Omit `otp_code` in registration payloads if `otpVerified === true`.

---

## 11. High-Priority Issues

### HIGH-01: Admin Allowed on Professional Portals
- **File:** [client/src/App.jsx:50](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/App.jsx#L50), [client/src/App.jsx:58](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/App.jsx#L58)
- **Problem:** `allowedRoles={['psychiatrist', 'admin']}` and `allowedRoles={['warehouse_owner', 'admin']}` grant admin access to professional portals, violating strict role segregation.
- **Correction:** Restrict to `allowedRoles={['psychiatrist']}` and `allowedRoles={['warehouse_owner']}` respectively.

### HIGH-02: Missing In-Flight Deduplication for Refresh Token Rotation
- **File:** [client/src/services/authService.js:174-195](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/services/authService.js#L174-L195)
- **Problem:** Concurrent calls to `refreshSession()` send the same refresh token in parallel. The second request is rejected by the backend as a token reuse attack, revoking all active sessions for the user.
- **Correction:** Pool in-flight refresh promises so concurrent callers share a single refresh request.

---

## 12. Medium-Priority Issues

### MED-01: Static Navbars on Secondary Feature Pages
- **File:** [client/src/pages/StoragePage.jsx:18-31](file:///e:/BhoomiBandhu_React_Express_APIReady/client/src/pages/StoragePage.jsx#L18-L31), `MentalHealthPage.jsx`, etc.
- **Problem:** `Navbar.jsx` was only integrated into `IndexPage.jsx`. Secondary pages still contain legacy static headers lacking user session status and logout controls.
- **Correction:** Replace legacy `<nav>` blocks with `<Navbar />` across all feature pages.

### MED-02: Unit Tests Lack Real DOM Component Mounting
- **File:** [client/tests/frontend_auth.test.mjs](file:///e:/BhoomiBandhu_React_Express_APIReady/client/tests/frontend_auth.test.mjs)
- **Problem:** Tests 11–14 only test pure predicate functions rather than rendering React components.
- **Correction:** Introduce component integration tests using React Testing Library or Vitest in future iterations.

---

## 13. Exact Recommended Corrections

### Correction for CRIT-01 (`RegisterPage.jsx`):
In `client/src/pages/auth/RegisterPage.jsx`, lines 148, 165, and 182:
```diff
- otp_code: otpCode.trim() || undefined,
+ otp_code: otpVerified ? undefined : (otpCode.trim() || undefined),
```

### Correction for HIGH-01 (`App.jsx`):
In `client/src/App.jsx`, lines 50 and 58:
```diff
- <RoleProtectedRoute allowedRoles={['psychiatrist', 'admin']} requireApproval={true}>
+ <RoleProtectedRoute allowedRoles={['psychiatrist']} requireApproval={true}>

- <RoleProtectedRoute allowedRoles={['warehouse_owner', 'admin']} requireApproval={true}>
+ <RoleProtectedRoute allowedRoles={['warehouse_owner']} requireApproval={true}>
```

### Correction for HIGH-02 (`authService.js`):
In `client/src/services/authService.js`, introduce a promise cache:
```javascript
let refreshPromise = null;

async refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      // ... existing refresh logic ...
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}
```

---

## 14. Final Verdict

# **REQUIRES FIXES**

### Justification:
While the architecture, build pipeline, routing structure, and backend contract alignment are fundamentally sound, **CRIT-01 is a confirmed functional defect** that breaks user registration whenever a user clicks the "Verify" button as prompted by the UI. Applying the two-line fix in CRIT-01 and the role adjustments in HIGH-01 will make the implementation fully approved.
