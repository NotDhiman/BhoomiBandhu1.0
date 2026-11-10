// BhoomiBandhu 2.0 - Authentication & Role-Based Authorization Controller
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'bhoomi_bandhu_2_0_secure_farming_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }
    req.user = decoded;
    next();
  });
}

// Middleware: Role Authorization
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Authorized role(s): ${allowedRoles.join(', ')}.`
      });
    }
    next();
  };
}

// Helper: Generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────────────────────
// 1. Send OTP (Mobile / Email)
// ─────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { identifier, type } = req.body;
    if (!identifier || identifier.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid mobile number or email.' });
    }

    const cleanIdentifier = identifier.trim();
    const otp = generateOtp();
    await db.saveOtp(cleanIdentifier, otp, 10);

    console.log(`🌾 [BhoomiBandhu OTP] Sent OTP ${otp} to: ${cleanIdentifier}`);

    res.json({
      success: true,
      message: `OTP sent successfully to ${cleanIdentifier}. Valid for 10 minutes.`,
      // For testing & seamless demo experience, we include the test OTP in the response
      testOtp: otp
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate OTP. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. Verify OTP
// ─────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and OTP are required.' });
    }

    const cleanIdentifier = identifier.trim();
    const cleanOtp = otp.toString().trim();

    // Universal demo code 123456 accepted for testing in addition to actual generated code
    const isSpecialDemoCode = (cleanOtp === '123456');
    const isValid = isSpecialDemoCode || await db.verifyOtp(cleanIdentifier, cleanOtp);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please check and retry.' });
    }

    res.json({ success: true, message: 'Verification successful!' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. User Registration (Multi-Step Persistence)
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      email,
      mobile,
      password,
      role,
      agricultural_profile,
      provider_profile,
      otp_verified
    } = req.body;

    // Validation
    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter your full name.' });
    }
    if (!mobile || mobile.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Role Enforcement: Cannot register as 'admin' directly!
    const targetRole = (role || 'farmer').toLowerCase().trim();
    if (targetRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Security policy: Administrator accounts cannot be self-registered. Contact platform administration.'
      });
    }

    if (!['farmer', 'service_provider'].includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Supported roles are Farmer or Agricultural Service Provider.'
      });
    }

    // Check existing by email or mobile
    const existingMobile = await db.findUserByEmailOrMobile(mobile);
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: 'An account with this mobile number already exists. Please log in instead.'
      });
    }

    if (email && email.trim()) {
      const existingEmail = await db.findUserByEmailOrMobile(email.trim());
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in instead.'
        });
      }
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user in PostgreSQL / DB
    const user = await db.createUser({
      full_name: full_name.trim(),
      email: email ? email.trim() : null,
      mobile: mobile.trim(),
      password_hash,
      role: targetRole,
      status: 'active'
    });

    // Save Role-Specific Profile
    if (targetRole === 'farmer' && agricultural_profile) {
      await db.createFarmerProfile({
        user_id: user.id,
        state: agricultural_profile.state || '',
        district: agricultural_profile.district || '',
        village: agricultural_profile.village || '',
        landholding_size: agricultural_profile.landholding_size || '',
        primary_crops: agricultural_profile.primary_crops || '',
        farming_experience: agricultural_profile.farming_experience || ''
      });
    } else if (targetRole === 'service_provider' && provider_profile) {
      await db.createProviderProfile({
        user_id: user.id,
        business_name: provider_profile.business_name || full_name,
        service_types: provider_profile.service_types || 'Agricultural Equipment & Machinery',
        state: provider_profile.state || '',
        district: provider_profile.district || '',
        experience: provider_profile.experience || ''
      });
    }

    // Retrieve full user with profile for immediate client hydration
    const fullUser = await db.getUserById(user.id);
    const { password_hash: _, ...safeUser } = fullUser || user;

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, full_name: user.full_name, email: user.email, mobile: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Determine dashboard redirect path
    const redirectUrl = targetRole === 'service_provider' ? '/dashboard/provider' : '/dashboard/farmer';

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to BhoomiBandhu 2.0.',
      token,
      user: safeUser,
      redirectUrl
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed due to a server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. User Login (Email or Mobile + Password)
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your mobile number / email and password.'
      });
    }

    const user = await db.findUserByEmailOrMobile(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found matching this mobile number or email. Please register first.'
      });
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive. Please contact support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your credentials or use Forgot Password.'
      });
    }

    // Token expiry based on remember me
    const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
    const token = jwt.sign(
      { id: user.id, full_name: user.full_name, email: user.email, mobile: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn }
    );

    // Determine dashboard redirect
    let redirectUrl = '/dashboard/farmer';
    if (user.role === 'admin') {
      redirectUrl = '/dashboard/admin';
    } else if (user.role === 'service_provider') {
      redirectUrl = '/dashboard/provider';
    }

    // Retrieve full user profile
    const fullUser = await db.getUserById(user.id);
    const { password_hash: _, ...safeUser } = fullUser || user;

    res.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      token,
      user: safeUser,
      redirectUrl
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed due to a server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. Password Recovery / Forgot Password
// ─────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide your registered mobile number or email.' });
    }

    const user = await db.findUserByEmailOrMobile(identifier);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with this mobile number or email.'
      });
    }

    const otp = generateOtp();
    await db.saveOtp(user.mobile, otp, 15);
    console.log(`🌾 [BhoomiBandhu Password Reset] OTP for ${user.full_name} (${user.mobile}): ${otp}`);

    res.json({
      success: true,
      message: `Password reset verification code sent to your registered mobile/email.`,
      testOtp: otp,
      identifier: user.mobile
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate password reset.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. Reset Password with Verified OTP
// ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await db.findUserByEmailOrMobile(identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isSpecialDemoCode = (otp.toString().trim() === '123456');
    const isValid = isSpecialDemoCode || await db.verifyOtp(identifier, otp.toString().trim());

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await db.updateUserPassword(user.id, newHash);

    res.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. Get Current User Profile (Protected)
// ─────────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. Logout
// ─────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─────────────────────────────────────────────────────────────
// 9. Admin Protected APIs
// ─────────────────────────────────────────────────────────────
router.get('/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await db.listUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list users.' });
  }
});

router.get('/admin/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get stats.' });
  }
});

module.exports = {
  router,
  authenticateToken,
  requireRole,
  JWT_SECRET
};
