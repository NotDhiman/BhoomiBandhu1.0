import React from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/portal.css';

const IconBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3A2.5 2.5 0 019.5 2z"/><path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3A2.5 2.5 0 0014.5 2z"/></svg>
);
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
);

export default function PsychiatristPortalPage() {
  const { user, logout, logoutAll } = useAuth();
  const profile = user?.profile_details || {};

  return (
    <>
      <Navbar />
      <div className="portal-wrapper">
        <div className="portal-hero-banner" style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #0d9488 100%)' }}>
          <div>
            <span className="portal-badge-pill" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
              🧠 Licensed Clinical Partner Desk
            </span>
            <h1 className="portal-hero-title">
              Dr. {user?.email?.split('@')[0] || user?.mobile}
            </h1>
            <p className="portal-hero-subtitle">
              <span>Medical License: <strong>{profile.license_number}</strong></span>
              <span>Specialization: <strong>{profile.specialization || 'Farmer Psychological Well-Being'}</strong></span>
              <span>Status: <span style={{ color: '#5eead4', fontWeight: 'bold' }}>✓ Verified Professional</span></span>
            </p>
          </div>
          <div className="portal-hero-actions">
            <button
              type="button"
              className="portal-btn-secondary"
              onClick={logout}
            >
              Sign Out
            </button>
            <button
              type="button"
              className="portal-btn-secondary"
              style={{ background: 'rgba(239, 68, 68, 0.25)', borderColor: '#ef4444' }}
              onClick={logoutAll}
            >
              Sign Out All
            </button>
          </div>
        </div>

        <div className="portal-metrics-grid">
          <div className="portal-stat-card">
            <div className="portal-stat-icon purple">
              <IconUsers />
            </div>
            <div className="portal-stat-data">
              <strong>Active</strong>
              <span>Patient Consultation Queue</span>
            </div>
          </div>

          <div className="portal-stat-card">
            <div className="portal-stat-icon green">
              <IconCalendar />
            </div>
            <div className="portal-stat-data">
              <strong>Available</strong>
              <span>Tele-MANAS Telehealth Status</span>
            </div>
          </div>

          <div className="portal-stat-card">
            <div className="portal-stat-icon blue">
              <IconBrain />
            </div>
            <div className="portal-stat-data">
              <strong>Encrypted</strong>
              <span>Clinical Health Vault</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="portal-section-card">
            <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.25rem', marginBottom: '10px' }}>🩺 Incoming Farmer Consultations</h3>
            <p style={{ color: 'var(--portal-text-muted)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Review prioritized distress requests routed from the 24/7 Kisan mental well-being helpline.
            </p>
            <button
              type="button"
              className="portal-btn-primary"
              onClick={() => alert('Consultation module active. Ready for farmer queue.')}
            >
              Open Active Patient Queue
            </button>
          </div>

          <div className="portal-section-card">
            <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.25rem', marginBottom: '10px' }}>📅 Tele-Counseling Roster</h3>
            <p style={{ color: 'var(--portal-text-muted)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Configure your on-call availability windows for regional agricultural distress centers.
            </p>
            <p style={{ fontSize: '0.9rem' }}>Current Roster Status: <strong style={{ color: '#0d9488' }}>{profile.availability_status || 'Active & Receiving'}</strong></p>
          </div>

          <div className="portal-section-card">
            <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.25rem', marginBottom: '10px' }}>📋 Case Diagnostic Records</h3>
            <p style={{ color: 'var(--portal-text-muted)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Access encrypted session transcripts and government psychiatric referral documents.
            </p>
            <button
              type="button"
              className="portal-btn-primary"
              onClick={() => alert('Accessing confidential clinical records.')}
            >
              Open Clinical Records
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
