import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

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
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
          <h1>Welcome Back</h1>
          <p>Sign in to access your farmer tools, records, and services</p>
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
                placeholder="Enter your account password"
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
                {showPassword ? '👁️' : '👁️‍🗨️'}
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
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
