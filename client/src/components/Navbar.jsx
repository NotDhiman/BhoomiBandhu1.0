import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getPortalLink = () => {
    if (!user) return null;
    if (user.role === 'farmer') {
      return <Link to="/dashboard" style={{ fontWeight: '600', color: 'var(--green)' }}>🌾 Dashboard</Link>;
    }
    if (user.role === 'psychiatrist') {
      const path = user.profile_details?.is_approved ? '/portal/psychiatrist' : '/pending-approval';
      return <Link to={path} style={{ fontWeight: '600', color: '#7e22ce' }}>🧠 Clinical Portal</Link>;
    }
    if (user.role === 'warehouse_owner') {
      const path = user.profile_details?.is_approved ? '/portal/warehouse' : '/pending-approval';
      return <Link to={path} style={{ fontWeight: '600', color: '#d97706' }}>🏬 Storage Portal</Link>;
    }
    if (user.role === 'admin') {
      return <Link to="/portal/admin" style={{ fontWeight: '600', color: '#dc2626' }}>🔒 Admin</Link>;
    }
    return null;
  };

  return (
    <header>
      <div className="container header-flex">
        <Link to="/" className="logo">
          <img
            src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
            alt="BhoomiBandhu"
          />
          <span>BhoomiBandhu</span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <Link to="/storage">Storage</Link>
          <Link to="/insurance">Insurance</Link>
          <Link to="/schemes">Schemes</Link>
          <Link to="/financial">Financial</Link>
          <Link to="/ml-crop-advisor">🤖 ML Advisor</Link>
          <Link to="/gemini-advisor" style={{ color: 'var(--green)', fontWeight: '700' }}>💬 AI Chat</Link>
          <Link to="/mental-health">Mental Health</Link>

          {getPortalLink()}

          {isAuthenticated ? (
            <div className="user-menu-pill" style={{ marginLeft: '12px' }}>
              <span>👤 {user.profile_details?.name || user.mobile}</span>
              <button
                type="button"
                className="user-logout-btn"
                onClick={handleLogout}
                title="Sign out of BhoomiBandhu"
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'inline-flex', gap: '10px', marginLeft: '12px' }}>
              <Link
                to="/login"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'var(--bg-soft)',
                  fontWeight: '600',
                  color: 'var(--green)',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'var(--green)',
                  color: '#ffffff',
                  fontWeight: '600',
                }}
              >
                Register
              </Link>
            </div>
          )}

          <a href="#" onClick={(e) => { e.preventDefault(); window.toggleTheme?.(); }} title="Toggle Dark/Light Mode">
            🌙
          </a>
        </nav>
      </div>
    </header>
  );
}
