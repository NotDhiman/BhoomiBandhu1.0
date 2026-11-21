import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import '../../pageStyles/auth.css';

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
      setError(err.message || 'Failed to reset password. Please check your OTP code.');
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
          <h1>Set New Password</h1>
          <p>Enter the code sent to your mobile phone to reset your password</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {isSuccess ? (
          <div>
            <div className="auth-alert auth-alert-success" role="alert">
              <span>✓</span>
              <div>
                <strong>Password Reset Successfully!</strong><br />
                All previous sessions have been revoked. You can now sign in with your new password.
              </div>
            </div>
            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => navigate('/login', { replace: true })}
            >
              Sign In to Your Account
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="reset-mobile">Mobile Number</label>
              <input
                id="reset-mobile"
                type="tel"
                className="auth-input"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reset-otp">6-Digit Verification Code</label>
              <input
                id="reset-otp"
                type="text"
                className="auth-input"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reset-new-password">New Password</label>
              <div className="input-wrapper">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input has-toggle"
                  placeholder="At least 8 characters"
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
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password">Confirm New Password</label>
              <input
                id="reset-confirm-password"
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
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Back to{' '}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
