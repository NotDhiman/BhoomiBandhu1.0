import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initIndex } from '../legacy/index.js';

/* ── Inline SVG Icon Components ── */
const IconWarehouse = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z"/>
    <path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="12" rx="0"/>
  </svg>
);
const IconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);
const IconScroll = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 11-4 0V5a2 2 0 112 0v2h12a2 2 0 012 2v2H10"/>
    <path d="M19 17V5a2 2 0 00-2-2H4"/>
  </svg>
);
const IconCoins = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1110.34 18"/>
    <path d="M7 6h1v4"/>
    <path d="M16.71 13.88l.7.71-2.82 2.82"/>
  </svg>
);
const IconBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3A2.5 2.5 0 019.5 2z"/>
    <path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3A2.5 2.5 0 0014.5 2z"/>
  </svg>
);
const IconMessageCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
  </svg>
);
const IconHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>
  </svg>
);
const IconSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconPhone = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
);
const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);

/* ── Service Card Data ── */
const serviceCards = [
  {
    to: '/storage',
    icon: <IconWarehouse />,
    badge: 'Cost Saving',
    title: 'Warehouse & Cold Storage',
    desc: 'Locate nearby certified godowns, estimate monthly charges, and secure storage subsidy benefits before harvesting.',
    cta: 'Check Nearby Storages',
  },
  {
    to: '/insurance',
    icon: <IconShield />,
    badge: 'Risk Shield',
    title: 'Crop Insurance (PMFBY)',
    desc: 'Protect against rainfall deficit, unseasonal storms, and pest damage. Step-by-step PMFBY enrollment and claim assistance.',
    cta: 'Explore Insurance',
  },
  {
    to: '/schemes',
    icon: <IconScroll />,
    badge: 'Govt Grants',
    title: 'Government Schemes Directory',
    desc: 'Search over 15+ central and state schemes including PM-Kisan, drip irrigation subsidies, and machinery grants.',
    cta: 'Browse All Schemes',
  },
  {
    to: '/financial',
    icon: <IconCoins />,
    badge: 'Low Interest',
    title: 'Kisan Credit & Loans',
    desc: 'Understand eligibility for Kisan Credit Card (KCC), interest subvention guidelines, and structured debt relief advice.',
    cta: 'View Loan Guide',
  },
  {
    to: '/ml-crop-advisor',
    icon: <IconBrain />,
    badge: 'Machine Learning',
    title: 'ML Crop Recommendation',
    desc: 'Input your soil Nitrogen (N), Phosphorus (P), Potassium (K), and pH to predict your highest-yielding crop.',
    cta: 'Predict Best Crop',
  },
  {
    to: '/gemini-advisor',
    icon: <IconMessageCircle />,
    badge: '24/7 AI Companion',
    title: 'AI Farming Assistant (Gemini)',
    desc: 'Ask in simple Hindi or English: diagnose leaf spots, find fertilizer ratios, and get organic pest remedies immediately.',
    cta: 'Start Talking with AI',
    highlight: true,
  },
  {
    to: '/mental-health',
    icon: <IconHeart />,
    badge: 'Caring Support',
    title: 'Farmer Well-Being & Helplines',
    desc: 'Farming has tough seasons. Access stress-management techniques, community groups, and toll-free support lines anytime.',
    cta: 'Access Support Lines',
  },
  {
    to: '/status-tracking',
    icon: <IconSearch />,
    badge: 'Tracking',
    title: 'Track Applications & Claims',
    desc: 'Check the live progress of your insurance claims, warehouse reservations, and PMFBY applications in one place.',
    cta: 'Track My Status',
  },
];

