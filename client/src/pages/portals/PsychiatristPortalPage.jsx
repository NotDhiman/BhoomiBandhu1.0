import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

export default function PsychiatristPortalPage() {
  const { user, logout, logoutAll } = useAuth();
  const profile = user?.profile_details || {};

  return (
    <div className="portal-container">
      <div className="portal-hero">
        <div>
          <span className="portal-badge" style={{ background: '#7e22ce' }}>
            🧠 Clinical Mental Health Portal
          </span>
          <h1 style={{ marginTop: '10px' }}>
            Dr. {user?.email?.split('@')[0] || user?.mobile}
          </h1>
          <p>License: {profile.license_number} • Specialization: {profile.specialization || 'Farmer Psychological Care'}</p>
          <p style={{ fontSize: '0.88rem', opacity: 0.9 }}>
            Status: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✓ Approved Professional</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            onClick={logout}
          >
            Logout
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: '#dc2626' }}
            onClick={logoutAll}
          >
            Logout All
          </button>
        </div>
      </div>

      <div className="portal-grid">
        <div className="portal-card">
          <h3>🩺 Patient Appointments</h3>
          <p>View upcoming counseling appointments and emergency mental health consultation requests from farmers.</p>
          <button type="button" className="btn" onClick={() => alert('Consultation module active. Ready for farmer queue.')}>
            View Patient Queue
          </button>
        </div>

        <div className="portal-card">
          <h3>📅 Availability Settings</h3>
          <p>Configure your tele-counseling hours and emergency helpline roster.</p>
          <p>Current Status: <strong>{profile.availability_status || 'available'}</strong></p>
        </div>

        <div className="portal-card">
          <h3>📋 Clinical Case Notes</h3>
          <p>Secure, confidential records of prior distress consultations and community support referrals.</p>
          <button type="button" className="btn" onClick={() => alert('Accessing confidential clinical records.')}>
            Open Case Notes
          </button>
        </div>
      </div>
    </div>
  );
}
