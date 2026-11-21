import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initFinancial } from '../legacy/financial.js';

/* â”€â”€ Modern Inline SVG Icons â”€â”€ */
const IconCoins = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1110.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/></svg>
);
const IconShieldCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
);
const IconTractor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="5"/><path d="M9 18h4"/><path d="M6 15V9h9l3 7"/><path d="M9 9V5h4v4"/></svg>
);
const IconBookOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
);

export default function FinancialPage() {
  useEffect(() => {
    const pageClass = 'page-financial';
    document.body.classList.add(pageClass);
    initCommon();
    initFinancial();
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
              <span>Kisan Credit Card (KCC) & Low Interest Financing</span>
            </div>
            <h1 className="farmer-hero-title">Agricultural Credit & Financial Stability</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto 24px' }}>
              Access institutional farm credit, interest subvention benefits (effective 4% p.a.), and debt counseling designed to protect Indian farm households.
            </p>
            <div className="hero-trust-bar" style={{ justifyContent: 'center' }}>
              <div className="trust-item">
                <span className="trust-icon">💰</span>
                <span><strong>4% Net</strong> KCC Prompt Repayment Rate</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🏛️</span>
                <span><strong>₹3.0 Lakh</strong> Collateral-Free Limit</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <span><strong>NABARD</strong> Verified Framework</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        {/* Core Financial Services Grid */}
        <div className="section-head">
          <span className="section-subtitle">Financial Services</span>
          <h2 className="section-title">Institutional Credit Programs</h2>
        </div>

        <div className="services-farmer-grid" style={{ marginBottom: '48px' }}>
          <div className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>
                <IconCoins />
              </div>
              <span className="service-badge">Effective 4%</span>
            </div>
            <h3>Kisan Credit Card (KCC)</h3>
            <p>Short-term credit for cultivation, post-harvest expenses, produce marketing, and working capital with 3% prompt repayment incentive.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <IconShieldCheck />
              </div>
              <span className="service-badge">Debt Relief</span>
            </div>
            <h3>Debt Restructuring & Relief</h3>
            <p>Guidance on converting short-term loans to medium-term during natural calamities, preventing default and asset attachment.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <IconTractor />
              </div>
              <span className="service-badge">Capital Subsidy</span>
            </div>
            <h3>Farm Mechanization Loans</h3>
            <p>Financing for tractors, combine harvesters, solar pump sets, and drip irrigation setups with up to 40% government subsidy.</p>
          </div>

          <div className="service-farmer-card">
            <div className="service-card-top">
              <div className="service-card-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <IconBookOpen />
              </div>
              <span className="service-badge">Kisan Literacy</span>
            </div>
            <h3>Financial Literacy & Planning</h3>
            <p>Clear explanations of compounding, bank statement auditing, and crop cash-flow budgeting in simple everyday language.</p>
          </div>
        </div>

        {/* Application Form */}
        <div className="card" style={{ padding: '40px', maxWidth: '820px', margin: '0 auto', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontFamily: 'DM Sans', fontSize: '1.65rem', marginBottom: '8px' }}>Apply for Agricultural Credit Assistance</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Submit your credit requirement to connect with designated cooperative & commercial banks</p>
          </div>

          <form id="loanForm" noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div className="form-group">
                <label htmlFor="name">Farmer Full Name *</label>
                <input type="text" id="name" className="auth-input" placeholder="e.g. Balwinder Singh" required />
              </div>
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input type="tel" id="mobile" className="auth-input" placeholder="e.g. 9876543210" pattern="[0-9+() -]{7,20}" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginTop: '16px' }}>
              <div className="form-group">
                <label htmlFor="village">Village / Tehsil *</label>
                <input type="text" id="village" className="auth-input" placeholder="e.g. Nilokheri, Karnal" required />
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
                <label htmlFor="amount">Required Loan Amount (₹) *</label>
                <input type="number" id="amount" className="auth-input" placeholder="e.g. 150000" min="1" step="0.01" required />
              </div>
              <div className="form-group">
                <label htmlFor="loanType">Loan Classification *</label>
                <select id="loanType" className="auth-input" required>
                  <option value="">Select Loan Type</option>
                  <option>Crop Loan (KCC)</option>
                  <option>Equipment Loan</option>
                  <option>Irrigation Loan</option>
                  <option>Dairy / Livestock Loan</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="purpose">Intended Use of Funds *</label>
              <textarea
                id="purpose"
                className="auth-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
                placeholder="Describe how the loan funds will be utilized (e.g. purchase of certified wheat seeds, DAP fertilizer, and laser land leveler hire)."
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '10px' }}>
              Submit Agricultural Loan Inquiry
            </button>
            <p id="formMessage" style={{ marginTop: '18px', fontWeight: '600', textAlign: 'center' }}></p>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}
