import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authFetch } from '../../services/authFetch.js';
import '../../pageStyles/portal.css';

export default function FarmerDashboardPage() {
  const { user, logout, logoutAll } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Dashboard Summary State
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detailed Tab States
  const [insuranceData, setInsuranceData] = useState(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [loanData, setLoanData] = useState(null);
  const [loanLoading, setLoanLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [schemeData, setSchemeData] = useState(null);
  const [schemeLoading, setSchemeLoading] = useState(false);

  // Financial History State
  const [financialHistory, setFinancialHistory] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Search, Filter & Detail Inspection States
  const [insuranceSearch, setInsuranceSearch] = useState('');
  const [insuranceStatusFilter, setInsuranceStatusFilter] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState(null);

  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    state: '',
    district: '',
    village: '',
    farmer_category: 'small',
    land_holding_ha: '',
    primary_crop: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/api/farmers/me/dashboard');
      setDashboardData(data);
      if (data.profile) {
        setEditFormData({
          name: data.profile.name || '',
          state: data.profile.state || '',
          district: data.profile.district || '',
          village: data.profile.village || '',
          farmer_category: data.profile.farmer_category || 'small',
          land_holding_ha: data.profile.land_holding_ha !== null ? String(data.profile.land_holding_ha) : '',
          primary_crop: data.profile.primary_crop || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load farmer dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFinancialHistory = useCallback(async () => {
    setFinancialLoading(true);
    try {
      const data = await authFetch('/api/farmers/me/financial-history');
      setFinancialHistory(data);
    } catch {
      // supplementary financial summary
    } finally {
      setFinancialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    loadFinancialHistory();
  }, [fetchDashboard, loadFinancialHistory]);

  // Lazy tab loaders
  const loadInsurance = async () => {
    if (insuranceData) return;
    setInsuranceLoading(true);
    try {
      const data = await authFetch('/api/farmers/me/insurance');
      setInsuranceData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setInsuranceLoading(false);
    }
  };

  const loadLoans = async () => {
    if (loanData) return;
    setLoanLoading(true);
    try {
      const data = await authFetch('/api/farmers/me/loans');
      setLoanData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoanLoading(false);
    }
  };

  const loadBookings = async () => {
    if (bookingData) return;
    setBookingLoading(true);
    try {
      const data = await authFetch('/api/farmers/me/bookings');
      setBookingData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const loadSchemes = async () => {
    if (schemeData) return;
    setSchemeLoading(true);
    try {
      const data = await authFetch('/api/farmers/me/schemes');
      setSchemeData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSchemeLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'insurance') loadInsurance();
    if (tab === 'loans') loadLoans();
    if (tab === 'storage') loadBookings();
    if (tab === 'schemes') loadSchemes();
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const payload = {
        name: editFormData.name.trim() || undefined,
        state: editFormData.state.trim() || undefined,
        district: editFormData.district.trim() || undefined,
        village: editFormData.village.trim() || undefined,
        farmer_category: editFormData.farmer_category || undefined,
        land_holding_ha: editFormData.land_holding_ha ? parseFloat(editFormData.land_holding_ha) : undefined,
        primary_crop: editFormData.primary_crop.trim() || undefined,
      };
      await authFetch('/api/farmers/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setSaveSuccess('Profile updated successfully.');
      setIsEditModalOpen(false);
      fetchDashboard();
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const maskMobile = (mob) => {
    if (!mob || mob.length < 10) return mob || '—';
    return mob.slice(0, 2) + '••••••' + mob.slice(-2);
  };

  const profile = dashboardData?.profile;

  return (
    <div className="portal-wrapper">
      {/* ── Hero Banner ── */}
      <div className="portal-hero-banner">
        <div>
          <span className="portal-badge-pill">🌾 Verified Farmer Portal</span>
          <h1 className="portal-hero-title">
            Namaste, {profile?.name || user?.mobile || 'Kisan Bandhu'}
          </h1>
          <p className="portal-hero-subtitle">
            <span>📱 Mobile: {maskMobile(user?.mobile)}</span>
            {user?.email && <span>✉️ {user.email}</span>}
            {profile?.village && profile?.state && (
              <span>📍 {profile.village}, {profile.district ? `${profile.district}, ` : ''}{profile.state}</span>
            )}
          </p>
        </div>
        <div className="portal-hero-actions">
          <button
            type="button"
            className="portal-hero-btn primary"
            onClick={() => setIsEditModalOpen(true)}
          >
            ✏️ Edit Profile
          </button>
          <button
            type="button"
            className="portal-hero-btn secondary"
            onClick={logout}
          >
            Sign Out
          </button>
          <button
            type="button"
            className="portal-hero-btn danger"
            onClick={logoutAll}
          >
            Sign Out All
          </button>
        </div>
      </div>

      {/* ── Feedback Banners ── */}
      {error && <div className="portal-error-banner">⚠️ {error}</div>}
      {saveSuccess && <div className="portal-success-banner">✅ {saveSuccess}</div>}

      {/* ── Navigation Tabs ── */}
      <div className="portal-tabs-nav">
        <button
          className={`portal-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`portal-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          👤 My Profile
        </button>
        <button
          className={`portal-tab-item ${activeTab === 'insurance' ? 'active' : ''}`}
          onClick={() => handleTabChange('insurance')}
        >
          🛡️ Crop Insurance ({dashboardData?.total_insurance_requests || 0})
        </button>
        <button
          className={`portal-tab-item ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => handleTabChange('loans')}
        >
          💰 Loans & Credit ({dashboardData?.total_loan_applications || 0})
        </button>
        <button
          className={`portal-tab-item ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => handleTabChange('storage')}
        >
          📦 Storage Bookings ({dashboardData?.total_storage_bookings || 0})
        </button>
        <button
          className={`portal-tab-item ${activeTab === 'schemes' ? 'active' : ''}`}
          onClick={() => handleTabChange('schemes')}
        >
          📜 Welfare Schemes
        </button>
      </div>

      {loading ? (
        <div className="portal-loading">
          <div className="portal-spinner" />
          <p>Loading farmer dashboard...</p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════
             TAB 1: OVERVIEW
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* Stat Cards Grid */}
              <div className="portal-stats-grid">
                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap green">🌾</div>
                  <div className="portal-stat-info">
                    <h3>{profile?.profile_completion_percent || 0}%</h3>
                    <p>Profile Completed</p>
                  </div>
                </div>

                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap blue">🛡️</div>
                  <div className="portal-stat-info">
                    <h3>{dashboardData?.total_insurance_requests || 0}</h3>
                    <p>Insurance Claims ({dashboardData?.pending_insurance_requests || 0} pending)</p>
                  </div>
                </div>

                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap purple">💰</div>
                  <div className="portal-stat-info">
                    <h3>{dashboardData?.total_loan_applications || 0}</h3>
                    <p>Loan Requests ({dashboardData?.pending_loan_applications || 0} under review)</p>
                  </div>
                </div>

                <div className="portal-stat-card">
                  <div className="portal-stat-icon-wrap teal">📦</div>
                  <div className="portal-stat-info">
                    <h3>{dashboardData?.total_storage_bookings || 0}</h3>
                    <p>Storage Bookings ({dashboardData?.active_storage_bookings || 0} active)</p>
                  </div>
                </div>
              </div>

              {/* Consolidated Financial History Summary */}
              {financialHistory?.summary && (
                <div className="portal-card-box" style={{ background: '#f8fafc', border: '1px solid var(--portal-border)' }}>
                  <div className="portal-card-box-header">
                    <h2>💳 Financial History & Claim Benefits</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="portal-btn btn-cancel" onClick={() => handleTabChange('insurance')}>Insurance Records</button>
                      <button className="portal-btn btn-cancel" onClick={() => handleTabChange('loans')}>Loan Records</button>
                    </div>
                  </div>
                  <div className="portal-stats-grid" style={{ marginBottom: 0 }}>
                    <div className="portal-stat-card">
                      <div className="portal-stat-icon-wrap blue">🛡️</div>
                      <div className="portal-stat-info">
                        <h3>₹{Number(financialHistory.summary.approved_insurance_amount || 0).toLocaleString('en-IN')}</h3>
                        <p>Approved Claims Payout</p>
                        <small style={{ color: 'var(--portal-text-muted)' }}>{financialHistory.summary.total_insurance_requests} total ({financialHistory.summary.pending_insurance_requests} pending)</small>
                      </div>
                    </div>
                    <div className="portal-stat-card">
                      <div className="portal-stat-icon-wrap purple">💰</div>
                      <div className="portal-stat-info">
                        <h3>₹{Number(financialHistory.summary.approved_loan_amount || 0).toLocaleString('en-IN')}</h3>
                        <p>Approved Credit Disbursal</p>
                        <small style={{ color: 'var(--portal-text-muted)' }}>{financialHistory.summary.total_loan_applications} total ({financialHistory.summary.pending_loan_applications} under review)</small>
                      </div>
                    </div>
                    <div className="portal-stat-card">
                      <div className="portal-stat-icon-wrap green">✅</div>
                      <div className="portal-stat-info">
                        <h3>₹{Number((financialHistory.summary.approved_insurance_amount || 0) + (financialHistory.summary.approved_loan_amount || 0)).toLocaleString('en-IN')}</h3>
                        <p>Consolidated Net Benefit</p>
                        <small style={{ color: 'var(--portal-text-muted)' }}>Approved Insurance + Credit</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions Grid */}
              <div className="portal-card-box">
                <div className="portal-card-box-header">
                  <h2>🚀 Quick Access Tools</h2>
                </div>
                <div className="portal-actions-grid">
                  <Link to="/storage" className="portal-action-tile">
                    <h4>🏬 Digital Storage Finder</h4>
                    <p>Locate verified cold storage and warehouses near your farm.</p>
                  </Link>

                  <Link to="/insurance" className="portal-action-tile">
                    <h4>🌾 PMFBY Crop Insurance</h4>
                    <p>Submit crop loss claims and calculate premium subsidies.</p>
                  </Link>

                  <Link to="/schemes" className="portal-action-tile">
                    <h4>📜 Government Schemes</h4>
                    <p>Explore central & state subsidies tailored to your landholding.</p>
                  </Link>

                  <Link to="/financial" className="portal-action-tile">
                    <h4>💰 Financial Assistance</h4>
                    <p>KCC loan eligibility calculator and debt relief options.</p>
                  </Link>

                  <Link to="/ml-crop-advisor" className="portal-action-tile">
                    <h4>🤖 ML Crop Advisor</h4>
                    <p>Data-driven yield prediction based on your soil NPK & weather.</p>
                  </Link>

                  <Link to="/gemini-advisor" className="portal-action-tile">
                    <h4>💬 AI Farming Assistant</h4>
                    <p>Ask real-time crop disease, pest, and market questions in Hindi/English.</p>
                  </Link>

                  <Link to="/mental-health" className="portal-action-tile">
                    <h4>🧠 Wellness Support</h4>
                    <p>Confidential counseling and mental health care for farming stress.</p>
                  </Link>

                  <Link to="/status-tracking" className="portal-action-tile">
                    <h4>🔍 Application Tracker</h4>
                    <p>Track the real-time processing status of your submitted requests.</p>
                  </Link>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="portal-section-grid">
                {/* Recent Insurance & Loans */}
                <div className="portal-card-box">
                  <div className="portal-card-box-header">
                    <h2>🛡️ Recent Insurance Requests</h2>
                    <button className="portal-btn btn-cancel" onClick={() => handleTabChange('insurance')}>View All</button>
                  </div>
                  {dashboardData?.recent_insurance?.length === 0 ? (
                    <div className="portal-empty-state">
                      <div className="portal-empty-icon">🛡️</div>
                      <h3>No Insurance Requests</h3>
                      <p>You have not submitted any crop insurance enrollments or claims yet.</p>
                      <Link to="/insurance" className="portal-btn btn-save">Apply for Insurance</Link>
                    </div>
                  ) : (
                    <div className="portal-table-container">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Crop</th>
                            <th>District</th>
                            <th>Status</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData?.recent_insurance?.map((r) => (
                            <tr key={r.id}>
                              <td><strong>{r.request_type || 'Insurance'}</strong></td>
                              <td>{r.crop_name || '—'}</td>
                              <td>{r.district || '—'}</td>
                              <td><span className={`portal-status-badge status-${r.req_status}`}>{r.req_status}</span></td>
                              <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Profile Summary Card */}
                <div className="portal-card-box">
                  <div className="portal-card-box-header">
                    <h2>👤 Profile Snapshot</h2>
                  </div>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div><strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{profile?.farmer_category || 'Not specified'}</span></div>
                    <div><strong>Landholding:</strong> {profile?.land_holding_ha ? `${profile.land_holding_ha} Hectares` : 'Not recorded'}</div>
                    <div><strong>Primary Crop:</strong> {profile?.primary_crop || 'Not specified'}</div>
                    <div><strong>Aadhaar Linked:</strong> {profile?.aadhaar_linked ? '✅ Linked' : '❌ Unlinked'}</div>
                    <div><strong>Bank Linked:</strong> {profile?.bank_linked ? '✅ Linked' : '❌ Unlinked'}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 2: MY PROFILE
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="portal-card-box">
              <div className="portal-card-box-header">
                <h2>👤 Farmer Profile Details</h2>
                <button className="portal-btn btn-save" onClick={() => setIsEditModalOpen(true)}>✏️ Edit Profile</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="portal-card-box" style={{ background: '#f8fafc', margin: 0 }}>
                  <h4 style={{ margin: '0 0 12px', color: 'var(--portal-primary)' }}>Personal Information</h4>
                  <p><strong>Full Name:</strong> {profile?.name || '—'}</p>
                  <p><strong>Registered Mobile:</strong> {user?.mobile || '—'}</p>
                  <p><strong>Email:</strong> {user?.email || '—'}</p>
                  <p><strong>Farmer ID:</strong> #{profile?.farmer_id}</p>
                </div>

                <div className="portal-card-box" style={{ background: '#f8fafc', margin: 0 }}>
                  <h4 style={{ margin: '0 0 12px', color: 'var(--portal-primary)' }}>Farm Location & Land</h4>
                  <p><strong>Village:</strong> {profile?.village || '—'}</p>
                  <p><strong>District:</strong> {profile?.district || '—'}</p>
                  <p><strong>State:</strong> {profile?.state || '—'}</p>
                  <p><strong>Land Size:</strong> {profile?.land_holding_ha ? `${profile.land_holding_ha} Hectares` : '—'}</p>
                  <p><strong>Farmer Category:</strong> <span style={{ textTransform: 'capitalize' }}>{profile?.farmer_category || '—'}</span></p>
                </div>

                <div className="portal-card-box" style={{ background: '#f8fafc', margin: 0 }}>
                  <h4 style={{ margin: '0 0 12px', color: 'var(--portal-primary)' }}>Agriculture & Verification</h4>
                  <p><strong>Primary Crop:</strong> {profile?.primary_crop || '—'}</p>
                  <p><strong>Aadhaar Linkage:</strong> {profile?.aadhaar_linked ? '✅ Verified & Linked' : '⚠️ Pending Verification'}</p>
                  <p><strong>Bank Account:</strong> {profile?.bank_linked ? '✅ Active DBT Account' : '⚠️ Linkage Pending'}</p>
                  <p><strong>Profile Completeness:</strong> {profile?.profile_completion_percent || 0}%</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 3: INSURANCE
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'insurance' && (() => {
            const filteredRequests = (insuranceData?.requests || []).filter((r) => {
              if (insuranceStatusFilter && r.req_status !== insuranceStatusFilter) return false;
              if (insuranceSearch.trim()) {
                const q = insuranceSearch.toLowerCase();
                const matchCrop = (r.crop_name || '').toLowerCase().includes(q);
                const matchType = (r.request_type || '').toLowerCase().includes(q);
                const matchDistrict = (r.district || '').toLowerCase().includes(q);
                const matchId = String(r.id).includes(q);
                return matchCrop || matchType || matchDistrict || matchId;
              }
              return true;
            });

            return (
              <div className="portal-card-box">
                <div className="portal-card-box-header">
                  <h2>🛡️ My Crop Insurance Applications</h2>
                  <Link to="/insurance" className="portal-btn btn-save">New Claim / Enrollment</Link>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="portal-form-input"
                    style={{ maxWidth: '300px' }}
                    placeholder="Search by crop, type, or ID..."
                    value={insuranceSearch}
                    onChange={(e) => setInsuranceSearch(e.target.value)}
                  />
                  <select
                    className="portal-form-select"
                    style={{ maxWidth: '200px' }}
                    value={insuranceStatusFilter}
                    onChange={(e) => setInsuranceStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {insuranceLoading ? (
                  <div className="portal-loading"><div className="portal-spinner" /><p>Loading insurance records...</p></div>
                ) : filteredRequests.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="portal-empty-icon">🌾</div>
                    <h3>No Insurance Requests Found</h3>
                    <p>{insuranceData?.requests?.length ? 'No requests match your search or filter.' : 'You have not submitted any PMFBY enrollments or crop damage claims.'}</p>
                    <Link to="/insurance" className="portal-btn btn-save">Apply for PMFBY Coverage</Link>
                  </div>
                ) : (
                  <div className="portal-table-container">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Request Type</th>
                          <th>Crop</th>
                          <th>District</th>
                          <th>Status</th>
                          <th>Submitted At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((r) => (
                          <tr key={r.id}>
                            <td>#{r.id}</td>
                            <td><strong>{r.request_type}</strong></td>
                            <td>{r.crop_name || '—'}</td>
                            <td>{r.district || '—'}</td>
                            <td><span className={`portal-status-badge status-${r.req_status}`}>{r.req_status}</span></td>
                            <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                            <td>
                              <button
                                className="portal-btn btn-cancel"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                onClick={() => setSelectedInsurance(r)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 4: LOANS & CREDIT
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'loans' && (() => {
            const filteredApplications = (loanData?.applications || []).filter((l) => {
              if (loanStatusFilter && l.app_status !== loanStatusFilter) return false;
              if (loanSearch.trim()) {
                const q = loanSearch.toLowerCase();
                const matchType = (l.loan_type || '').toLowerCase().includes(q);
                const matchPurpose = (l.purpose || '').toLowerCase().includes(q);
                const matchId = String(l.id).includes(q);
                return matchType || matchPurpose || matchId;
              }
              return true;
            });

            return (
              <div className="portal-card-box">
                <div className="portal-card-box-header">
                  <h2>💰 My Loan & Financial Applications</h2>
                  <Link to="/financial" className="portal-btn btn-save">Apply for KCC Loan</Link>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="portal-form-input"
                    style={{ maxWidth: '300px' }}
                    placeholder="Search by loan type, purpose, or ID..."
                    value={loanSearch}
                    onChange={(e) => setLoanSearch(e.target.value)}
                  />
                  <select
                    className="portal-form-select"
                    style={{ maxWidth: '200px' }}
                    value={loanStatusFilter}
                    onChange={(e) => setLoanStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {loanLoading ? (
                  <div className="portal-loading"><div className="portal-spinner" /><p>Loading loan applications...</p></div>
                ) : filteredApplications.length === 0 ? (
                  <div className="portal-empty-state">
                    <div className="portal-empty-icon">💰</div>
                    <h3>No Loan Applications Found</h3>
                    <p>{loanData?.applications?.length ? 'No applications match your search or filter.' : 'You have not applied for any agricultural loans or equipment financing.'}</p>
                    <Link to="/financial" className="portal-btn btn-save">Explore Financial Assistance</Link>
                  </div>
                ) : (
                  <div className="portal-table-container">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Loan Type</th>
                          <th>Amount (₹)</th>
                          <th>Purpose</th>
                          <th>Status</th>
                          <th>Submitted At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((l) => (
                          <tr key={l.id}>
                            <td>#{l.id}</td>
                            <td><strong>{l.loan_type}</strong></td>
                            <td>₹{Number(l.loan_amount).toLocaleString('en-IN')}</td>
                            <td>{l.purpose || '—'}</td>
                            <td><span className={`portal-status-badge status-${l.app_status}`}>{l.app_status.replace('_', ' ')}</span></td>
                            <td>{l.submitted_at ? new Date(l.submitted_at).toLocaleDateString() : '—'}</td>
                            <td>
                              <button
                                className="portal-btn btn-cancel"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                onClick={() => setSelectedLoan(l)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 5: DIGITAL STORAGE
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'storage' && (
            <div className="portal-card-box">
              <div className="portal-card-box-header">
                <h2>📦 My Warehouse & Cold Storage Bookings</h2>
                <Link to="/storage" className="portal-btn btn-save">Find Nearby Storage</Link>
              </div>

              {bookingLoading ? (
                <div className="portal-loading"><div className="portal-spinner" /><p>Loading storage bookings...</p></div>
              ) : bookingData?.bookings?.length === 0 ? (
                <div className="portal-empty-state">
                  <div className="portal-empty-icon">🏬</div>
                  <h3>No Active Bookings</h3>
                  <p>You do not currently have any cold storage or warehouse reservations.</p>
                  <Link to="/storage" className="portal-btn btn-save">Book Storage Slot</Link>
                </div>
              ) : (
                <div className="portal-table-container">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Booking Ref</th>
                        <th>Facility</th>
                        <th>Crop</th>
                        <th>Quantity (kg)</th>
                        <th>Duration</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData?.bookings?.map((b) => (
                        <tr key={b.id}>
                          <td><code>{b.booking_ref}</code></td>
                          <td><strong>{b.facility_name || 'Standard Facility'}</strong></td>
                          <td>{b.crop_type || '—'}</td>
                          <td>{b.quantity_kg} kg</td>
                          <td>{b.duration_months} mo.</td>
                          <td>₹{b.total_amount ? Number(b.total_amount).toLocaleString('en-IN') : '—'}</td>
                          <td><span className={`portal-status-badge status-${b.booking_status}`}>{b.booking_status}</span></td>
                          <td>{b.booked_at ? new Date(b.booked_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 6: WELFARE SCHEMES
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'schemes' && (
            <div>
              <div className="portal-card-box">
                <div className="portal-card-box-header">
                  <h2>📜 Active Welfare & Subsidy Schemes</h2>
                  <Link to="/schemes" className="portal-btn btn-save">Check Scheme Eligibility</Link>
                </div>

                {schemeLoading ? (
                  <div className="portal-loading"><div className="portal-spinner" /><p>Loading schemes...</p></div>
                ) : (
                  <div className="portal-actions-grid">
                    {schemeData?.schemes?.map((s) => (
                      <div key={s.id} className="portal-action-tile" style={{ cursor: 'default' }}>
                        <h4>📜 {s.name}</h4>
                        <p>{s.benefit_summary || 'Provides direct support to agricultural producers.'}</p>
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="portal-badge-pill" style={{ background: '#dcfce7', color: '#166534', border: 'none' }}>
                            {s.scheme_type === 'central' ? '🇮🇳 Central Scheme' : '🏛️ State Scheme'}
                          </span>
                          {s.storage_benefit_per_kg > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }}>
                              ₹{s.storage_benefit_per_kg}/kg subsidy
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Eligibility Checks */}
              {schemeData?.past_checks?.length > 0 && (
                <div className="portal-card-box">
                  <div className="portal-card-box-header">
                    <h2>🔍 My Past Scheme Eligibility Checks</h2>
                  </div>
                  <div className="portal-table-container">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Scheme</th>
                          <th>Category</th>
                          <th>Land (ha)</th>
                          <th>Season</th>
                          <th>Eligibility</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schemeData.past_checks.map((c) => (
                          <tr key={c.id}>
                            <td><strong>{c.scheme_name || 'Agricultural Welfare Scheme'}</strong></td>
                            <td style={{ textTransform: 'capitalize' }}>{c.farmer_category || '—'}</td>
                            <td>{c.land_ha || '—'} ha</td>
                            <td>{c.crop_season || '—'}</td>
                            <td>
                              <span className={`portal-status-badge ${c.is_eligible ? 'status-approved' : 'status-rejected'}`}>
                                {c.is_eligible ? 'Eligible' : 'Not Eligible'}
                              </span>
                            </td>
                            <td>{c.result_message || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              <h3>✏️ Edit Farmer Profile</h3>
              <button className="portal-modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleProfileSave}>
              <div className="portal-modal-body">
                {saveError && <div className="portal-error-banner">⚠️ {saveError}</div>}

                <div className="portal-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="portal-form-input"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="portal-form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    className="portal-form-input"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    required
                  />
                </div>

                <div className="portal-form-group">
                  <label>District</label>
                  <input
                    type="text"
                    className="portal-form-input"
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                  />
                </div>

                <div className="portal-form-group">
                  <label>Village</label>
                  <input
                    type="text"
                    className="portal-form-input"
                    value={editFormData.village}
                    onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                  />
                </div>

                <div className="portal-form-group">
                  <label>Farmer Category</label>
                  <select
                    className="portal-form-select"
                    value={editFormData.farmer_category}
                    onChange={(e) => setEditFormData({ ...editFormData, farmer_category: e.target.value })}
                  >
                    <option value="small">Small Farmer (&lt; 2 Hectares)</option>
                    <option value="marginal">Marginal Farmer (&lt; 1 Hectare)</option>
                    <option value="large">Large Farmer (&gt; 2 Hectares)</option>
                  </select>
                </div>

                <div className="portal-form-group">
                  <label>Total Landholding (Hectares)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="portal-form-input"
                    value={editFormData.land_holding_ha}
                    onChange={(e) => setEditFormData({ ...editFormData, land_holding_ha: e.target.value })}
                    placeholder="e.g. 2.50"
                  />
                </div>

                <div className="portal-form-group">
                  <label>Primary Crop</label>
                  <input
                    type="text"
                    className="portal-form-input"
                    value={editFormData.primary_crop}
                    onChange={(e) => setEditFormData({ ...editFormData, primary_crop: e.target.value })}
                    placeholder="e.g. Wheat, Rice, Cotton"
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
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Insurance Detail Inspection Modal ── */}
      {selectedInsurance && (
        <div className="portal-modal-overlay" onClick={() => setSelectedInsurance(null)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <h3>🛡️ Insurance Application #{selectedInsurance.id}</h3>
              <button className="portal-modal-close" onClick={() => setSelectedInsurance(null)}>✕</button>
            </div>
            <div className="portal-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Request Type</label><div style={{ fontWeight: 600 }}>{selectedInsurance.request_type}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Crop</label><div style={{ fontWeight: 600 }}>{selectedInsurance.crop_name || '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>District</label><div style={{ fontWeight: 600 }}>{selectedInsurance.district || '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Status</label><div><span className={`portal-status-badge status-${selectedInsurance.req_status}`}>{selectedInsurance.req_status}</span></div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Policy Number</label><div>{selectedInsurance.policy_number || '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Land Size (ha)</label><div>{selectedInsurance.land_size_ha != null ? `${selectedInsurance.land_size_ha} ha` : '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Sum Insured</label><div>{selectedInsurance.sum_insured != null ? `₹${Number(selectedInsurance.sum_insured).toLocaleString('en-IN')}` : '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Premium Amount</label><div>{selectedInsurance.premium_amount != null ? `₹${Number(selectedInsurance.premium_amount).toLocaleString('en-IN')}` : '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Claim Status</label><div>{selectedInsurance.claim_status || '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Submitted Date</label><div>{selectedInsurance.submitted_at ? new Date(selectedInsurance.submitted_at).toLocaleString() : '—'}</div></div>
              </div>
              {selectedInsurance.description && (
                <div style={{ marginTop: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--portal-text-muted)' }}>Damage Description / Notes</label>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{selectedInsurance.description}</p>
                </div>
              )}
            </div>
            <div className="portal-modal-footer">
              <button type="button" className="portal-btn btn-cancel" onClick={() => setSelectedInsurance(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loan Detail Inspection Modal ── */}
      {selectedLoan && (
        <div className="portal-modal-overlay" onClick={() => setSelectedLoan(null)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <h3>💰 Loan Application #{selectedLoan.id}</h3>
              <button className="portal-modal-close" onClick={() => setSelectedLoan(null)}>✕</button>
            </div>
            <div className="portal-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Loan Type</label><div style={{ fontWeight: 600 }}>{selectedLoan.loan_type}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Amount</label><div style={{ fontWeight: 600, color: 'var(--portal-primary)' }}>₹{Number(selectedLoan.loan_amount).toLocaleString('en-IN')}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Status</label><div><span className={`portal-status-badge status-${selectedLoan.app_status}`}>{selectedLoan.app_status.replace('_', ' ')}</span></div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Submitted Date</label><div>{selectedLoan.submitted_at ? new Date(selectedLoan.submitted_at).toLocaleString() : '—'}</div></div>
                <div><label style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>Reviewed Date</label><div>{selectedLoan.reviewed_at ? new Date(selectedLoan.reviewed_at).toLocaleString() : '—'}</div></div>
              </div>
              {selectedLoan.purpose && (
                <div style={{ marginTop: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--portal-text-muted)' }}>Loan Purpose</label>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{selectedLoan.purpose}</p>
                </div>
              )}
              {selectedLoan.remarks && (
                <div style={{ marginTop: '14px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>Officer Remarks</label>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#78350f' }}>{selectedLoan.remarks}</p>
                </div>
              )}
            </div>
            <div className="portal-modal-footer">
              <button type="button" className="portal-btn btn-cancel" onClick={() => setSelectedLoan(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
