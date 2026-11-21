import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

/* â”€â”€ Modern Inline SVG Icons â”€â”€ */
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
);
const IconWarehouse = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z"/><path d="M6 18h12"/></svg>
);
const IconCpu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/></svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your mobile number or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(cleanId, password);

      // Determine appropriate redirect based on intended route or user role
      const intendedDestination = location.state?.from?.pathname;
      if (intendedDestination && intendedDestination !== '/login' && intendedDestination !== '/register') {
        navigate(intendedDestination, { replace: true });
        return;
      }

      // Role-aware default destination
      if (user.role === 'psychiatrist') {
        if (user.profile_details?.is_approved) {
          navigate('/portal/psychiatrist', { replace: true });
        } else {
          navigate('/pending-approval', { replace: true });
        }
      } else if (user.role === 'warehouse_owner') {
        navigate('/portal/warehouse', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/portal/admin', { replace: true });
      } else {
        // Farmer default
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative Brand Showcase Panel (Desktop) */}
      <aside className="auth-deco-panel" aria-hidden="true">
        <div className="deco-shape deco-shape--1" />
        <div className="deco-shape deco-shape--2" />
        <div className="deco-shape deco-shape--3" />

        <div className="deco-brand">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <img
              src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
              alt="BhoomiBandhu"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'DM Sans', color: '#ffffff' }}>
              BhoomiBandhu
            </span>
          </Link>
          <h2>Empowering Indian Agriculture with Intelligent Tech</h2>
          <p>
            One unified digital gateway for subsidized cold storage discovery, crop insurance enablement, and real-time AI farm advice.
          </p>
        </div>

        <div className="deco-features">
          <div className="deco-feature">
            <div className="deco-feature-icon">
              <IconWarehouse />
            </div>
            <span>Verified Rural Cold Storages & Warehouses</span>
          </div>
          <div className="deco-feature">
            <div className="deco-feature-icon">
              <IconShield />
            </div>
            <span>Fast-Track PMFBY Loss Claim Filing</span>
          </div>
          <div className="deco-feature">
            <div className="deco-feature-icon">
              <IconCpu />
            </div>
            <span>24/7 Multilingual AI Agricultural Advice</span>
          </div>
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="auth-form-panel">
        <div className="auth-container">
          <div className="auth-header">
            <Link to="/" className="auth-logo-inline">
              <img
                src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
                alt="BhoomiBandhu"
              />
              <span className="brand-name">BhoomiBandhu</span>
            </Link>
            <h1>Welcome Back</h1>
            <p>Sign in to access your farm dashboard, bookings, and tools</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="identifier">Mobile Number or Email</label>
              <input
                id="identifier"
                type="text"
                className="auth-input"
                placeholder="e.g. 9876543210 or name@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="auth-inline-link">
                  Forgot Password?
                </Link>
              </div>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input has-toggle"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In to BhoomiBandhu'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account yet?{' '}
            <Link to="/register">Register as Farmer or Partner</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
