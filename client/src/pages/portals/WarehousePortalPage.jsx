import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authFetch } from '../../services/authFetch.js';
import {
  getWarehouseStatusLabel,
  getWarehouseStatusBanner,
  isOperationalActionDisabled,
  deriveWarehouseState,
  formatWarehouseEditPayload,
  getWarehouseFacilitiesCount,
} from '../../services/warehouseHelpers.js';
import '../../pageStyles/portal.css';

export default function WarehousePortalPage() {
  const { user, logout, logoutAll } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Live Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [facilitiesData, setFacilitiesData] = useState(null);
  const [bookingsData, setBookingsData] = useState(null);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabLoading, setTabLoading] = useState(false);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    gstin: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Fetch Dashboard & Profile
  const fetchPortalData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // First fetch warehouse owner profile (always accessible to warehouse owners)
      const profileRes = await authFetch('/api/warehouse/me');
      setProfileData(profileRes);

      setEditFormData({
        company_name: profileRes.company_name || '',
        gstin: profileRes.gstin || '',
      });

      // If approved, fetch full dashboard data
      if (profileRes.is_approved) {
        try {
          const dashRes = await authFetch('/api/warehouse/me/dashboard');
          setDashboardData(dashRes);
        } catch (dashErr) {
          console.warn('Dashboard summary fetch error:', dashErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load warehouse owner portal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Lazy tab fetcher
  const handleTabChange = async (tab) => {
    setActiveTab(tab);

    const isApproved = Boolean(profileData?.is_approved);
    if (!isApproved && (tab === 'facilities' || tab === 'bookings')) {
      return;
    }

    if (tab === 'facilities' && !facilitiesData) {
      setTabLoading(true);
      try {
        const res = await authFetch('/api/warehouse/facilities');
        setFacilitiesData(res);
      } catch (err) {
        console.error('Failed to load facilities:', err);
      } finally {
        setTabLoading(false);
      }
    }

    if (tab === 'bookings' && !bookingsData) {
      setTabLoading(true);
      try {
        const res = await authFetch('/api/warehouse/bookings');
        setBookingsData(res);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setTabLoading(false);
      }
    }
  };

  // Edit Profile Handlers
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess('');

    const payload = formatWarehouseEditPayload(editFormData);

    try {
      const updated = await authFetch('/api/warehouse/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setProfileData(updated);
      setSaveSuccess('Company profile updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess('');
      }, 1500);
    } catch (err) {
      setSaveError(err.message || 'Failed to update company profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const { isApproved, accountStatus } = deriveWarehouseState(profileData);
  const approvalStatus = accountStatus;

  return (
    <div className="portal-wrapper">
      {/* ── Warehouse Hero Banner ── */}
      <div className="portal-hero-banner portal-hero-warehouse">
        <div>
          <span className="portal-badge-pill">
            🏬 Warehouse Facility Portal
          </span>
          <h1 className="portal-hero-title">
            {profileData?.company_name || 'Storage Facility Partner'}
          </h1>
          <p className="portal-hero-subtitle">
            <span>📞 Mobile: {profileData?.mobile || user?.mobile || '—'}</span>
            <span>✉️ Email: {profileData?.email || user?.email || '—'}</span>
            <span>📄 GSTIN: {profileData?.gstin || 'Pending'}</span>
          </p>
        </div>

        <div className="portal-hero-actions">
          <button
            type="button"
            className="portal-hero-btn secondary"
            onClick={() => setIsEditModalOpen(true)}
          >
            ✏️ Edit Profile
          </button>
          <button
            type="button"
            className="portal-hero-btn secondary"
            onClick={logout}
          >
            Logout
          </button>
          <button
            type="button"
            className="portal-hero-btn danger"
            onClick={logoutAll}
          >
            Logout All
          </button>
        </div>
      </div>

      {/* ── Status Banner for Pending/Rejected/Suspended Owners ── */}
      {!isApproved && (() => {
        const banner = getWarehouseStatusBanner(accountStatus);
        return (
          <div
            className="portal-notice-banner amber"
            style={{
              borderLeftWidth: '6px',
              borderLeftColor: banner.color,
            }}
          >
            <div style={{ fontSize: '1.6rem' }}>{banner.icon}</div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: '700' }}>
                {banner.title}
              </h4>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                {banner.message}
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Main Tab Navigation ── */}
      <div className="portal-tabs-nav">
        <button
          type="button"
          className={`portal-tab-item warehouse ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          📊 Portal Overview
        </button>
        <button
          type="button"
          className={`portal-tab-item warehouse ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          🏢 Company & Facility Profile
        </button>
        <button
          type="button"
          className={`portal-tab-item warehouse ${activeTab === 'facilities' ? 'active' : ''}`}
          onClick={() => handleTabChange('facilities')}
        >
          📦 Storage Units & Facilities
        </button>
        <button
          type="button"
          className={`portal-tab-item warehouse ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
        >
          🚚 Farmer Booking Requests
        </button>
      </div>

      {/* ── Global Loading / Error ── */}
      {loading ? (
        <div className="portal-loading">
          <div className="portal-spinner" style={{ borderTopColor: '#d97706' }}></div>
          <p>Loading warehouse portal data...</p>
        </div>
      ) : error ? (
        <div className="portal-error-banner">
          <p>⚠️ {error}</p>
          <button
            type="button"
            className="portal-btn btn-save"
            style={{ background: '#d97706', marginTop: '10px' }}
            onClick={fetchPortalData}
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              TAB 1: PORTAL OVERVIEW
              ══════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div>
              {/* Stat Cards */}
              <div className="portal-stats-grid">
                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap amber">✓</div>
                  <div className="portal-stat-info">
                    <h3>{getWarehouseStatusLabel(accountStatus)}</h3>
                    <p>Approval Status</p>
                  </div>
                </div>

                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap blue">🏬</div>
                  <div className="portal-stat-info">
                    <h3>{getWarehouseFacilitiesCount(dashboardData)}</h3>
                    <p>Total Facilities</p>
                  </div>
                </div>

                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap green">📦</div>
                  <div className="portal-stat-info">
                    <h3>{dashboardData?.total_bookings ?? 0}</h3>
                    <p>Total Bookings</p>
                  </div>
                </div>

                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap purple">⏳</div>
                  <div className="portal-stat-info">
                    <h3>{dashboardData?.pending_bookings ?? 0}</h3>
                    <p>Pending Requests</p>
                  </div>
                </div>
              </div>

              {/* Schema Limitation Notice */}
              <div className="portal-notice-banner" style={{ background: '#f8fafc', borderColor: '#cbd5e1', borderLeftColor: '#64748b' }}>
                <div style={{ fontSize: '1.4rem' }}>ℹ️</div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>
                    Database Architecture & Facility Ownership
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.45 }}>
                    Facility and booking management features are currently unavailable pending approved database schema migration (003_warehouse_facility_ownership: adding warehouse_owner_id to storage_facilities) and implementation of ownership CRUD workflows. Company profile verification and credentials management operate under current schema.
                  </p>
                </div>
              </div>

              {/* Quick Actions & Operational Summary */}
              <div className="portal-card-box">
                <div className="portal-card-box-header">
                  <h2>⚡ Operational Actions</h2>
                </div>
                <div className="portal-actions-grid">
                  <div
                    className="portal-action-tile"
                    style={{ cursor: 'not-allowed', opacity: 0.5 }}
                    title="Unavailable — requires database migration 003_warehouse_facility_ownership and facility ownership CRUD implementation"
                  >
                    <h4>🏬 Storage Units (Unavailable)</h4>
                    <p>Facility management is currently unavailable. This feature requires database migration 003_warehouse_facility_ownership and ownership CRUD workflows before units can be managed.</p>
                  </div>

                  <div
                    className="portal-action-tile"
                    style={{ cursor: 'not-allowed', opacity: 0.5 }}
                    title="Unavailable — requires database migration 003_warehouse_facility_ownership and booking management CRUD implementation"
                  >
                    <h4>🚚 Booking Requests (Unavailable)</h4>
                    <p>Farmer booking management is currently unavailable. This workflow requires facility ownership linkage in storage_facilities before booking assignments can be processed.</p>
                  </div>

                  <div
                    className="portal-action-tile"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <h4>🏢 Update Credentials</h4>
                    <p>Modify company trade name, FSSAI / WDRA license numbers, GSTIN, and location address.</p>
                  </div>

                  <div
                    className="portal-action-tile"
                    style={{ cursor: 'pointer' }}
                    onClick={() => alert('Gramin Bhandaran Yojana (Rural Godown Scheme) provides 25% to 33.33% capital investment subsidy for godown construction.')}
                  >
                    <h4>📊 Godown Subsidies</h4>
                    <p>Explore NABARD and central capital investment subsidies for rural godowns and modern storage.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 2: COMPANY & FACILITY PROFILE
              ══════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="portal-card-box">
              <div className="portal-card-box-header">
                <h2>🏢 Company & Regulatory Profile</h2>
                <button
                  type="button"
                  className="portal-btn btn-save"
                  style={{ background: '#d97706' }}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  ✏️ Edit Profile
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 4px' }}>COMPANY / FIRM NAME</h4>
                  <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                    {profileData?.company_name || 'Not provided'}
                  </p>
                </div>

                <div>
                  <h4 style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 4px' }}>VERIFICATION STATUS</h4>
                  <span className={`portal-status-badge status-${accountStatus}`}>
                    {getWarehouseStatusLabel(accountStatus)}
                  </span>
                </div>

                <div>
                  <h4 style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 4px' }}>GSTIN</h4>
                  <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                    {profileData?.gstin || 'Not registered'}
                  </p>
                </div>

                <div>
                  <h4 style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 4px' }}>REGISTERED CONTACT</h4>
                  <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                    📞 {profileData?.mobile || user?.mobile} {profileData?.email ? `• ✉️ ${profileData.email}` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 3: STORAGE UNITS & FACILITIES
              ══════════════════════════════════════════════════ */}
          {activeTab === 'facilities' && (
            <div className="portal-card-box">
              <div className="portal-card-box-header">
                <h2>📦 Registered Storage Facilities</h2>
              </div>

              {!isApproved ? (
                <div className="portal-empty-state">
                  <div className="portal-empty-icon">🔒</div>
                  <h3>Facility Management Locked</h3>
                  <p>Your warehouse owner account is currently pending admin approval. You can manage facilities once verified.</p>
                </div>
              ) : tabLoading ? (
                <div className="portal-loading">
                  <div className="portal-spinner" style={{ borderTopColor: '#d97706' }}></div>
                  <p>Loading registered facilities...</p>
                </div>
              ) : facilitiesData?.facilities && facilitiesData.facilities.length > 0 ? (
                <div className="portal-table-container">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Facility Name</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Capacity</th>
                        <th>Available</th>
                        <th>Price / Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facilitiesData.facilities.map((fac) => (
                        <tr key={fac.id}>
                          <td style={{ fontWeight: 600 }}>{fac.name}</td>
                          <td>{fac.facility_type}</td>
                          <td>{fac.location || `${fac.city}, ${fac.state}`}</td>
                          <td>{fac.total_capacity_mt} MT</td>
                          <td>{fac.available_capacity_mt} MT</td>
                          <td>₹{fac.price_per_day_per_quintal || fac.price_per_quintal_day}/qtl</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="portal-empty-state">
                  <div className="portal-empty-icon">🏬</div>
                  <h3>No Dedicated Facility Linked Yet</h3>
                  <p>
                    {facilitiesData?.notice ||
                      'Facility ownership linking is staged for the upcoming database schema migration. Your registered profile details are active.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB 4: FARMER BOOKING REQUESTS
              ══════════════════════════════════════════════════ */}
          {activeTab === 'bookings' && (
            <div className="portal-card-box">
              <div className="portal-card-box-header">
                <h2>🚚 Incoming Farmer Booking Requests</h2>
              </div>

              {!isApproved ? (
                <div className="portal-empty-state">
                  <div className="portal-empty-icon">🔒</div>
                  <h3>Booking Queue Locked</h3>
                  <p>Farmer bookings can only be managed after warehouse owner verification is approved.</p>
                </div>
              ) : tabLoading ? (
                <div className="portal-loading">
                  <div className="portal-spinner" style={{ borderTopColor: '#d97706' }}></div>
                  <p>Loading incoming booking requests...</p>
                </div>
              ) : bookingsData?.bookings && bookingsData.bookings.length > 0 ? (
                <div className="portal-table-container">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Facility</th>
                        <th>Crop</th>
                        <th>Quantity (qtl)</th>
                        <th>Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsData.bookings.map((b) => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td>{b.facility_name || `Facility #${b.facility_id}`}</td>
                          <td>{b.crop_name}</td>
                          <td>{b.quantity_quintals}</td>
                          <td>{b.start_date} to {b.end_date}</td>
                          <td>
                            <span className={`portal-status-badge status-${b.status}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="portal-empty-state">
                  <div className="portal-empty-icon">📋</div>
                  <h3>No Incoming Booking Requests</h3>
                  <p>
                    {bookingsData?.notice ||
                      'No storage booking requests currently assigned to your facilities.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Edit Profile Modal ── */}
      {isEditModalOpen && (
        <div className="portal-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <h3>✏️ Edit Warehouse Company Profile</h3>
              <button
                type="button"
                className="portal-modal-close"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="portal-modal-body">
                {saveSuccess && <div className="portal-success-banner">{saveSuccess}</div>}
                {saveError && <div className="portal-error-banner">{saveError}</div>}

                <div className="portal-form-group">
                  <label htmlFor="company_name">Company / Firm Name *</label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    className="portal-form-input"
                    value={editFormData.company_name}
                    onChange={handleEditChange}
                    placeholder="e.g. Kisan Cold Chain Ltd."
                    required
                  />
                </div>

                <div className="portal-form-group">
                  <label htmlFor="gstin">GSTIN Number</label>
                  <input
                    type="text"
                    id="gstin"
                    name="gstin"
                    className="portal-form-input"
                    value={editFormData.gstin}
                    onChange={handleEditChange}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="portal-modal-footer">
                <button
                  type="button"
                  className="portal-btn btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="portal-btn btn-save"
                  style={{ background: '#d97706' }}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
