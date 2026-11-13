import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="auth-page">
      <div className="pending-card" style={{ borderColor: '#f8b4b4' }}>
        <div className="pending-icon">🚫</div>
        <h1 style={{ fontSize: '1.6rem', color: '#9b1c1c', marginBottom: '12px' }}>
          403 — Access Restricted
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
          You do not have permission to access this portal or resource.
          {user && (
            <>
              <br />
              Current logged-in account role: <strong>{user.role}</strong>
            </>
          )}
        </p>

        <div className="auth-alert auth-alert-error" style={{ textAlign: 'left', marginBottom: '24px' }}>
          <span>⚠️</span>
          <div>
            Role-based access control is enforced on BhoomiBandhu. Farmer, Psychiatrist, Storage Owner, and Admin portals are restricted to their authorized roles.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn" style={{ background: 'var(--green)', color: '#fff', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}>
            Go to Home
          </Link>
          <button
            type="button"
            className="btn"
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer' }}
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
