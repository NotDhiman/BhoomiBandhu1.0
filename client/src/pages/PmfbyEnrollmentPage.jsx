import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initPmfbyEnrollment } from '../legacy/pmfby-enrollment.js';

export default function PmfbyEnrollmentPage() {
  useEffect(() => {
    const pageClass = 'page-pmfby-enrollment';
    document.body.classList.add(pageClass);
    initCommon();
    initPmfbyEnrollment();
    return () => document.body.classList.remove(pageClass);
  }, []);

  return (
    <>
      <Navbar />

      <section className="farmer-hero-section">
        <div className="container hero-container" style={{ padding: '60px 20px 40px', textAlign: 'center' }}>
          <div className="farmer-hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="hero-kicker-pill" style={{ margin: '0 auto 16px' }}>
              <span className="kicker-pulse" aria-hidden="true" />
              <span>Official Scheme Enrollment Guide</span>
            </div>
            <h1 className="farmer-hero-title">PMFBY Enrollment Guide</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto' }}>
              Simple, step-by-step procedure to secure Pradhan Mantri Fasal Bima Yojana protection with subsidized premiums.
            </p>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <span className="section-subtitle">How We Support You</span>
          <h2 className="section-title">What We Help With</h2>
        </div>

        <div className="services-farmer-grid" style={{ marginBottom: '40px' }}>
          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Step 1</span>
            </div>
            <h3>Eligibility Verification</h3>
            <p>Verification of notified village/taluk status, crop season validity, and loan linkage via Kisan Credit Card.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Step 2</span>
            </div>
            <h3>Land & Crop Records</h3>
            <p>Assistance in aligning your Khasra / Khatoni land records with current season sowing declarations.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Step 3</span>
            </div>
            <h3>Premium Calculator</h3>
            <p>Calculate your exact farmer share: only 2% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial crops.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Step 4</span>
            </div>
            <h3>Application Submission</h3>
            <p>Direct submission guidance through CSC centers or the official pmfby.gov.in portal with instant policy receipt.</p>
          </div>
        </div>

        <div className="card" style={{ padding: '36px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.4rem', marginBottom: '12px' }}>Ready to enroll or need claim support?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Our agricultural team provides free guidance for all small and marginal farmers across state districts.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/insurance" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '8px' }}>
              Open Insurance Request Form
            </Link>
            <Link to="/status-tracking" className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '8px' }}>
              Track Existing Application
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
