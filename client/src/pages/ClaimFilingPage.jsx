import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initClaimFiling } from '../legacy/claim-filing.js';

export default function ClaimFilingPage() {
  useEffect(() => {
    const pageClass = 'page-claim-filing';
    document.body.classList.add(pageClass);
    initCommon();
    initClaimFiling();
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
              <span>72-Hour Rapid Response Window</span>
            </div>
            <h1 className="farmer-hero-title">Crop Loss Claim Filing Support</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto' }}>
              Step-by-step guidance to file localized disaster insurance claims within the mandatory 72-hour notification timeframe.
            </p>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <span className="section-subtitle">Claim Protocol</span>
          <h2 className="section-title">4-Step Claim Process</h2>
        </div>

        <div className="services-farmer-grid" style={{ marginBottom: '40px' }}>
          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Rule #1</span>
            </div>
            <h3>Intimate Within 72 Hours</h3>
            <p>Notify your insurance company, local agricultural officer, or call Kisan Call Centre 1800-180-1551 immediately after calamity occurs.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Rule #2</span>
            </div>
            <h3>Document Field Evidence</h3>
            <p>Capture clear photographs and video of damaged crops, standing water levels, or hail impact before undertaking clearing work.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Rule #3</span>
            </div>
            <h3>Joint Loss Assessment</h3>
            <p>A surveyor appointed by the state government and insurance provider will inspect your field within 10 days of notification.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Rule #4</span>
            </div>
            <h3>Direct DBT Settlement</h3>
            <p>Claim proceeds are calculated based on yield loss formulas and transferred directly to your Aadhaar-linked bank account.</p>
          </div>
        </div>

        <div className="card" style={{ padding: '36px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.4rem', marginBottom: '12px' }}>Need emergency claim registration assistance?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Submit your crop loss report through our verified portal to dispatch details to regional coordinators.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/insurance" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '8px' }}>
              File Crop Loss Report
            </Link>
            <Link to="/status-tracking" className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '8px' }}>
              Check Filed Claims Status
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
