import React from 'react';
import { Link } from 'react-router-dom';

/* ── Inline SVG Icons (16×16) ── */
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

export default function Footer() {
  return (
    <footer className="farmer-footer" role="contentinfo">
      <div className="container footer-grid">
        {/* Brand Column */}
        <div className="footer-col">
          <div className="footer-brand">
            <img
              src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
              alt="BhoomiBandhu Logo"
              className="footer-logo-img"
            />
            <span className="footer-brand-name">BhoomiBandhu</span>
          </div>
          <p className="footer-desc">
            India's dedicated agricultural intelligence and welfare portal. Providing transparent digital storage discovery, insurance enablement, government scheme access, and AI-powered crop advice for every farmer.
          </p>
          <div className="footer-social">
            <a href="https://agricoop.nic.in" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Official Portal" title="Official Agricultural Portal">
              <IconGlobe />
            </a>
            <a href="tel:18001801551" className="footer-social-link" aria-label="Call Kisan Helpline" title="Toll-Free Kisan Call Centre">
              <IconPhone />
            </a>
            <Link to="/insurance" className="footer-social-link" aria-label="Insurance Shield" title="PMFBY Insurance">
              <IconShield />
            </Link>
          </div>
        </div>

        {/* Core Tools */}
        <div className="footer-col">
          <h4 className="footer-col-title">Core Farmer Tools</h4>
          <ul className="footer-links">
            <li><Link to="/storage">Digital Storage Finder</Link></li>
            <li><Link to="/insurance">Crop Insurance &amp; PMFBY</Link></li>
            <li><Link to="/ml-crop-advisor">ML Crop Recommender</Link></li>
            <li><Link to="/gemini-advisor">AI Agronomic Chat</Link></li>
            <li><Link to="/schemes">Government Schemes</Link></li>
          </ul>
        </div>

        {/* Portals */}
        <div className="footer-col">
          <h4 className="footer-col-title">Portals &amp; Login</h4>
          <ul className="footer-links">
            <li><Link to="/login">Farmer Sign In</Link></li>
            <li><Link to="/register">New Farmer Registration</Link></li>
            <li><Link to="/dashboard">Farmer Dashboard</Link></li>
            <li><Link to="/portal/warehouse">Warehouse Owner Portal</Link></li>
            <li><Link to="/portal/psychiatrist">Clinical Partner Portal</Link></li>
          </ul>
        </div>

        {/* Assistance & Helplines */}
        <div className="footer-col">
          <h4 className="footer-col-title">Assistance &amp; Support</h4>
          <ul className="footer-links">
            <li><Link to="/mental-health">Kisan Mental Well-being</Link></li>
            <li><Link to="/claim-filing">Claim Filing Assistant</Link></li>
            <li><Link to="/risk-awareness">Weather Risk Awareness</Link></li>
            <li><Link to="/status-tracking">Application Tracker</Link></li>
            <li><span className="footer-note">Toll-Free Kisan Call Centre: 1800-180-1551</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-flex">
          <span>&copy; 2026 BhoomiBandhu &middot; Built with pride for Indian Agriculture.</span>
          <span>All government scheme data sourced from official public agricultural portals.</span>
        </div>
      </div>
    </footer>
  );
}
