import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import '../../pageStyles/auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const clean = mobile.replace(/\D/g, '').slice(0, 10);
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(clean);
      // Navigate to reset password page with mobile state
      navigate('/reset-password', { state: { mobile: clean } });
    } catch (err) {
      setError(err.message || 'Failed to dispatch password reset code.');
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
          <h1>Password Recovery</h1>
          <p>Enter your registered mobile number to receive a verification code</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="recovery-mobile">Mobile Number</label>
            <input
              id="recovery-mobile"
              type="tel"
              className="auth-input"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
                <span>Sending Code...</span>
              </>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password?{' '}
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
