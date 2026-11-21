import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

const IconShieldAlert = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="auth-page">
      <main className="auth-form-panel" style={{ width: '100%', minHeight: '100vh' }}>
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconShieldAlert />
            </div>
          </div>

          <h1 style={{ fontFamily: 'DM Sans', fontSize: '1.6rem', color: '#b91c1c', marginBottom: '12px' }}>
            Access Restricted (403)
          </h1>

          <p style={{ color: 'var(--text-secondary, #475569)', lineHeight: '1.6', marginBottom: '24px', fontSize: '0.95rem' }}>
            You do not have administrative authorization to access this protected area.
            {user && (
              <>
                <br />
                Logged in account: <strong>{user.profile_details?.name || user.mobile}</strong> (Role: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{user.role}</code>)
              </>
            )}
          </p>

          <div className="auth-alert auth-alert-error" style={{ textAlign: 'left', marginBottom: '28px' }}>
            <span>⚠️</span>
            <div>
              Platform security enforces strict role isolation across Farmer, Warehouse Partner, Clinical Partner, and Administrator portals.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <Link to="/" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
              Return to Homepage
            </Link>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '10px 20px', borderRadius: '8px' }}
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
