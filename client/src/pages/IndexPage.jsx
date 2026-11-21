import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initIndex } from '../legacy/index.js';

/* ── Inline SVG Icon Components ── */
const IconWheat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22L16 8"/><path d="M3.47 12.53L5 11l1.53 1.53a3.5 3.5 0 010 4.94L5 19l-1.53-1.53a3.5 3.5 0 010-4.94z"/><path d="M7.47 8.53L9 7l1.53 1.53a3.5 3.5 0 010 4.94L9 15l-1.53-1.53a3.5 3.5 0 010-4.94z"/><path d="M11.47 4.53L13 3l1.53 1.53a3.5 3.5 0 010 4.94L13 11l-1.53-1.53a3.5 3.5 0 010-4.94z"/><path d="M20 2l2 2-6.5 6.5-2-2L20 2z"/></svg>
);
const IconWarehouse = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="12" rx="0"/></svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
);
const IconScroll = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 11-4 0V5a2 2 0 112 0v2h12a2 2 0 012 2v2H10"/><path d="M19 17V5a2 2 0 00-2-2H4"/></svg>
);
const IconCoins = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1110.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/></svg>
);
const IconBrain = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3A2.5 2.5 0 019.5 2z"/><path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3A2.5 2.5 0 0014.5 2z"/></svg>
);
const IconMessageCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
);
const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>
);
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
);
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
);
const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
);
const IconPhone = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
);
const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
);

/* ── Service Card Data ── */
const serviceCards = [
  {
    to: '/storage',
    icon: <IconWarehouse />,
    iconBg: '#0d4f4a',
    iconColor: '#5eead4',
    borderColor: '#14b8a6',
    badge: 'Cost Saving',
    title: 'Warehouse & Cold Storage',
    desc: 'Locate nearby certified godowns, estimate monthly charges, and secure storage subsidy benefits before harvesting.',
    cta: 'Check Nearby Storages',
  },
  {
    to: '/insurance',
    icon: <IconShield />,
    iconBg: '#0c3547',
    iconColor: '#7dd3fc',
    borderColor: '#0ea5e9',
    badge: 'Risk Shield',
    title: 'Crop Insurance (PMFBY)',
    desc: 'Protect against rainfall deficit, unseasonal storms, and pest damage. Step-by-step PMFBY enrollment and claim assistance.',
    cta: 'Explore Insurance',
  },
  {
    to: '/schemes',
    icon: <IconScroll />,
    iconBg: '#422006',
    iconColor: '#fbbf24',
    borderColor: '#f59e0b',
    badge: 'Govt Grants',
    title: 'Government Schemes Directory',
    desc: 'Search over 15+ central and state schemes including PM-Kisan, drip irrigation subsidies, and machinery grants.',
    cta: 'Browse All Schemes',
  },
  {
    to: '/financial',
    icon: <IconCoins />,
    iconBg: '#052e16',
    iconColor: '#86efac',
    borderColor: '#22c55e',
    badge: 'Low Interest',
    title: 'Kisan Credit & Loans',
    desc: 'Understand eligibility for Kisan Credit Card (KCC), interest subvention guidelines, and structured debt relief advice.',
    cta: 'View Loan Guide',
  },
  {
    to: '/ml-crop-advisor',
    icon: <IconBrain />,
    iconBg: '#2e1065',
    iconColor: '#c4b5fd',
    borderColor: '#8b5cf6',
    badge: 'Machine Learning',
    title: 'ML Crop Recommendation',
    desc: 'Input your soil Nitrogen (N), Phosphorus (P), Potassium (K), and pH to predict your highest-yielding crop.',
    cta: 'Predict Best Crop',
  },
  {
    to: '/gemini-advisor',
    icon: <IconMessageCircle />,
    iconBg: '#064e3b',
    iconColor: '#6ee7b7',
    borderColor: '#10b981',
    badge: '24/7 AI Companion',
    badgeHighlight: true,
    title: 'AI Farming Assistant (Gemini)',
    desc: 'Ask in simple Hindi or English: diagnose leaf spots, find fertilizer ratios, and get organic pest remedies immediately.',
    cta: 'Start Talking with AI',
    highlight: true,
  },
  {
    to: '/mental-health',
    icon: <IconHeart />,
    iconBg: '#500724',
    iconColor: '#fda4af',
    borderColor: '#f43f5e',
    badge: 'Caring Support',
    title: 'Farmer Well-Being & Helplines',
    desc: 'Farming has tough seasons. Access stress-management techniques, community groups, and toll-free support lines anytime.',
    cta: 'Access Support Lines',
  },
  {
    to: '/status-tracking',
    icon: <IconSearch />,
    iconBg: '#1e1b4b',
    iconColor: '#a5b4fc',
    borderColor: '#6366f1',
    badge: 'Tracking',
    title: 'Track Applications & Claims',
    desc: 'Check the live progress of your insurance claims, warehouse reservations, and PMFBY applications in one place.',
    cta: 'Track My Status',
  },
];

