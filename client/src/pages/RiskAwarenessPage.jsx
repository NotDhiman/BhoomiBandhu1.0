import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initRiskAwareness } from '../legacy/risk-awareness.js';

export default function RiskAwarenessPage() {
  useEffect(() => {
    const pageClass = 'page-risk-awareness';
    document.body.classList.add(pageClass);
    initCommon();
    initRiskAwareness();
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
              <span>Climate & Environmental Risk Shield</span>
            </div>
            <h1 className="farmer-hero-title">Agricultural Risk & Weather Advisory</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto' }}>
              Understanding crop risks, seasonal vulnerabilities, and insurance coverage stages from pre-sowing to post-harvest.
            </p>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <span className="section-subtitle">Risk Protection Scope</span>
          <h2 className="section-title">What Risks Are Covered?</h2>
        </div>

        <div className="services-farmer-grid" style={{ marginBottom: '40px' }}>
          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Stage 1</span>
            </div>
            <h3>Prevented Sowing / Planting</h3>
            <p>Protection up to 25% of sum insured if major deficit in rainfall or adverse seasonal conditions prevent sowing.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Stage 2</span>
            </div>
            <h3>Standing Crop Mid-Season Loss</h3>
            <p>Comprehensive yield loss coverage against droughts, dry spells, widespread flood inundation, pests, and plant diseases.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Stage 3</span>
            </div>
            <h3>Localized Calamities</h3>
            <p>Individual farm loss assessment for hailstorms, landslides, cloudbursts, and excess water inundation.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <span className="service-badge">Stage 4</span>
            </div>
            <h3>Post-Harvest Storage Losses</h3>
            <p>Coverage for up to 14 days after harvest for crops kept in ‘cut and spread’ condition in the field against cyclones and unseasonal rains.</p>
          </div>
        </div>

        <div className="card" style={{ padding: '36px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.4rem', marginBottom: '12px' }}>Protect your farm against sudden weather events</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Check scheme deadlines for the current Kharif and Rabi cycles to ensure your crops remain fully protected.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/insurance" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '8px' }}>
              Enroll in Crop Insurance
            </Link>
            <Link to="/ml-crop-advisor" className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '8px' }}>
              AI Weather-Resilient Crop Matching
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
