import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import '../../pageStyles/auth.css';

/* â”€â”€ Modern Inline SVG Icons â”€â”€ */
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState(location.state?.mobile || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.replace(/\D/g, '').slice(0, 10);
    if (cleanMobile.length !== 10) {
      setError('Mobile number must be 10 digits.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (!/\d|[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError('New password must contain at least one digit or special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(cleanMobile, otpCode.trim(), newPassword);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-form-panel" style={{ width: '100%', minHeight: '100vh' }}>
        <div className="auth-container">
          <div className="auth-header">
            <Link to="/" className="auth-logo-inline">
              <img
                src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
                alt="BhoomiBandhu"
              />
              <span className="brand-name">BhoomiBandhu</span>
            </Link>
            <h1>Reset Your Password</h1>
            <p>Enter the 6-digit OTP code received on your phone along with your new password</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontFamily: 'DM Sans', fontSize: '1.4rem', color: '#0d9488', marginBottom: '10px' }}>
                Password Updated Successfully
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Your account password has been updated. You can now sign in with your new credentials.
              </p>
              <Link to="/login" className="auth-submit-btn" style={{ display: 'block', textDecoration: 'none' }}>
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number</label>
                <input
                  id="mobile"
                  type="tel"
                  className="auth-input"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={isLoading}
                  maxLength={10}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="otpCode">6-Digit Verification Code</label>
                <input
                  id="otpCode"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={isLoading}
                  maxLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password (Min. 8 characters)</label>
                <div className="input-wrapper">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input has-toggle"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  'Save New Password'
                )}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <Link to="/login">Back to Sign In</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