export default function IndexPage() {
  useEffect(() => {
    const pageClass = 'page-index';
    document.body.classList.add(pageClass);
    initCommon();
    initIndex();
    return () => document.body.classList.remove(pageClass);
  }, []);

  return (
    <>
      <Navbar />

      {/* ══════════ SCHEME TICKER ══════════ */}
      <div className="scheme-ticker" role="region" aria-label="Agricultural Notices">
        <div className="scheme-track">
          <span>PMFBY: Kharif season crop insurance enrollment is currently active</span>
          <span>KCC Loan: 4% effective interest rate available for prompt repayment</span>
          <span>Storage Subsidy: Up to 33.3% subsidy under Gramin Bhandaran Yojana</span>
          <span>AI Crop Advice: Free instant soil &amp; crop matching available 24/7</span>
          <span>Farm Equipment: Custom hiring centers open in all district blocks</span>
          {/* Duplicate for seamless infinite loop */}
          <span>PMFBY: Kharif season crop insurance enrollment is currently active</span>
          <span>KCC Loan: 4% effective interest rate available for prompt repayment</span>
          <span>Storage Subsidy: Up to 33.3% subsidy under Gramin Bhandaran Yojana</span>
          <span>AI Crop Advice: Free instant soil &amp; crop matching available 24/7</span>
          <span>Farm Equipment: Custom hiring centers open in all district blocks</span>
        </div>
      </div>

      <main id="main-content">
        {/* ══════════ HERO SECTION ══════════ */}
        <section className="farmer-hero-section">
          <div className="container hero-container">
            <div className="farmer-hero-content">
              <div className="hero-kicker-pill">
                <span className="kicker-pulse" aria-hidden="true" />
                <span>Aapka Apna Kisan Sahayak &middot; Direct Government &amp; Tech Support</span>
              </div>

              <h1 className="farmer-hero-title">
                Simple, Reliable Support for Every Indian Farmer
              </h1>

              <p className="farmer-hero-sub">
                Protect your crops, find certified local storage facilities, calculate government scheme benefits,
                and receive immediate AI agronomic advice — designed to be fast and easy on any mobile device.
              </p>

              {/* Hero CTA cluster */}
              <div className="hero-cta-cluster">
                <Link to="/storage" className="btn-primary-farmer">
                  <span>Find Storage</span>
                  <IconArrowRight />
                </Link>
                <Link to="/ml-crop-advisor" className="btn-secondary-farmer">
                  <span>Crop Advisor</span>
                </Link>
                <Link to="/gemini-advisor" className="btn-ai-farmer">
                  <span className="kicker-pulse" aria-hidden="true" />
                  <span>Ask AI Doctor</span>
                </Link>
              </div>

              {/* Hero trust bar */}
              <div className="hero-trust-bar">
                <div className="trust-item">
                  <IconCheckCircle />
                  <span><strong>100% Free</strong> Public Service</span>
                </div>
                <div className="trust-item">
                  <IconZap />
                  <span><strong>Works Fast</strong> on 2G/3G/4G</span>
                </div>
                <div className="trust-item">
                  <IconGlobe />
                  <span><strong>Central &amp; State</strong> Schemes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ SERVICES GRID ══════════ */}
        <section className="container" style={{ padding: '80px var(--space-6)' }}>
          <div className="section-head">
            <span className="section-subtitle">How BhoomiBandhu Helps Your Farming</span>
            <h2 className="section-title">Major Farmer Services</h2>
            <p className="section-description">
              Integrated agricultural tools built specifically for smallholder and commercial farmers across India.
            </p>
          </div>

          <div className="services-farmer-grid">
            {serviceCards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className={`service-farmer-card${card.highlight ? ' service-highlight-card' : ''}`}
              >
                <div className="service-card-top">
                  <div className="service-card-icon">
                    {card.icon}
                  </div>
                  <span className="service-badge">
                    {card.badge}
                  </span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <div className="service-card-action">
                  <span>{card.cta}</span>
                  <span className="card-arrow">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════ STEPS TIMELINE ══════════ */}
        <section className="steps-section">
          <div className="container">
            <div className="section-head">
              <span className="section-subtitle">How To Use</span>
              <h2 className="section-title">Getting Help in 3 Easy Steps</h2>
              <p className="section-description">
                Fast, straightforward guidance with no complicated paperwork.
              </p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Select Your Need</h3>
                <p>
                  Choose whether you need warehouse space, insurance claim support, government schemes, or crop diagnosis advice.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Provide Basic Details</h3>
                <p>
                  Enter your crop name, soil metrics, or district. Clear helper hints guide you through each field.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Get Immediate Results</h3>
                <p>
                  View verified storage rates, calculate subsidies, or get AI agronomic treatment recommendations instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ HELPLINE BANNER ══════════ */}
        <section className="container helpline-bar-section">
          <div className="helpline-banner">
            <div className="helpline-icon">
              <IconPhone />
            </div>
            <div className="helpline-content">
              <h3 className="helpline-title">Direct Government Agricultural Helplines</h3>
              <p className="helpline-desc">
                Toll-Free Kisan Call Centre: <strong>1800-180-1551</strong> (6 AM to 10 PM) &middot; PMFBY Crop Insurance: <strong>14447</strong> &middot; Kisan Tele-MANAS: <strong>14416</strong>
              </p>
            </div>
            <Link to="/mental-health" className="btn-helpline">
              Emergency Well-being Contacts &rarr;
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
