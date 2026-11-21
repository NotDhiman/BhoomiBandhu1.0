import React from 'react';
import { Link } from 'react-router-dom';

/* ── Inline SVG Icons (18×18) ── */
const Icon = ({ children, size = 18 }) => (
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
    aria-hidden="true"
  >
    {children}
  </svg>
);

const GlobeIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Icon>
);

const MailIcon = () => (
  <Icon>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </Icon>
);

const PhoneIcon = () => (
  <Icon>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

const HeartIcon = () => (
  <Icon size={14}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Icon>
);

export default function Footer() {
  return (
    <footer className="bb-footer" role="contentinfo">
      <div className="container bb-footer-grid">
        {/* ── Brand Column ── */}
        <div className="bb-footer-col bb-footer-brand-col">
          <div className="bb-footer-brand">
            <img
              src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
              alt="BhoomiBandhu Logo"
              className="bb-footer-logo-img"
            />
            <span className="bb-footer-brand-name">BhoomiBandhu</span>
          </div>
          <p className="bb-footer-desc">
            India's dedicated agricultural intelligence and welfare portal. Transparent digital storage,
            insurance enablement, government scheme access, and AI-powered crop advisory for every farmer.
          </p>
          <div className="bb-footer-social">
            <a href="#" className="bb-footer-social-link" aria-label="Website" title="Website">
              <GlobeIcon />
            </a>
            <a href="#" className="bb-footer-social-link" aria-label="Email" title="Email">
              <MailIcon />
            </a>
            <a href="#" className="bb-footer-social-link" aria-label="Helpline" title="Helpline">
              <PhoneIcon />
            </a>
          </div>
        </div>

        {/* ── Core Tools ── */}
        <div className="bb-footer-col">
          <h4 className="bb-footer-col-title">Core Tools</h4>
          <ul className="bb-footer-links">
            <li><Link to="/storage">Digital Storage Finder</Link></li>
            <li><Link to="/insurance">Crop Insurance &amp; PMFBY</Link></li>
            <li><Link to="/ml-crop-advisor">ML Crop Recommender</Link></li>
            <li><Link to="/gemini-advisor">AI Agronomic Chat</Link></li>
            <li><Link to="/schemes">Government Schemes</Link></li>
          </ul>
        </div>

        {/* ── Portals ── */}
        <div className="bb-footer-col">
          <h4 className="bb-footer-col-title">Portals</h4>
          <ul className="bb-footer-links">
            <li><Link to="/login">Farmer Sign In</Link></li>
            <li><Link to="/register">New Farmer Registration</Link></li>
            <li><Link to="/dashboard">Farmer Dashboard</Link></li>
            <li><Link to="/portal/warehouse">Warehouse Owner Portal</Link></li>
            <li><Link to="/portal/psychiatrist">Clinical Partner Portal</Link></li>
          </ul>
        </div>

        {/* ── Support ── */}
        <div className="bb-footer-col">
          <h4 className="bb-footer-col-title">Support</h4>
          <ul className="bb-footer-links">
            <li><Link to="/mental-health">Kisan Mental Well-being</Link></li>
            <li><Link to="/claim-filing">Claim Filing Assistant</Link></li>
            <li><Link to="/risk-awareness">Weather Risk Awareness</Link></li>
            <li><Link to="/financial">KCC Loan Guide</Link></li>
            <li><span className="bb-footer-note">Hindi, English &amp; regional languages</span></li>
          </ul>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="bb-footer-bottom">
        <div className="container bb-footer-bottom-flex">
          <span className="bb-footer-copyright">
            &copy; {new Date().getFullYear()} BhoomiBandhu &middot; Built with <HeartIcon /> for Indian Agriculture.
          </span>
          <span className="bb-footer-disclaimer">
            Scheme data sourced from official government portals.
          </span>
        </div>
      </div>
    </footer>
  );
}
