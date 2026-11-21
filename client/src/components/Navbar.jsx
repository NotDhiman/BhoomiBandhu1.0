import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/* ── Inline SVG Icons (16×16, strokeWidth 1.5) ── */
const Icon = ({ children, size = 16, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`nav-svg-icon ${className}`}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const WarehouseIcon = (props) => (
  <Icon {...props}>
    <path d="M3 21V8l9-5 9 5v13" />
    <path d="M9 21V13h6v8" />
    <path d="M3 8h18" />
  </Icon>
);

const ShieldIcon = (props) => (
  <Icon {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Icon>
);

const FileTextIcon = (props) => (
  <Icon {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </Icon>
);

const WalletIcon = (props) => (
  <Icon {...props}>
    <rect x="1" y="5" width="22" height="16" rx="2" ry="2" />
    <path d="M1 10h22" />
    <path d="M17 15h2" />
  </Icon>
);

const CpuIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </Icon>
);

const MessageCircleIcon = (props) => (
  <Icon {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Icon>
);

const HeartIcon = (props) => (
  <Icon {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Icon>
);

const HomeIcon = (props) => (
  <Icon {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

const SunIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </Icon>
);

const MoonIcon = (props) => (
  <Icon {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

const ChevronDownIcon = (props) => (
  <Icon {...props} size={14}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);

const CloseIcon = (props) => (
  <Icon {...props} size={20}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

/* Portal-specific icons */
const SeedlingIcon = (props) => (
  <Icon {...props}>
    <path d="M12 22V10" />
    <path d="M6 13c0-3.31 2.69-6 6-6" />
    <path d="M18 7c0 3.31-2.69 6-6 6" />
    <path d="M6 7a6 6 0 0 1 6 6" />
    <path d="M18 13a6 6 0 0 1-6-6" />
  </Icon>
);

const BrainIcon = (props) => (
  <Icon {...props}>
    <path d="M9.5 2A5.5 5.5 0 0 0 5 9.23V10a2 2 0 0 0 2 2h1v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6h1a2 2 0 0 0 2-2v-.77A5.5 5.5 0 0 0 14.5 2h-5z" />
  </Icon>
);

const LockIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

/* ── Nav link definitions ── */
const NAV_LINKS = [
  { to: '/storage', label: 'Storage', IconComp: WarehouseIcon },
  { to: '/insurance', label: 'Insurance', IconComp: ShieldIcon },
  { to: '/schemes', label: 'Schemes', IconComp: FileTextIcon },
  { to: '/financial', label: 'Financial', IconComp: WalletIcon },
  { to: '/ml-crop-advisor', label: 'ML Crop Advisor', IconComp: CpuIcon },
  { to: '/gemini-advisor', label: 'AI Farmer Chat', IconComp: MessageCircleIcon, isAI: true },
  { to: '/mental-health', label: 'Well-being', IconComp: HeartIcon },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => (typeof document !== 'undefined' ? document.body.classList.contains('dark') : false));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Close mobile drawer when route changes
  const closeMenu = () => setMobileMenuOpen(false);

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
    closeMenu();
    navigate('/login', { replace: true });
  };

  /* Portal link helper — returns role-specific nav item */
  const getPortalLink = (isMobile = false) => {
    if (!user) return null;
    const baseClass = isMobile ? 'mobile-nav-link' : 'nav-link-item';

    if (user.role === 'farmer') {
      return (
        <NavLink
          to="/dashboard"
          onClick={closeMenu}
          className={({ isActive }) => `${baseClass} portal-farmer ${isActive ? 'active' : ''}`}
        >
          <SeedlingIcon />
          <span>My Farm Dashboard</span>
        </NavLink>
      );
    }
    if (user.role === 'psychiatrist') {
      const path = user.profile_details?.is_approved ? '/portal/psychiatrist' : '/pending-approval';
      return (
        <NavLink
          to={path}
          onClick={closeMenu}
          className={({ isActive }) => `${baseClass} portal-psychiatrist ${isActive ? 'active' : ''}`}
        >
          <BrainIcon />
          <span>Clinical Portal</span>
        </NavLink>
      );
    }
    if (user.role === 'warehouse_owner') {
      return (
        <NavLink
          to="/portal/warehouse"
          onClick={closeMenu}
          className={({ isActive }) => `${baseClass} portal-warehouse ${isActive ? 'active' : ''}`}
        >
          <WarehouseIcon />
          <span>Storage Portal</span>
        </NavLink>
      );
    }
    if (user.role === 'admin') {
      return (
        <NavLink
          to="/portal/admin"
          onClick={closeMenu}
          className={({ isActive }) => `${baseClass} portal-admin ${isActive ? 'active' : ''}`}
        >
          <LockIcon />
          <span>Admin</span>
        </NavLink>
      );
    }
    return null;
  };

  /* User initial for avatar circle */
  const userInitial = user?.profile_details?.name
    ? user.profile_details.name.charAt(0).toUpperCase()
    : user?.mobile
      ? user.mobile.charAt(0)
      : '?';

  const displayName = user?.profile_details?.name || user?.mobile;

  return (
    <header className="bb-header" role="banner">
      <div className="container header-flex">
        {/* ── Logo / Brand ── */}
        <Link to="/" className="bb-logo" title="BhoomiBandhu - Home" onClick={closeMenu}>
          <img
            src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
            alt="BhoomiBandhu"
            className="bb-logo-img"
          />
          <div className="bb-brand-text">
            <span className="bb-brand-title">BhoomiBandhu</span>
            <span className="bb-brand-tag">Kisan Mitra</span>
          </div>
        </Link>

        {/* ── Desktop Navigation Links ── */}
        <nav className="bb-nav" aria-label="Main Navigation">
          {NAV_LINKS.map(({ to, label, IconComp, isAI }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link-item${isAI ? ' nav-ai-item' : ''}${isActive ? ' active' : ''}`
              }
            >
              {isAI && <span className="nav-live-dot" aria-hidden="true" />}
              <IconComp />
              <span>{label}</span>
            </NavLink>
          ))}

          {getPortalLink(false)}

          {/* ── Controls: Auth & Theme ── */}
          <div className="bb-nav-actions">
            {isAuthenticated ? (
              <div className="bb-user-pill">
                <span className="bb-user-avatar" aria-hidden="true">{userInitial}</span>
                <span className="bb-user-name" title={displayName}>
                  {displayName}
                </span>
                <ChevronDownIcon />
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
                  <span>Get Started</span>
                  <span className="bb-btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            )}

            <button
              type="button"
              className="bb-theme-btn"
              onClick={handleToggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </nav>

        {/* ── Mobile Header Controls ── */}
        <div className="bb-mobile-controls">
          <button
            type="button"
            className="bb-theme-btn"
            onClick={handleToggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className={`bb-hamburger-btn${mobileMenuOpen ? ' open' : ''}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </div>

      {/* ── Mobile Backdrop ── */}
      {mobileMenuOpen && (
        <div
          className="bb-mobile-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Navigation Drawer ── */}
      <div
        className={`bb-mobile-drawer${mobileMenuOpen ? ' drawer-open' : ''}`}
        role="dialog"
        aria-label="Mobile Navigation"
      >
        <div className="bb-mobile-drawer-header">
          <div className="bb-brand-text">
            <span className="bb-brand-title">BhoomiBandhu</span>
            <span className="bb-brand-tag">Kisan Mitra</span>
          </div>
          <button
            type="button"
            className="bb-drawer-close-btn"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="bb-mobile-drawer-body">
          {isAuthenticated ? (
            <div className="mobile-user-card">
              <div className="mobile-user-info">
                <span className="bb-user-avatar" aria-hidden="true">{userInitial}</span>
                <div>
                  <div className="mobile-user-name">
                    {user?.profile_details?.name || 'Farmer Member'}
                  </div>
                  <div className="mobile-user-role">
                    {user?.role === 'farmer' ? 'Verified Farmer' : user?.role}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="bb-logout-btn mobile-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="mobile-auth-actions">
              <Link to="/login" className="bb-signin-btn mobile-btn" onClick={closeMenu}>
                Sign In
              </Link>
              <Link to="/register" className="bb-register-btn mobile-btn" onClick={closeMenu}>
                Get Started
              </Link>
            </div>
          )}

          <div className="mobile-nav-group-title">Primary Services</div>
          <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>
            <HomeIcon />
            <span>Home</span>
          </NavLink>
          {NAV_LINKS.map(({ to, label, IconComp, isAI }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `mobile-nav-link${isAI ? ' mobile-ai-link' : ''}${isActive ? ' active' : ''}`
              }
            >
              {isAI && <span className="nav-live-dot" aria-hidden="true" />}
              <IconComp />
              <span>{label}</span>
            </NavLink>
          ))}

          {user && (
            <>
              <div className="mobile-nav-group-title">Portals</div>
              {getPortalLink(true)}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
