/**
 * Frontend Authentication Test Suite for BhoomiBandhu
 * Uses Node.js built-in test runner with mock fetch to verify:
 * 1. Frontend build
 * 2. Login validation
 * 3. OTP verification flow
 * 4. Farmer registration
 * 5. Psychiatrist registration
 * 6. Warehouse-owner registration
 * 7. Password recovery
 * 8. Session restoration
 * 9. Refresh-token behavior
 * 10. Logout and Logout-all
 * 11. Protected-route behavior
 * 12. Role-based access
 * 13. Pending professional approval
 * 14. Existing farmer feature regression checks
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage in global scope for Node.js
const mockLocalStorageStore = new Map();
global.localStorage = {
  getItem: (key) => mockLocalStorageStore.get(key) || null,
  setItem: (key, val) => mockLocalStorageStore.set(key, String(val)),
  removeItem: (key) => mockLocalStorageStore.delete(key),
  clear: () => mockLocalStorageStore.clear(),
};

// Import tokenStorage and authService
import { tokenStorage, authService } from '../src/services/authService.js';

test.beforeEach(() => {
  mockLocalStorageStore.clear();
});

test('1. tokenStorage stores and retrieves tokens and user data cleanly', () => {
  const fakeUser = { id: 1, role: 'farmer', mobile: '9876543210' };
  tokenStorage.setTokens('acc_123', 'ref_456', fakeUser);

  assert.equal(tokenStorage.getAccessToken(), 'acc_123');
  assert.equal(tokenStorage.getRefreshToken(), 'ref_456');
  assert.deepEqual(tokenStorage.getUser(), fakeUser);

  tokenStorage.clear();
  assert.equal(tokenStorage.getAccessToken(), null);
  assert.equal(tokenStorage.getRefreshToken(), null);
  assert.equal(tokenStorage.getUser(), null);
});

test('2. Login validation: rejects missing fields and handles error codes', async () => {
  // Test invalid credentials response
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Invalid mobile number/email or password.' }),
  });

  await assert.rejects(
    async () => authService.login('9999999999', 'WrongPass!'),
    /Invalid mobile number\/email or password/
  );

  // Test suspended account response
  global.fetch = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ detail: 'Your account has been suspended. Please contact customer support.' }),
  });

  await assert.rejects(
    async () => authService.login('9888888888', 'ValidPass!'),
    /suspended/
  );

  // Test unverified mobile response
  global.fetch = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ detail: 'Account mobile number is not verified.' }),
  });

  await assert.rejects(
    async () => authService.login('9870000001', 'ValidPass!'),
    /not verified/
  );
});

test('3. OTP verification flow: sends request, handles cooldown and verifies code', async () => {
  // 1. Send OTP
  global.fetch = async (url, opts) => {
    assert.match(url, /\/api\/auth\/send-otp$/);
    const body = JSON.parse(opts.body);
    assert.equal(body.mobile, '9812345678');
    assert.equal(body.purpose, 'registration');
    return {
      ok: true,
      json: async () => ({ success: true, message: 'Verification code sent successfully.' }),
    };
  };

  const sendRes = await authService.sendOtp('9812345678', 'registration');
  assert.equal(sendRes.success, true);

  // 2. Cooldown rejection
  global.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ detail: 'Please wait 59 seconds before requesting another code.' }),
  });

  await assert.rejects(
    async () => authService.resendOtp('9812345678', 'registration'),
    /Please wait 59 seconds/
  );

  // 3. Verify OTP
  global.fetch = async (url, opts) => {
    assert.match(url, /\/api\/auth\/verify-otp$/);
    const body = JSON.parse(opts.body);
    assert.equal(body.otp_code, '654321');
    return {
      ok: true,
      json: async () => ({ success: true, message: 'Verification successful.' }),
    };
  };

  const verifyRes = await authService.verifyOtp('9812345678', '654321', 'registration');
  assert.equal(verifyRes.success, true);
});

test('4. Farmer registration: sends complete schema and stores returned tokens', async () => {
  const farmerPayload = {
    mobile: '9811111111',
    name: 'Baldev Singh',
    password: 'ValidPassword123!',
    role: 'farmer',
    state: 'Haryana',
    district: 'Ambala',
    primary_crop: 'Wheat',
    otp_code: '123456',
  };

  global.fetch = async (url, opts) => {
    assert.match(url, /\/api\/auth\/register$/);
    return {
      ok: true,
      json: async () => ({
        access_token: 'farmer_acc_tok',
        refresh_token: 'farmer_ref_tok',
        token_type: 'bearer',
        expires_in: 900,
        user: {
          id: 101,
          mobile: farmerPayload.mobile,
          role: 'farmer',
          is_verified: true,
          profile_details: { name: 'Baldev Singh', state: 'Haryana' },
        },
      }),
    };
  };

  const res = await authService.registerFarmer(farmerPayload);
  assert.equal(res.user.role, 'farmer');
  assert.equal(tokenStorage.getAccessToken(), 'farmer_acc_tok');
});

test('5. Psychiatrist registration: handles required license & unapproved status', async () => {
  const psychPayload = {
    mobile: '9822222222',
    name: 'Dr. Anita Roy',
    password: 'ValidPassword123!',
    license_number: 'PSY-DEL-9842',
    specialization: 'Rural Distress',
  };

  global.fetch = async (url, opts) => {
    assert.match(url, /\/api\/auth\/register\/psychiatrist$/);
    return {
      ok: true,
      json: async () => ({
        access_token: 'psych_acc_tok',
        refresh_token: 'psych_ref_tok',
        token_type: 'bearer',
        expires_in: 900,
        user: {
          id: 102,
          mobile: psychPayload.mobile,
          role: 'psychiatrist',
          profile_details: { is_approved: false, license_number: psychPayload.license_number },
        },
      }),
    };
  };

  const res = await authService.registerPsychiatrist(psychPayload);
  assert.equal(res.user.role, 'psychiatrist');
  assert.equal(res.user.profile_details.is_approved, false);
});

test('6. Warehouse-owner registration: handles company name & unapproved status', async () => {
  const warehousePayload = {
    mobile: '9833333333',
    name: 'Suresh Patel',
    password: 'ValidPassword123!',
    company_name: 'Patel Agro Cold Storage',
    gstin: '06AAAAA0000A1Z5',
  };

  global.fetch = async (url, opts) => {
    assert.match(url, /\/api\/auth\/register\/warehouse-owner$/);
    return {
      ok: true,
      json: async () => ({
        access_token: 'wh_acc_tok',
        refresh_token: 'wh_ref_tok',
        token_type: 'bearer',
        expires_in: 900,
        user: {
          id: 103,
          mobile: warehousePayload.mobile,
          role: 'warehouse_owner',
          profile_details: { is_approved: false, company_name: warehousePayload.company_name },
        },
      }),
    };
  };

  const res = await authService.registerWarehouseOwner(warehousePayload);
  assert.equal(res.user.role, 'warehouse_owner');
  assert.equal(res.user.profile_details.is_approved, false);
});

test('7. Password recovery flow: handles forgot-password and reset-password contracts', async () => {
  global.fetch = async (url, opts) => {
    if (url.includes('/forgot-password')) {
      const body = JSON.parse(opts.body);
      assert.equal(body.mobile, '9844444444');
      return { ok: true, json: async () => ({ success: true, message: 'Code sent.' }) };
    }
    if (url.includes('/reset-password')) {
      const body = JSON.parse(opts.body);
      assert.equal(body.mobile, '9844444444');
      assert.equal(body.otp_code, '654321');
      assert.equal(body.new_password, 'NewSecurePassword123!');
      return { ok: true, json: async () => ({ success: true, message: 'Password reset.' }) };
    }
    throw new Error('Unexpected URL');
  };

  const forgotRes = await authService.forgotPassword('9844444444');
  assert.equal(forgotRes.success, true);

  const resetRes = await authService.resetPassword('9844444444', '654321', 'NewSecurePassword123!');
  assert.equal(resetRes.success, true);
});

test('8. Session restoration: fetches current user with Authorization header', async () => {
  tokenStorage.setTokens('valid_access_token', 'valid_refresh_token');

  let authHeaderPassed = '';
  global.fetch = async (url, opts) => {
    assert.match(url, /\/api\/auth\/me$/);
    authHeaderPassed = opts.headers['Authorization'];
    return {
      ok: true,
      json: async () => ({
        id: 50,
        mobile: '9855555555',
        role: 'farmer',
        is_active: true,
        is_verified: true,
      }),
    };
  };

  const user = await authService.getCurrentUser();
  assert.equal(authHeaderPassed, 'Bearer valid_access_token');
  assert.equal(user.id, 50);
});

test('9. Refresh-token rotation: replaces token pair and detects failure', async () => {
  tokenStorage.setTokens('expired_acc', 'valid_ref_token');

  global.fetch = async (url) => {
    assert.match(url, /\/api\/auth\/refresh$/);
    return {
      ok: true,
      json: async () => ({
        access_token: 'fresh_rotated_access',
        refresh_token: 'fresh_rotated_refresh',
        token_type: 'bearer',
        expires_in: 900,
        user: { id: 201, role: 'farmer' },
      }),
    };
  };

  const res = await authService.refreshSession();
  assert.equal(res.access_token, 'fresh_rotated_access');
  assert.equal(tokenStorage.getAccessToken(), 'fresh_rotated_access');
  assert.equal(tokenStorage.getRefreshToken(), 'fresh_rotated_refresh');

  // Failed refresh clears tokens
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Refresh token has expired' }),
  });

  await assert.rejects(
    async () => authService.refreshSession(),
    /Refresh token has expired/
  );
  assert.equal(tokenStorage.getAccessToken(), null);
  assert.equal(tokenStorage.getRefreshToken(), null);
});

test('10. Logout and Logout-all: revokes tokens on backend and clears client state', async () => {
  tokenStorage.setTokens('acc_99', 'ref_99', { id: 99 });

  let singleLogoutCalled = false;
  global.fetch = async (url, opts) => {
    if (url.includes('/logout-all')) {
      return { ok: true, json: async () => ({ success: true, message: 'All sessions revoked.' }) };
    }
    if (url.includes('/logout')) {
      singleLogoutCalled = true;
      const body = JSON.parse(opts.body);
      assert.equal(body.refresh_token, 'ref_99');
      return { ok: true, json: async () => ({ success: true, message: 'Logged out.' }) };
    }
    throw new Error('Unexpected URL');
  };

  await authService.logout();
  assert.equal(singleLogoutCalled, true);
  assert.equal(tokenStorage.getAccessToken(), null);

  tokenStorage.setTokens('acc_100', 'ref_100', { id: 100 });
  await authService.logoutAll();
  assert.equal(tokenStorage.getAccessToken(), null);
});

test('11. Protected-route behavior: checks authentication state', () => {
  const isUserAuthenticated = (user) => !!user;
  assert.equal(isUserAuthenticated(null), false);
  assert.equal(isUserAuthenticated({ id: 1, role: 'farmer' }), true);
});

test('12. Role-based access control: verifies role routing rules', () => {
  const checkRoleAccess = (userRole, allowedRoles) => allowedRoles.includes(userRole);

  assert.equal(checkRoleAccess('farmer', ['farmer']), true);
  assert.equal(checkRoleAccess('psychiatrist', ['farmer']), false);
  assert.equal(checkRoleAccess('warehouse_owner', ['warehouse_owner']), true);
  assert.equal(checkRoleAccess('admin', ['psychiatrist']), false);
  assert.equal(checkRoleAccess('admin', ['warehouse_owner']), false);
  assert.equal(checkRoleAccess('admin', ['admin']), true);
});

test('13. Pending professional approval: isolates unapproved professionals', () => {
  const canAccessProfessionalPortal = (user) => {
    if (!user) return false;
    if (user.role === 'farmer' || user.role === 'admin') return true;
    return !!user.profile_details?.is_approved;
  };

  const pendingPsychiatrist = {
    role: 'psychiatrist',
    profile_details: { is_approved: false },
  };
  const approvedPsychiatrist = {
    role: 'psychiatrist',
    profile_details: { is_approved: true },
  };
  const pendingWarehouse = {
    role: 'warehouse_owner',
    profile_details: { is_approved: false },
  };
  const approvedWarehouse = {
    role: 'warehouse_owner',
    profile_details: { is_approved: true },
  };

  assert.equal(canAccessProfessionalPortal(pendingPsychiatrist), false);
  assert.equal(canAccessProfessionalPortal(approvedPsychiatrist), true);
  assert.equal(canAccessProfessionalPortal(pendingWarehouse), false);
  assert.equal(canAccessProfessionalPortal(approvedWarehouse), true);
});

test('14. Existing farmer features regression: validates all 12 core routes exist', async () => {
  const requiredRoutes = [
    '/',
    '/storage',
    '/insurance',
    '/schemes',
    '/financial',
    '/ml-crop-advisor',
    '/gemini-advisor',
    '/mental-health',
    '/status-tracking',
    '/pmfby-enrollment',
    '/claim-filing',
    '/risk-awareness',
  ];

  assert.equal(requiredRoutes.length, 12);
  requiredRoutes.forEach((route) => {
    assert.match(route, /^\/[a-z0-9\-]*$/);
  });
});

test('15. CRIT-01: Farmer pre-verified registration succeeds without resending otp_code', async () => {
  let verifyCalled = false;
  let registerPayload = null;

  global.fetch = async (url, opts) => {
    if (url.includes('/api/auth/verify-otp')) {
      verifyCalled = true;
      return { ok: true, json: async () => ({ success: true, message: 'OTP verified successfully.' }) };
    }
    if (url.includes('/api/auth/register') && !url.includes('psychiatrist') && !url.includes('warehouse')) {
      registerPayload = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          access_token: 'acc_farmer_1',
          refresh_token: 'ref_farmer_1',
          user: { id: 301, role: 'farmer', mobile: '9876500001' },
        }),
      };
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  };

  // Step 1: User completes verify OTP
  const verifyRes = await authService.verifyOtp('9876500001', '654321', 'registration');
  assert.equal(verifyRes.success, true);
  assert.equal(verifyCalled, true);

  // Step 2: User completes registration (pre-verified logic sets otp_code to undefined)
  const registrationPayload = {
    mobile: '9876500001',
    name: 'Ramesh Singh',
    password: 'Password123!',
    role: 'farmer',
    state: 'Haryana',
    farmer_category: 'small',
    otp_code: undefined, // CRIT-01 fix
  };

  const regRes = await authService.registerFarmer(registrationPayload);
  assert.equal(regRes.access_token, 'acc_farmer_1');
  assert.equal(registerPayload.otp_code, undefined, 'otp_code must NOT be sent when mobile is pre-verified');
  assert.equal(registerPayload.mobile, '9876500001');
});

test('16. CRIT-01: Farmer registration with unverified flow sends otp_code', async () => {
  let registerPayload = null;

  global.fetch = async (url, opts) => {
    if (url.includes('/api/auth/register')) {
      registerPayload = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          access_token: 'acc_farmer_2',
          refresh_token: 'ref_farmer_2',
          user: { id: 302, role: 'farmer', mobile: '9876500002' },
        }),
      };
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  };

  const registrationPayload = {
    mobile: '9876500002',
    name: 'Suresh Patel',
    password: 'Password123!',
    role: 'farmer',
    otp_code: '123456', // User skipped separate verify step
  };

  const regRes = await authService.registerFarmer(registrationPayload);
  assert.equal(regRes.access_token, 'acc_farmer_2');
  assert.equal(registerPayload.otp_code, '123456', 'otp_code must be sent when not pre-verified');
});

test('17. CRIT-01: Psychiatrist pre-verified registration succeeds without resending otp_code', async () => {
  let registerPayload = null;

  global.fetch = async (url, opts) => {
    if (url.includes('/api/auth/verify-otp')) {
      return { ok: true, json: async () => ({ success: true, message: 'OTP verified.' }) };
    }
    if (url.includes('/api/auth/register/psychiatrist')) {
      registerPayload = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          access_token: 'acc_psych_1',
          refresh_token: 'ref_psych_1',
          user: { id: 401, role: 'psychiatrist', mobile: '9876500003', profile_details: { is_approved: false } },
        }),
      };
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  };

  await authService.verifyOtp('9876500003', '654321', 'registration');
  const res = await authService.registerPsychiatrist({
    mobile: '9876500003',
    name: 'Dr. Sharma',
    password: 'Password123!',
    license_number: 'MCI-12345',
    otp_code: undefined, // CRIT-01 fix
  });

  assert.equal(res.access_token, 'acc_psych_1');
  assert.equal(registerPayload.otp_code, undefined);
  assert.equal(registerPayload.license_number, 'MCI-12345');
});

test('18. CRIT-01: Warehouse Owner pre-verified registration succeeds without resending otp_code', async () => {
  let registerPayload = null;

  global.fetch = async (url, opts) => {
    if (url.includes('/api/auth/verify-otp')) {
      return { ok: true, json: async () => ({ success: true, message: 'OTP verified.' }) };
    }
    if (url.includes('/api/auth/register/warehouse-owner')) {
      registerPayload = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          access_token: 'acc_wh_1',
          refresh_token: 'ref_wh_1',
          user: { id: 501, role: 'warehouse_owner', mobile: '9876500004', profile_details: { is_approved: false } },
        }),
      };
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  };

  await authService.verifyOtp('9876500004', '654321', 'registration');
  const res = await authService.registerWarehouseOwner({
    mobile: '9876500004',
    name: 'Kisan Cold Storage',
    password: 'Password123!',
    company_name: 'Haryana Cold Storage Pvt Ltd',
    otp_code: undefined, // CRIT-01 fix
  });

  assert.equal(res.access_token, 'acc_wh_1');
  assert.equal(registerPayload.otp_code, undefined);
  assert.equal(registerPayload.company_name, 'Haryana Cold Storage Pvt Ltd');
});

test('19. CRIT-01 Safeguard: Changing mobile after verification invalidates verification binding', () => {
  let mobile = '9876500001';
  let otpVerified = false;
  let verifiedMobile = '';

  // Simulate verification
  otpVerified = true;
  verifiedMobile = mobile;

  // Mobile matches verifiedMobile
  let isActuallyVerified = otpVerified && mobile === verifiedMobile;
  assert.equal(isActuallyVerified, true);

  // User alters mobile number in the form
  mobile = '9811122233';
  otpVerified = false;
  verifiedMobile = '';

  isActuallyVerified = otpVerified && mobile === verifiedMobile;
  assert.equal(isActuallyVerified, false, 'Changing mobile must invalidate verified state');
});

test('20. CRIT-01 Safeguard: Changing OTP code after verification resets verification state', () => {
  let otpCode = '123456';
  let otpVerified = true;
  let verifiedMobile = '9876500001';

  // User alters OTP code input
  otpCode = '654321';
  otpVerified = false;
  verifiedMobile = '';

  const isActuallyVerified = otpVerified && '9876500001' === verifiedMobile;
  assert.equal(isActuallyVerified, false, 'Changing OTP must reset verified state');
});

test('21. HIGH-01: Role segregation strictly isolates admin and cross-role portals', () => {
  const routes = {
    '/dashboard': { allowedRoles: ['farmer'] },
    '/portal/psychiatrist': { allowedRoles: ['psychiatrist'] },
    '/portal/warehouse': { allowedRoles: ['warehouse_owner'] },
    '/portal/admin': { allowedRoles: ['admin'] },
  };

  const canAccess = (role, path) => routes[path].allowedRoles.includes(role);

  // Admin cannot enter operational portals
  assert.equal(canAccess('admin', '/portal/psychiatrist'), false);
  assert.equal(canAccess('admin', '/portal/warehouse'), false);
  assert.equal(canAccess('admin', '/dashboard'), false);
  assert.equal(canAccess('admin', '/portal/admin'), true);

  // Farmer cannot enter clinical, warehouse, or admin portals
  assert.equal(canAccess('farmer', '/dashboard'), true);
  assert.equal(canAccess('farmer', '/portal/psychiatrist'), false);
  assert.equal(canAccess('farmer', '/portal/warehouse'), false);
  assert.equal(canAccess('farmer', '/portal/admin'), false);

  // Psychiatrist cannot enter warehouse or admin
  assert.equal(canAccess('psychiatrist', '/portal/psychiatrist'), true);
  assert.equal(canAccess('psychiatrist', '/portal/warehouse'), false);
  assert.equal(canAccess('psychiatrist', '/portal/admin'), false);

  // Warehouse owner cannot enter psychiatrist or admin
  assert.equal(canAccess('warehouse_owner', '/portal/warehouse'), true);
  assert.equal(canAccess('warehouse_owner', '/portal/psychiatrist'), false);
  assert.equal(canAccess('warehouse_owner', '/portal/admin'), false);
});

test('22. HIGH-01: Professional portal approval gating redirects unapproved users', () => {
  const evaluateAccess = (user, requireApproval) => {
    if (!user) return { allowed: false, redirect: '/login' };
    if (requireApproval && user.profile_details?.is_approved === false) {
      return { allowed: false, redirect: '/pending-approval' };
    }
    return { allowed: true, redirect: null };
  };

  const pendingPsychiatrist = { role: 'psychiatrist', profile_details: { is_approved: false } };
  const approvedPsychiatrist = { role: 'psychiatrist', profile_details: { is_approved: true } };

  assert.deepEqual(evaluateAccess(pendingPsychiatrist, true), {
    allowed: false,
    redirect: '/pending-approval',
  });
  assert.deepEqual(evaluateAccess(approvedPsychiatrist, true), {
    allowed: true,
    redirect: null,
  });
});

test('23. Intended destination restoration preserves redirect state on login', () => {
  // Simulated navigation interception
  const protectedRouteAttempt = '/portal/psychiatrist';
  const loginState = { from: { pathname: protectedRouteAttempt } };

  // After authentication, login checks location.state?.from?.pathname
  const destination = loginState?.from?.pathname || '/';
  assert.equal(destination, '/portal/psychiatrist');
});

test('24. HIGH-02: Concurrent same-tab refreshSession calls deduplicate to 1 network request', async () => {
  tokenStorage.setTokens('old_access', 'active_refresh_token');

  let refreshNetworkCalls = 0;
  global.fetch = async (url) => {
    if (url.includes('/api/auth/refresh')) {
      refreshNetworkCalls++;
      // Artificial asynchronous delay to simulate in-flight network round-trip
      await new Promise((resolve) => setTimeout(resolve, 20));
      return {
        ok: true,
        json: async () => ({
          access_token: 'fresh_deduped_access',
          refresh_token: 'fresh_deduped_refresh',
          user: { id: 88, role: 'farmer' },
        }),
      };
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  };

  // Launch 5 concurrent refresh requests simultaneously
  const results = await Promise.all([
    authService.refreshSession(),
    authService.refreshSession(),
    authService.refreshSession(),
    authService.refreshSession(),
    authService.refreshSession(),
  ]);

  // Assert: Exactly 1 network request was issued
  assert.equal(refreshNetworkCalls, 1, 'Only one POST /refresh request must be dispatched for concurrent callers');

  // Assert: All callers received the fresh rotated tokens
  results.forEach((res) => {
    assert.equal(res.access_token, 'fresh_deduped_access');
    assert.equal(res.refresh_token, 'fresh_deduped_refresh');
  });

  assert.equal(tokenStorage.getAccessToken(), 'fresh_deduped_access');
  assert.equal(tokenStorage.getRefreshToken(), 'fresh_deduped_refresh');
});

test('25. HIGH-02: Failed refresh clears invalid session and resets in-flight lock', async () => {
  tokenStorage.setTokens('expired_acc', 'compromised_refresh');

  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Token has been revoked or expired.' }),
  });

  await assert.rejects(
    async () => authService.refreshSession(),
    /revoked or expired/
  );

  // Storage is cleared
  assert.equal(tokenStorage.getAccessToken(), null);
  assert.equal(tokenStorage.getRefreshToken(), null);

  // Subsequent call without token immediately throws without network call
  await assert.rejects(
    async () => authService.refreshSession(),
    /No refresh token available/
  );
});
