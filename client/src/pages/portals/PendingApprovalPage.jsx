import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const roleName = user?.role === 'psychiatrist' ? 'Psychiatrist' : 'Warehouse Owner';

  return (
    <div className="auth-page">
      <div className="pending-card">
        <div className="pending-icon">⏳</div>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--text)', marginBottom: '12px' }}>
          Account Pending Administrative Approval
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
          Thank you for registering as a <strong>{roleName}</strong> on BhoomiBandhu.
          Your application and license/business credentials have been safely received and are undergoing verification by platform administrators.
        </p>

        <div className="auth-alert auth-alert-info" style={{ textAlign: 'left', marginBottom: '24px' }}>
          <span>ℹ️</span>
          <div>
            <strong>What happens next?</strong><br />
            Our team verifies medical licenses and warehouse GSTIN certificates within 24–48 hours.
            Once approved, you will have full access to consultation and facility listing services.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn" style={{ background: 'var(--bg-soft)', color: 'var(--text)', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}>
            Back to Home
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
