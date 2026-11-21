import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initInsurance } from '../legacy/insurance.js';

/* â”€â”€ Modern Inline SVG Icons â”€â”€ */
const IconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
);
const IconFileCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
);
const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const IconFilePlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
);
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
);
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
);

export default function InsurancePage() {
  useEffect(() => {
    const pageClass = 'page-insurance';
    document.body.classList.add(pageClass);
    initCommon();
    initInsurance();
    return () => document.body.classList.remove(pageClass);
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero Header */}
      <section className="farmer-hero-section">
        <div className="container hero-container" style={{ padding: '60px 20px 40px' }}>
          <div className="farmer-hero-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div className="hero-kicker-pill" style={{ margin: '0 auto 16px' }}>
              <span className="kicker-pulse" aria-hidden="true" />
              <span>Pradhan Mantri Fasal Bima Yojana (PMFBY) Partner Desk</span>
            </div>
            <h1 className="farmer-hero-title" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)' }}>
              Crop Insurance & Disaster Loss Protection
            </h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto 24px' }}>
              Safeguard your farming livelihood against drought, floods, hailstorms, unseasonal rain, and localized pest epidemics with official government insurance support.
            </p>
          </div>
        </div>
      </section>

      {/* Why Insurance Matters Overview */}
      <section className="section container" style={{ paddingTop: '20px' }}>
        <div className="card" style={{ padding: '32px 36px', borderLeft: '5px solid #0d9488', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'DM Sans', fontSize: '1.45rem', marginBottom: '12px' }}>Why Comprehensive Crop Insurance Matters</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem' }}>
            Unpredictable monsoons and climate variations can wipe out an entire season’s investment within hours. Under government PMFBY guidelines, farmers pay a nominal premium of just <strong>1.5% to 2%</strong>, while the central and state governments subsidize the rest. Crop insurance ensures you recover without falling prey to unorganized debt traps.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="section-head">
          <span className="section-subtitle">Dedicated Services</span>
          <h2 className="section-title">Insurance Support Hub</h2>
        </div>

        <div className="services-farmer-grid" style={{ marginBottom: '50px' }}>
          <Link to="/pmfby-enrollment" className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>
                <IconFileCheck />
              </div>
              <span className="service-badge">Kharif & Rabi</span>
            </div>
            <h3>PMFBY Enrollment</h3>
            <p>Step-by-step assistance in submitting your land revenue records, crop survey details, and sowing certificates.</p>
            <div className="service-card-action">
              <span>Enroll Now</span>
              <span className="card-arrow"><IconArrowRight /></span>
            </div>
          </Link>

          <Link to="/risk-awareness" className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <IconAlertTriangle />
              </div>
              <span className="service-badge">Early Warning</span>
            </div>
            <h3>Weather Risk Awareness</h3>
            <p>Understand localized risks, claim eligibility windows (72-hour notification rule), and preventive advisories.</p>
            <div className="service-card-action">
              <span>View Risk Guide</span>
              <span className="card-arrow"><IconArrowRight /></span>
            </div>
          </Link>

          <Link to="/claim-filing" className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <IconFilePlus />
              </div>
              <span className="service-badge">Fast Track</span>
            </div>
            <h3>Loss Claim Filing</h3>
            <p>Immediate digital guidance to report crop damage, schedule loss assessment surveys, and upload geo-tagged photos.</p>
            <div className="service-card-action">
              <span>File a Claim</span>
              <span className="card-arrow"><IconArrowRight /></span>
            </div>
          </Link>

          <Link to="/status-tracking" className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <IconSearch />
              </div>
              <span className="service-badge">Live Updates</span>
            </div>
            <h3>Status Tracking</h3>
            <p>Check the live processing status of your registered insurance claims and subsidy disbursement using mobile number.</p>
            <div className="service-card-action">
              <span>Track Claims</span>
              <span className="card-arrow"><IconArrowRight /></span>
            </div>
          </Link>
        </div>

        {/* Application / Claim Support Form */}
        <div className="card" style={{ padding: '40px', maxWidth: '820px', margin: '0 auto', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontFamily: 'DM Sans', fontSize: '1.65rem', marginBottom: '8px' }}>Direct Insurance Support & Loss Notification</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Submit your requirements to notify the district agricultural insurance officer</p>
          </div>

          <form id="insuranceForm" noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div className="form-group">
                <label htmlFor="farmerName">Farmer Full Name *</label>
                <input type="text" id="farmerName" className="auth-input" placeholder="e.g. Ramesh Singh" required />
              </div>
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input type="tel" id="mobile" className="auth-input" placeholder="e.g. 9876543210" pattern="[0-9+() -]{7,20}" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginTop: '16px' }}>
              <div className="form-group">
                <label htmlFor="district">District / Block *</label>
                <input type="text" id="district" className="auth-input" placeholder="e.g. Karnal, Rohtak" required />
              </div>
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select id="state" className="auth-input" required>
                  <option value="">Select State</option>
                  <option>Haryana</option>
                  <option>Punjab</option>
                  <option>Uttar Pradesh</option>
                  <option>Rajasthan</option>
                  <option>Bihar</option>
                  <option>Madhya Pradesh</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginTop: '16px' }}>
              <div className="form-group">
                <label htmlFor="crop">Cultivated Crop *</label>
                <input type="text" id="crop" className="auth-input" placeholder="e.g. Wheat, Paddy, Mustard" required />
              </div>
              <div className="form-group">
                <label htmlFor="requestType">Support Category *</label>
                <select id="requestType" className="auth-input" required>
                  <option value="">Select Request Type</option>
                  <option>New Insurance Enrollment</option>
                  <option>Crop Loss Claim</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="issue">Crop Damage Details / Insurance Query *</label>
              <textarea
                id="issue"
                className="auth-input"
                style={{ minHeight: '110px', resize: 'vertical' }}
                placeholder="Describe the nature of crop damage (e.g. heavy hailstorm on 20th Oct, estimated 60% loss in wheat field) or your policy enrollment question."
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '10px' }}>
              Submit Insurance Request
            </button>
            <p id="insuranceMessage" style={{ marginTop: '18px', fontWeight: '600', textAlign: 'center' }}></p>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}
