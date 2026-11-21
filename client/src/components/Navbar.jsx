import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => (typeof document !== 'undefined' ? document.body.classList.contains('dark') : false));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleToggleTheme = (e) => {
    e.preventDefault();
    if (typeof window.toggleTheme === 'function') {
      window.toggleTheme();
    } else {
      document.body.classList.toggle('dark');
    }
    setIsDark(document.body.classList.contains('dark'));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getPortalLink = () => {
    if (!user) return null;
    if (user.role === 'farmer') {
      return (
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link-item portal-farmer ${isActive ? 'active' : ''}`}
        >
          🌾 Dashboard
        </NavLink>
      );
    }
    if (user.role === 'psychiatrist') {
      const path = user.profile_details?.is_approved ? '/portal/psychiatrist' : '/pending-approval';
      return (
        <NavLink
          to={path}
          className={({ isActive }) => `nav-link-item portal-psychiatrist ${isActive ? 'active' : ''}`}
        >
          🧠 Clinical Portal
        </NavLink>
      );
    }
    if (user.role === 'warehouse_owner') {
      return (
        <NavLink
          to="/portal/warehouse"
          className={({ isActive }) => `nav-link-item portal-warehouse ${isActive ? 'active' : ''}`}
        >
          🏬 Storage Portal
        </NavLink>
      );
    }
    if (user.role === 'admin') {
      return (
        <NavLink
          to="/portal/admin"
          className={({ isActive }) => `nav-link-item portal-admin ${isActive ? 'active' : ''}`}
        >
          🔒 Admin
        </NavLink>
      );
    }
    return null;
  };

  return (
    <header className="bb-header">
      <div className="bb-header-accent" />
      <div className="container header-flex">
        <Link to="/" className="bb-logo" title="BhoomiBandhu - Home">
          <img
            src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
            alt="BhoomiBandhu Logo"
            className="bb-logo-img"
          />
          <div className="bb-brand-text">
            <span className="bb-brand-title">BhoomiBandhu</span>
            <span className="bb-brand-tag">🌱 Kisan Mitra</span>
          </div>
        </Link>

        <nav className="bb-nav">
          <NavLink
            to="/storage"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            Storage
          </NavLink>
          <NavLink
            to="/insurance"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            Insurance
          </NavLink>
          <NavLink
            to="/schemes"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            Schemes
          </NavLink>
          <NavLink
            to="/financial"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            Financial
          </NavLink>
          <NavLink
            to="/ml-crop-advisor"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            🤖 ML Advisor
          </NavLink>
          <NavLink
            to="/gemini-advisor"
            className={({ isActive }) => `nav-link-item nav-ai-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-live-dot" />
            💬 AI Chat
          </NavLink>
          <NavLink
            to="/mental-health"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            Mental Health
          </NavLink>

          {getPortalLink()}

          <div className="bb-nav-actions">
            {isAuthenticated ? (
              <div className="bb-user-pill">
                <span className="bb-user-avatar">👤</span>
                <span className="bb-user-name" title={user?.profile_details?.name || user?.mobile}>
                  {user?.profile_details?.name || user?.mobile}
                </span>
                <button
                  type="button"
                  className="bb-logout-btn"
                  onClick={handleLogout}
                  title="Sign out of BhoomiBandhu"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="bb-auth-btns">
                <Link to="/login" className="bb-signin-btn">
                  Sign In
                </Link>
                <Link to="/register" className="bb-register-btn">
                  <span>Register</span>
                  <span className="bb-btn-arrow">→</span>
                </Link>
              </div>
            )}

            <button
              type="button"
              className="bb-theme-btn"
              onClick={handleToggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark/Light Mode"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
