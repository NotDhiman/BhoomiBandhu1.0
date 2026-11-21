import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

const IconClock = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const roleName = user?.role === 'psychiatrist' ? 'Clinical Partner' : 'Warehouse Partner';

  return (
    <div className="auth-page">
      <main className="auth-form-panel" style={{ width: '100%', minHeight: '100vh' }}>
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconClock />
            </div>
          </div>

          <h1 style={{ fontFamily: 'DM Sans', fontSize: '1.6rem', color: 'var(--text, #0f172a)', marginBottom: '12px' }}>
            Verification in Progress
          </h1>

          <p style={{ color: 'var(--text-secondary, #475569)', lineHeight: '1.6', marginBottom: '24px', fontSize: '0.95rem' }}>
            Thank you for registering as a <strong>{roleName}</strong> on BhoomiBandhu.
            Your professional medical license and registration documents are currently being validated by state platform administrators.
          </p>

          <div className="auth-alert auth-alert-info" style={{ textAlign: 'left', marginBottom: '28px', background: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>
            <span>ℹ️</span>
            <div>
              <strong>Review Timeline:</strong><br />
              Credential approvals are typically completed within 24–48 working hours. Once approved, you will have immediate portal access.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <Link to="/" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
              Return to Home
            </Link>
            <button
              type="button"
              className="btn-primary"
              style={{ background: '#ef4444', borderColor: '#ef4444', padding: '10px 20px', borderRadius: '8px' }}
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
