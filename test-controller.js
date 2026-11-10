// BhoomiBandhu 2.0 In-Process Controller & Auth Suite
const { router: authRouter, JWT_SECRET, authenticateToken, requireRole } = require('./auth');
const db = require('./db');
const jwt = require('jsonwebtoken');

function callHandler(routePath, method, body = {}, headers = {}) {
  return new Promise((resolve) => {
    // Find matching route in authRouter
    const layer = authRouter.stack.find(s => 
      s.route && 
      s.route.path === routePath && 
      s.route.methods[method.toLowerCase()]
    );

    if (!layer) {
      return resolve({ status: 404, body: { error: `Route ${method} ${routePath} not found` } });
    }

    const req = {
      method: method.toUpperCase(),
      path: routePath,
      body,
      headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
      query: {}
    };

    let statusCode = 200;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        resolve({ status: statusCode, body: data });
      }
    };

    // Chain middlewares if route has multiple stack handlers (e.g. authenticateToken, requireRole)
    const handlers = layer.route.stack.map(h => h.handle);
    let idx = 0;
    function next(err) {
      if (err) return resolve({ status: 500, body: { error: err.message } });
      if (idx < handlers.length) {
        const fn = handlers[idx++];
        fn(req, res, next);
      }
    }
    next();
  });
}

async function runTests() {
  console.log('🌾 Testing BhoomiBandhu 2.0 Core Auth Engine...\n');
  let passed = 0;
  let total = 0;

  function assert(cond, msg) {
    total++;
    if (cond) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
    }
  }

  // 1. Farmer Login
  const farmerLogin = await callHandler('/login', 'POST', {
    identifier: '9823456789',
    password: 'Kisan@12345'
  });
  assert(farmerLogin.status === 200 && farmerLogin.body.success, 'Farmer login successful');
  assert(farmerLogin.body.user.role === 'farmer', 'Farmer role verified as "farmer"');
  assert(farmerLogin.body.redirectUrl === '/dashboard/farmer', 'Farmer redirect URL verified as /dashboard/farmer');
  const farmerToken = farmerLogin.body.token;

  // 2. Service Provider Login
  const provLogin = await callHandler('/login', 'POST', {
    identifier: '9811223344',
    password: 'Service@12345'
  });
  assert(provLogin.status === 200 && provLogin.body.success, 'Service Provider login successful');
  assert(provLogin.body.user.role === 'service_provider', 'Provider role verified as "service_provider"');
  assert(provLogin.body.redirectUrl === '/dashboard/provider', 'Provider redirect URL verified as /dashboard/provider');

  // 3. Administrator Login
  const adminLogin = await callHandler('/login', 'POST', {
    identifier: 'admin@bhoomibandhu.in',
    password: 'Admin@12345'
  });
  assert(adminLogin.status === 200 && adminLogin.body.success, 'Administrator login successful');
  assert(adminLogin.body.user.role === 'admin', 'Admin role verified as "admin"');
  assert(adminLogin.body.redirectUrl === '/dashboard/admin', 'Admin redirect URL verified as /dashboard/admin');
  const adminToken = adminLogin.body.token;

  // 4. Invalid Password Rejection
  const badLogin = await callHandler('/login', 'POST', {
    identifier: '9823456789',
    password: 'WrongPassword'
  });
  assert(badLogin.status === 401 && !badLogin.body.success, 'Invalid password rejected with status 401');

  // 5. Direct Admin Self-Registration Prevention
  const adminReg = await callHandler('/register', 'POST', {
    full_name: 'Unauthorized User',
    mobile: '9876540000',
    password: 'Password@123',
    role: 'admin'
  });
  assert(adminReg.status === 403 && !adminReg.body.success, 'Security Policy: Direct public registration as admin is prohibited');

  // 6. Send OTP
  const testPhone = '987' + Math.floor(1000000 + Math.random() * 9000000);
  const testEmail = `farmer_${Date.now()}@kisan.in`;
  const otpRes = await callHandler('/send-otp', 'POST', { identifier: testPhone });
  assert(otpRes.status === 200 && otpRes.body.success, 'OTP dispatched with expiry');
  const generatedOtp = otpRes.body.testOtp;

  // 7. Verify OTP
  const verifyRes = await callHandler('/verify-otp', 'POST', {
    identifier: testPhone,
    otp: generatedOtp
  });
  assert(verifyRes.status === 200 && verifyRes.body.success, 'OTP successfully verified');

  // 8. Multi-Step Farmer Registration with Agricultural Profile
  const regRes = await callHandler('/register', 'POST', {
    full_name: 'Balwant Singh',
    email: testEmail,
    mobile: testPhone,
    password: 'Password@123',
    role: 'farmer',
    agricultural_profile: {
      state: 'Haryana',
      district: 'Karnal',
      village: 'Taraori',
      landholding_size: '5.2 Acres',
      primary_crops: 'Basmati Rice, Wheat',
      farming_experience: '18 Years'
    }
  });
  assert(regRes.status === 201 && regRes.body.success, 'New farmer persisted in database');
  assert(regRes.body.redirectUrl === '/dashboard/farmer', 'New farmer redirected to /dashboard/farmer');
  const newFarmerToken = regRes.body.token;

  // 9. Protected Profile (/api/auth/me)
  const meRes = await callHandler('/me', 'GET', {}, {
    Authorization: `Bearer ${newFarmerToken}`
  });
  assert(meRes.status === 200 && meRes.body.user.full_name === 'Balwant Singh', 'Protected profile API returns authenticated user');
  assert(meRes.body.user.profile.district === 'Karnal', 'Farm profile district accurately verified');

  // 10. Role Authorization Guard (Farmer blocked from Admin APIs)
  const forbiddenRes = await callHandler('/admin/stats', 'GET', {}, {
    Authorization: `Bearer ${farmerToken}`
  });
  assert(forbiddenRes.status === 403, 'Role Guard: Farmer token forbidden from accessing admin endpoints');

  // 11. Admin Access to Platform Stats & User Management
  const statsRes = await callHandler('/admin/stats', 'GET', {}, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(statsRes.status === 200 && statsRes.body.stats.farmers >= 2, 'Admin stats report accurate farmer count');

  const usersRes = await callHandler('/admin/users', 'GET', {}, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(usersRes.status === 200 && Array.isArray(usersRes.body.users) && usersRes.body.users.length >= 4, 'Admin lists all platform users');

  // 12. Password Recovery Workflow
  const forgotRes = await callHandler('/forgot-password', 'POST', { identifier: testPhone });
  assert(forgotRes.status === 200 && forgotRes.body.success, 'Forgot password initiates recovery');

  const resetRes = await callHandler('/reset-password', 'POST', {
    identifier: testPhone,
    otp: forgotRes.body.testOtp,
    newPassword: 'BrandNewSecurePassword@99'
  });
  assert(resetRes.status === 200 && resetRes.body.success, 'Password successfully reset with OTP verification');

  // 13. Login with Updated Password
  const reLogin = await callHandler('/login', 'POST', {
    identifier: testPhone,
    password: 'BrandNewSecurePassword@99'
  });
  assert(reLogin.status === 200 && reLogin.body.success, 'User successfully authenticated with updated password');

  console.log(`\n======================================================`);
  console.log(`✨ ALL TESTS COMPLETED: ${passed} / ${total} tests passed!`);
  console.log(`======================================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
