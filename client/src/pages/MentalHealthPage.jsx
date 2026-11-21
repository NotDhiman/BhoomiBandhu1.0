import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initMentalHealth } from '../legacy/mental-health.js';

/* â”€â”€ Modern Inline SVG Icons â”€â”€ */
const IconHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>
);
const IconPhoneCall = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94m-1 7.98v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
);

export default function MentalHealthPage() {
  useEffect(() => {
    const pageClass = 'page-mental-health';
    document.body.classList.add(pageClass);
    initCommon();
    initMentalHealth();
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
              <span>Confidential 24/7 Farmer Well-Being Network</span>
            </div>
            <h1 className="farmer-hero-title">Kisan Mental Well-Being & Support</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto 24px' }}>
              Because farmers matter beyond the crop. Free, respectful, and 100% confidential emotional assistance during financial or seasonal stress.
            </p>
            <div className="hero-trust-bar" style={{ justifyContent: 'center' }}>
              <div className="trust-item">
                <span className="trust-icon">🤝</span>
                <span><strong>100%</strong> Free & Confidential</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">📞</span>
                <span><strong>Tele-MANAS</strong> Government Helpline (14416)</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🧑‍⚕️</span>
                <span><strong>Licensed</strong> Clinical Partners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="card" style={{ padding: '32px 36px', borderLeft: '5px solid #0d9488', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'DM Sans', fontSize: '1.45rem', marginBottom: '12px' }}>You Are Not Alone in Tough Seasons</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem' }}>
            Farming is one of the most demanding vocations on earth. When droughts hit, pest infestations strike, or debt obligations mount, the mental toll can feel overwhelming. Speaking with someone who understands agricultural realities provides perspective, relieves acute anxiety, and helps you formulate practical recovery steps.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="services-farmer-grid" style={{ marginBottom: '48px' }}>
          <div className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>
                <IconHeart />
              </div>
              <span className="service-badge">Anxiety Care</span>
            </div>
            <h3>Stress & Anxiety Relief</h3>
            <p>Practical breathing techniques, grounding exercises, and actionable counseling to de-escalate crisis panic caused by crop damage.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <IconPhoneCall />
              </div>
              <span className="service-badge">24/7 Toll-Free</span>
            </div>
            <h3>National Helplines</h3>
            <p>Immediate phone connection with counselors fluent in your local dialect through official national mental health missions.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <IconUsers />
              </div>
              <span className="service-badge">Peer Circles</span>
            </div>
            <h3>Community Support Circles</h3>
            <p>Peer-to-peer farmer forums to discuss mutual challenges, shared experiences, and debt resolution without shame or judgment.</p>
          </div>
        </div>

        {/* 2-Column Section: Helplines & Confidential Contact Form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Direct Toll-Free Numbers */}
          <div className="card" style={{ padding: '36px', borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.35rem', marginBottom: '16px' }}>📞 Immediate Emergency Helplines</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
              <li style={{ padding: '14px', background: 'var(--bg-soft)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>National Tele-Mental Health Assistance (Tele-MANAS)</div>
                <strong style={{ fontSize: '1.25rem', color: '#0d9488' }}>14416 (Toll-Free, 24/7)</strong>
              </li>
              <li style={{ padding: '14px', background: 'var(--bg-soft)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kisan Call Centre (Ministry of Agriculture)</div>
                <strong style={{ fontSize: '1.25rem', color: '#0d9488' }}>1800-180-1551 (6 AM – 10 PM)</strong>
              </li>
              <li style={{ padding: '14px', background: 'var(--bg-soft)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>KIRAN Mental Health Support Helpline</div>
                <strong style={{ fontSize: '1.25rem', color: '#0d9488' }}>1800-599-0019</strong>
              </li>
            </ul>
            <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              All calls are 100% free of charge and strictly anonymous.
            </p>
          </div>

          {/* Confidential Counselor Request Form */}
          <div className="card" style={{ padding: '36px', borderTop: '4px solid #0d9488' }}>
            <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.35rem', marginBottom: '16px' }}>🧑‍⚕️ Request Counselor Callback</h3>
            <form id="mentalContactForm" noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label htmlFor="mhName">Your Name *</label>
                  <input type="text" id="mhName" className="auth-input" placeholder="e.g. Gurpreet" required />
                </div>
                <div className="form-group">
                  <label htmlFor="mhPhone">Mobile Number *</label>
                  <input type="tel" id="mhPhone" className="auth-input" placeholder="e.g. 9876543210" required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="mhIssue">Primary Concern *</label>
                <select id="mhIssue" className="auth-input" required>
                  <option value="">Select Topic</option>
                  <option>Stress & Anxiety</option>
                  <option>Financial & Debt Pressure</option>
                  <option>Crop Loss Sadness</option>
                  <option>Family or Personal Strain</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="mhMessage">Brief Note (Optional)</label>
                <textarea
                  id="mhMessage"
                  className="auth-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Tell us what you are experiencing, whenever you are comfortable."
                ></textarea>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>
                Request Confidential Callback
              </button>
              <p id="mhResult" style={{ marginTop: '16px', fontWeight: '600', textAlign: 'center' }}></p>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
