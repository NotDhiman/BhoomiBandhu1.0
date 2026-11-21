import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authService } from '../../services/authService.js';
import '../../pageStyles/auth.css';

export default function RegisterPage() {
  const { registerFarmer, registerPsychiatrist, registerWarehouseOwner } = useAuth();
  const navigate = useNavigate();

  // Role tab: 'farmer' | 'psychiatrist' | 'warehouse_owner'
  const [role, setRole] = useState('farmer');

  // Common fields
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedMobile, setVerifiedMobile] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Farmer specific fields
  const [stateName, setStateName] = useState('Haryana');
  const [farmerCategory, setFarmerCategory] = useState('small');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');

  // Psychiatrist specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Warehouse Owner specific fields
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const cleanMobileNumber = (val) => val.replace(/\D/g, '').slice(0, 10);

  const handleSendOtp = async () => {
    setError('');
    setSuccessMsg('');
    setOtpVerified(false);
    setVerifiedMobile('');
    const cleanMobile = cleanMobileNumber(mobile);

    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setOtpLoading(true);
    try {
      await authService.sendOtp(cleanMobile, 'registration');
      setOtpSent(true);
      setCooldown(60);
      setSuccessMsg('Verification code sent successfully. Please check your SMS.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    const cleanMobile = cleanMobileNumber(mobile);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setOtpLoading(true);
    try {
      await authService.verifyOtp(cleanMobile, otpCode.trim(), 'registration');
      setOtpVerified(true);
      setVerifiedMobile(cleanMobile);
      setSuccessMsg('Mobile number verified successfully!');
    } catch (err) {
      setOtpVerified(false);
      setVerifiedMobile('');
      setError(err.message || 'OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanMobile = cleanMobileNumber(mobile);
    if (cleanMobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/\d|[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one digit or special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // Safeguard: Check if verification matches the submitted mobile
    const isActuallyVerified = otpVerified && cleanMobile === verifiedMobile;

    if (!isActuallyVerified && (!otpCode || otpCode.trim().length !== 6)) {
      setError('Mobile verification code (OTP) is required to complete registration.');
      return;
    }

    setIsLoading(true);
    try {
      if (role === 'farmer') {
        const payload = {
          mobile: cleanMobile,
          name: name.trim(),
          password,
          email: email.trim() || null,
          role: 'farmer',
          state: stateName || 'Haryana',
          farmer_category: farmerCategory || 'small',
          district: district.trim() || null,
          village: village.trim() || null,
          primary_crop: primaryCrop.trim() || null,
          otp_code: isActuallyVerified ? undefined : (otpCode.trim() || undefined),
        };
        await registerFarmer(payload);
        navigate('/', { replace: true });
      } else if (role === 'psychiatrist') {
        if (!licenseNumber.trim()) {
          setError('Medical license number is required.');
          setIsLoading(false);
          return;
        }
        const payload = {
          mobile: cleanMobile,
          name: name.trim(),
          password,
          email: email.trim() || null,
          license_number: licenseNumber.trim(),
          specialization: specialization.trim() || null,
          otp_code: isActuallyVerified ? undefined : (otpCode.trim() || undefined),
        };
        await registerPsychiatrist(payload);
        navigate('/pending-approval', { replace: true });
      } else if (role === 'warehouse_owner') {
        if (!companyName.trim()) {
          setError('Company / Facility name is required.');
          setIsLoading(false);
          return;
        }
        const payload = {
          mobile: cleanMobile,
          name: name.trim(),
          password,
          email: email.trim() || null,
          company_name: companyName.trim(),
          gstin: gstin.trim() || null,
          otp_code: isActuallyVerified ? undefined : (otpCode.trim() || undefined),
        };
        await registerWarehouseOwner(payload);
        navigate('/pending-approval', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '12px' }}>
            <img
              src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
              alt="BhoomiBandhu"
              style={{ width: '64px', height: '64px' }}
            />
            <span style={{ fontSize: '1.4rem' }}>BhoomiBandhu</span>
          </div>
          <h1>Create Your Account</h1>
          <p>Join the trusted platform for farmers and agriculture partners</p>
        </div>

        {/* Role Tabs */}
        <div className="role-tabs" role="tablist">
          <button
            type="button"
            className={`role-tab ${role === 'farmer' ? 'active' : ''}`}
            onClick={() => { setRole('farmer'); setError(''); }}
            role="tab"
            aria-selected={role === 'farmer'}
          >
            🌾 Farmer
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'psychiatrist' ? 'active' : ''}`}
            onClick={() => { setRole('psychiatrist'); setError(''); }}
            role="tab"
            aria-selected={role === 'psychiatrist'}
          >
            🧠 Psychiatrist
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'warehouse_owner' ? 'active' : ''}`}
            onClick={() => { setRole('warehouse_owner'); setError(''); }}
            role="tab"
            aria-selected={role === 'warehouse_owner'}
          >
            🏬 Storage Owner
          </button>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success" role="alert">
            <span>✓</span>
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Mobile + OTP Verification */}
          <div className="form-group">
            <label htmlFor="reg-mobile">Mobile Number (10 digits) *</label>
            <div className="otp-dispatch-row">
              <input
                id="reg-mobile"
                type="tel"
                className="auth-input"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => {
                  setMobile(cleanMobileNumber(e.target.value));
                  setOtpVerified(false);
                  setVerifiedMobile('');
                }}
                maxLength={10}
                disabled={isLoading || otpVerified}
                required
              />
              <button
                type="button"
                className="otp-send-btn"
                onClick={handleSendOtp}
                disabled={otpLoading || cooldown > 0 || mobile.length !== 10 || otpVerified}
              >
                {otpLoading
                  ? 'Sending...'
                  : cooldown > 0
                    ? `Wait ${cooldown}s`
                    : otpSent
                      ? 'Resend OTP'
                      : 'Send OTP'}
              </button>
            </div>
            {otpVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span className="verified-badge">✓ Mobile verified</span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpVerified(false);
                    setVerifiedMobile('');
                    setOtpCode('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--green, #16a34a)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* OTP Input (if sent or needed) */}
          {(otpSent || otpVerified) && (
            <div className="form-group">
              <label htmlFor="reg-otp">6-Digit Verification Code *</label>
              <div className="otp-dispatch-row">
                <input
                  id="reg-otp"
                  type="text"
                  className="auth-input"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setOtpVerified(false);
                    setVerifiedMobile('');
                  }}
                  maxLength={6}
                  disabled={isLoading || otpVerified}
                  required
                />
                {!otpVerified && (
                  <button
                    type="button"
                    className="otp-send-btn"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              className="auth-input"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Email (Optional) */}
          <div className="form-group">
            <label htmlFor="reg-email">Email Address (Optional)</label>
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              placeholder="e.g. ramesh@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password">Password (min 8 chars, 1 number/symbol) *</label>
            <div className="input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input has-toggle"
                placeholder="Create secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="reg-confirm-password">Confirm Password *</label>
            <input
              id="reg-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* ROLE SPECIFIC FIELDS */}
          {role === 'farmer' && (
            <>
              <div className="form-group">
                <label htmlFor="reg-state">State</label>
                <input
                  id="reg-state"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Haryana"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-district">District</label>
                <input
                  id="reg-district"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Karnal"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-crop">Primary Crop</label>
                <input
                  id="reg-crop"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Wheat, Rice, Mustard"
                  value={primaryCrop}
                  onChange={(e) => setPrimaryCrop(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {role === 'psychiatrist' && (
            <>
              <div className="form-group">
                <label htmlFor="reg-license">Medical / Clinical License Number *</label>
                <input
                  id="reg-license"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. MCI-2023-89472"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-specialization">Specialization (Optional)</label>
                <input
                  id="reg-specialization"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Farmer Distress, Clinical Psychology"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="auth-alert auth-alert-info">
                <span>ℹ️</span>
                <div>
                  <strong>Verification Note:</strong> Psychiatrist accounts require administrative review and license validation before accessing patient consultations.
                </div>
              </div>
            </>
          )}

          {role === 'warehouse_owner' && (
            <>
              <div className="form-group">
                <label htmlFor="reg-company">Company / Warehouse Facility Name *</label>
                <input
                  id="reg-company"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Kisan Agro Cold Storage Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-gstin">GSTIN (Optional)</label>
                <input
                  id="reg-gstin"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. 06AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="auth-alert auth-alert-info">
                <span>ℹ️</span>
                <div>
                  <strong>Verification Note:</strong> Warehouse owner accounts require administrative validation before listing storage units on BhoomiBandhu.
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
