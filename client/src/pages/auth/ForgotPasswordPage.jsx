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
      navigate('/reset-password', { state: { mobile: clean } });
    } catch (err) {
      setError(err.message || 'Failed to dispatch password reset code.');
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
            <h1>Password Recovery</h1>
            <p>Enter your registered mobile number to receive an OTP reset code</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="mobile">10-Digit Mobile Number *</label>
              <input
                id="mobile"
                type="tel"
                className="auth-input"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={isLoading}
                maxLength={10}
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
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                'Send Recovery Code'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Remembered your credentials?{' '}
            <Link to="/login">Back to Sign In</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
