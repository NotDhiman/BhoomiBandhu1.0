import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initStatusTracking } from '../legacy/status-tracking.js';

export default function StatusTrackingPage() {
  useEffect(() => {
    const pageClass = 'page-status-tracking';
    document.body.classList.add(pageClass);
    initCommon();
    initStatusTracking();
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
              <span>Real-Time Government Application Registry</span>
            </div>
            <h1 className="farmer-hero-title">Track Claims & Applications</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto' }}>
              Enter your registered 10-digit mobile number to view the live status of insurance claims, scheme inquiries, and warehouse bookings.
            </p>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto 40px', padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <form id="statusLookupForm">
            <div className="form-group">
              <label htmlFor="trackingMobile" style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Registered Mobile Number
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="tel"
                  id="trackingMobile"
                  className="auth-input"
                  style={{ flex: '1', minWidth: '220px' }}
                  placeholder="e.g. 9876543210"
                  pattern="[0-9+() -]{7,20}"
                  required
                />
                <button type="submit" className="btn-primary" style={{ padding: '12px 28px', borderRadius: '8px' }}>
                  Search Requests
                </button>
              </div>
            </div>
            <p id="trackingStatus" style={{ marginTop: '16px', fontWeight: '600', color: 'var(--ds-primary, #0d9488)' }}></p>
          </form>

          {/* Results table container injected by legacy status-tracking.js */}
          <div id="trackingResults" style={{ marginTop: '24px', overflowX: 'auto' }}></div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Need to file a new inquiry?</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '10px' }}>
            <Link to="/insurance" className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '6px' }}>
              File Insurance Request
            </Link>
            <Link to="/storage" className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '6px' }}>
              Find Storage
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