export default function IndexPage() {
  const [activeWeather, setActiveWeather] = useState(null);

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
      <div className="idx-ticker" role="region" aria-label="Agricultural Notices">
        <div className="idx-ticker__track">
          <span>PMFBY: Kharif season crop insurance enrollment is currently active</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>KCC Loan: 4% effective interest rate available for prompt repayment</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>Storage Subsidy: Up to 33.3% subsidy under Gramin Bhandaran Yojana</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>AI Crop Advice: Free instant soil &amp; crop matching available 24/7</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>Farm Equipment: Custom hiring centers open in all district blocks</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          {/* duplicate for seamless loop */}
          <span>PMFBY: Kharif season crop insurance enrollment is currently active</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>KCC Loan: 4% effective interest rate available for prompt repayment</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>Storage Subsidy: Up to 33.3% subsidy under Gramin Bhandaran Yojana</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>AI Crop Advice: Free instant soil &amp; crop matching available 24/7</span>
          <span className="idx-ticker__sep" aria-hidden="true" />
          <span>Farm Equipment: Custom hiring centers open in all district blocks</span>
        </div>
      </div>

      <main id="main-content">
        {/* ══════════ HERO SECTION ══════════ */}
        <section className="idx-hero">
          <div className="idx-hero__inner">
            {/* Left — text content */}
            <div className="idx-hero__text">
              <div className="idx-hero__kicker">
                <span className="idx-hero__kicker-dot" aria-hidden="true" />
                <span>Aapka Apna Kisan Sahayak &middot; Direct Government &amp; Tech Support</span>
              </div>

              <h1 className="idx-hero__title">
                Simple, Reliable Support for Every Indian Farmer
              </h1>

              <p className="idx-hero__subtitle">
                Protect your crops, find certified local storage facilities, calculate government scheme benefits,
                and receive immediate AI agronomic advice — designed to be easy and fast on any mobile phone.
              </p>

              {/* CTA Cluster */}
              <div className="idx-hero__ctas">
                <Link to="/storage" className="idx-btn idx-btn--primary">
                  <span>Find Storage</span>
                  <IconArrowRight />
                </Link>
                <Link to="/ml-crop-advisor" className="idx-btn idx-btn--outline">
                  <span>Crop Advisor</span>
                </Link>
                <Link to="/gemini-advisor" className="idx-btn idx-btn--glass">
                  <span className="idx-btn__pulse" aria-hidden="true" />
                  <span>Ask AI Doctor</span>
                </Link>
              </div>

              {/* Trust bar */}
              <div className="idx-hero__trust">
                <div className="idx-trust-card">
                  <span className="idx-trust-card__icon"><IconCheckCircle /></span>
                  <span><strong>100% Free</strong> Public Service</span>
                </div>
                <div className="idx-trust-card">
                  <span className="idx-trust-card__icon"><IconZap /></span>
                  <span><strong>Works Fast</strong> on 2G/3G/4G</span>
                </div>
                <div className="idx-trust-card">
                  <span className="idx-trust-card__icon"><IconGlobe /></span>
                  <span><strong>Central &amp; State</strong> Schemes</span>
                </div>
              </div>
            </div>

            {/* Right — decorative floating shapes */}
            <div className="idx-hero__visual" aria-hidden="true">
              <div className="idx-hero__shape idx-hero__shape--ring" />
              <div className="idx-hero__shape idx-hero__shape--dots" />
              <div className="idx-hero__shape idx-hero__shape--hex" />
              <div className="idx-hero__shape idx-hero__shape--circle" />
              <div className="idx-hero__shape idx-hero__shape--diamond" />
              <div className="idx-hero__shape idx-hero__shape--plus" />
            </div>
          </div>
        </section>

        {/* ══════════ SERVICES GRID ══════════ */}
        <section className="idx-services">
          <div className="container">
            <div className="idx-section-head">
              <span className="idx-section-head__sub">How BhoomiBandhu Helps Your Farming</span>
              <h2 className="idx-section-head__title">Major Farmer Services</h2>
            </div>

            <div className="idx-services__grid">
              {serviceCards.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className={`idx-svc-card${card.highlight ? ' idx-svc-card--highlight' : ''}`}
                  style={{ '--svc-accent': card.borderColor }}
                >
                  <div className="idx-svc-card__top">
                    <div
                      className="idx-svc-card__icon"
                      style={{ background: card.iconBg, color: card.iconColor }}
                    >
                      {card.icon}
                    </div>
                    <span
                      className={`idx-svc-card__badge${card.badgeHighlight ? ' idx-svc-card__badge--glow' : ''}`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="idx-svc-card__title">{card.title}</h3>
                  <p className="idx-svc-card__desc">{card.desc}</p>
                  <div className="idx-svc-card__link">
                    <span>{card.cta}</span>
                    <IconArrowRight />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ STEPS TIMELINE ══════════ */}
        <section className="idx-steps">
          <div className="container">
            <div className="idx-section-head" style={{ textAlign: 'center' }}>
              <span className="idx-section-head__sub">How To Use</span>
              <h2 className="idx-section-head__title">Getting Help in 3 Easy Steps</h2>
            </div>

            <div className="idx-steps__track">
              {/* connecting line sits behind */}
              <div className="idx-steps__line" aria-hidden="true" />

              <div className="idx-step-card">
                <div className="idx-step-card__num">1</div>
                <h3 className="idx-step-card__title">Select Your Need</h3>
                <p className="idx-step-card__desc">
                  Choose whether you need warehouse space, insurance claim support, or crop diagnosis advice.
                </p>
              </div>

              <div className="idx-step-card">
                <div className="idx-step-card__num">2</div>
                <h3 className="idx-step-card__title">Provide Basic Details</h3>
                <p className="idx-step-card__desc">
                  Enter your crop name, soil metrics, or district. Forms have clear helper hints for each field.
                </p>
              </div>

              <div className="idx-step-card">
                <div className="idx-step-card__num">3</div>
                <h3 className="idx-step-card__title">Get Immediate Results</h3>
                <p className="idx-step-card__desc">
                  View verified rates, calculate government subsidies, or track your reference status directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ HELPLINE BANNER ══════════ */}
        <section className="container" style={{ padding: '0 20px 80px' }}>
          <div className="idx-helpline">
            <div className="idx-helpline__body">
              <div className="idx-helpline__icon">
                <IconPhone />
              </div>
              <div>
                <h3 className="idx-helpline__title">Direct Government Agricultural Helplines</h3>
                <p className="idx-helpline__desc">
                  Toll-Free Kisan Call Centre: <strong>1800-180-1551</strong> (6 AM to 10 PM) | PMFBY Helpline: <strong>14447</strong>
                </p>
              </div>
            </div>
            <Link to="/mental-health" className="idx-helpline__btn">
              Emergency Well-being Contacts
              <IconArrowRight />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
