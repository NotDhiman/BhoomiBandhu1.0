import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authFetch } from '../../services/authFetch.js';
import '../../pageStyles/admin.css';

const API = '/api/admin';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'pending', label: 'Pending Approvals', icon: '⏳' },
  { key: 'users', label: 'All Users', icon: '👥' },
  { key: 'insurance', label: 'Insurance Requests', icon: '🛡️' },
  { key: 'loans', label: 'Loan Applications', icon: '💰' },
  { key: 'mental_health', label: 'Mental Health', icon: '🧠' },
];

// ── Confirmation Modal ──
function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading, showReason }) {
  const [reason, setReason] = useState('');
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        {showReason && (
          <textarea
            className="admin-modal-input"
            placeholder="Reason (optional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
          />
        )}
        <div className="admin-modal-actions">
          <button className="admin-modal-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className={`admin-modal-confirm ${confirmClass}`}
            onClick={() => onConfirm(reason)}
            disabled={loading}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Select Modal ──
function StatusModal({ title, options, onConfirm, onCancel, loading }) {
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <select
          className="admin-filter-select"
          style={{ width: '100%', marginBottom: 14 }}
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">Select status...</option>
          {options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
        </select>
        <textarea
          className="admin-modal-input"
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />
        <div className="admin-modal-actions">
          <button className="admin-modal-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className="admin-modal-confirm confirm-status"
            onClick={() => onConfirm(selected, notes)}
            disabled={loading || !selected}
          >
            {loading ? '...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overview Section ──
function OverviewSection({ stats, loading, error }) {
  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading statistics...</p></div>;
  if (error) return <div className="admin-error-banner">⚠️ {error}</div>;
  if (!stats) return null;

  const cards = [
    { label: 'Total Farmers', value: stats.total_farmers, icon: '🌾', color: 'green' },
    { label: 'Pending Approvals', value: stats.pending_approvals, icon: '⏳', color: 'amber' },
    { label: 'Insurance Requests', value: stats.total_insurance_requests, icon: '🛡️', color: 'blue', sub: `${stats.pending_insurance_requests} pending` },
    { label: 'Loan Applications', value: stats.total_loan_applications, icon: '💰', color: 'purple', sub: `${stats.pending_loan_applications} pending` },
    { label: 'Mental Health', value: stats.total_mental_health_requests, icon: '🧠', color: 'rose', sub: `${stats.pending_mental_health_requests} pending` },
    { label: 'Storage Bookings', value: stats.total_storage_bookings, icon: '📦', color: 'teal', sub: `${stats.active_storage_bookings} active` },
  ];

  return (
    <>
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
        <p>Platform-wide statistics at a glance</p>
      </div>
      <div className="admin-stats-grid">
        {cards.map(c => (
          <div className="admin-stat-card" data-color={c.color} key={c.label}>
            <div className="admin-stat-icon">{c.icon}</div>
            <div className="admin-stat-info">
              <h3>{c.value}</h3>
              <p>{c.label}</p>
              {c.sub && <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Pending Approvals Section ──
function PendingApprovalsSection({ onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('psychiatrists');
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API}/pending-approvals`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (userId, action, reason) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await authFetch(`${API}/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: action, reason: reason || undefined }),
      });
      setSuccess(`User ${userId} ${action === 'active' ? 'approved' : 'rejected'} successfully.`);
      setModal(null);
      fetchPending();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading pending approvals...</p></div>;

  return (
    <>
      <div className="admin-page-header">
        <h1>Pending Approvals</h1>
        <p>Review and approve professional registrations</p>
      </div>
      {error && <div className="admin-error-banner">⚠️ {error}</div>}
      {success && <div className="admin-success-banner">✅ {success}</div>}

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'psychiatrists' ? 'active' : ''}`} onClick={() => setTab('psychiatrists')}>
          Psychiatrists ({data?.psychiatrists?.length || 0})
        </button>
        <button className={`admin-tab ${tab === 'warehouse_owners' ? 'active' : ''}`} onClick={() => setTab('warehouse_owners')}>
          Warehouse Owners ({data?.warehouse_owners?.length || 0})
        </button>
      </div>

      {tab === 'psychiatrists' && (
        data?.psychiatrists?.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🧠</div>
            <h3>No pending psychiatrists</h3>
            <p>All psychiatrist registrations have been reviewed.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>License No.</th>
                  <th>Specialization</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.psychiatrists?.map(p => (
                  <tr key={p.user_id}>
                    <td>{p.user_id}</td>
                    <td>{p.email || '—'}</td>
                    <td><strong>{p.license_number}</strong></td>
                    <td>{p.specialization || '—'}</td>
                    <td>{p.registration_date ? new Date(p.registration_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-approve" disabled={actionLoading}
                          onClick={() => setModal({ type: 'approve', userId: p.user_id, name: p.email || `#${p.user_id}` })}>
                          ✓ Approve
                        </button>
                        <button className="admin-btn admin-btn-reject" disabled={actionLoading}
                          onClick={() => setModal({ type: 'reject', userId: p.user_id, name: p.email || `#${p.user_id}` })}>
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'warehouse_owners' && (
        data?.warehouse_owners?.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🏬</div>
            <h3>No pending warehouse owners</h3>
            <p>All warehouse owner registrations have been reviewed.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>GSTIN</th>
                  <th>Mobile</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.warehouse_owners?.map(w => (
                  <tr key={w.user_id}>
                    <td>{w.user_id}</td>
                    <td>{w.email || '—'}</td>
                    <td><strong>{w.company_name}</strong></td>
                    <td>{w.gstin || '—'}</td>
                    <td>{w.contact_mobile || '—'}</td>
                    <td>{w.registration_date ? new Date(w.registration_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-approve" disabled={actionLoading}
                          onClick={() => setModal({ type: 'approve', userId: w.user_id, name: w.company_name })}>
                          ✓ Approve
                        </button>
                        <button className="admin-btn admin-btn-reject" disabled={actionLoading}
                          onClick={() => setModal({ type: 'reject', userId: w.user_id, name: w.company_name })}>
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {modal?.type === 'approve' && (
        <ConfirmModal
          title="Approve Professional"
          message={`Are you sure you want to approve "${modal.name}"? They will gain full platform access.`}
          confirmLabel="Approve"
          confirmClass="confirm-approve"
          onConfirm={(reason) => handleAction(modal.userId, 'active', reason)}
          onCancel={() => setModal(null)}
          loading={actionLoading}
          showReason={false}
        />
      )}
      {modal?.type === 'reject' && (
        <ConfirmModal
          title="Reject Professional"
          message={`Are you sure you want to reject "${modal.name}"? This will deactivate their account.`}
          confirmLabel="Reject"
          confirmClass="confirm-reject"
          onConfirm={(reason) => handleAction(modal.userId, 'rejected', reason)}
          onCancel={() => setModal(null)}
          loading={actionLoading}
          showReason={true}
        />
      )}
    </>
  );
}

// ── All Users Section ──
function AllUsersSection({ onRefresh }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await authFetch(`${API}/users?${params}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleViewUser = async (userId) => {
    setViewLoading(true);
    try {
      const res = await authFetch(`${API}/users/${userId}`);
      setViewUser(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setViewLoading(false);
    }
  };

  const handleStatusAction = async (userId, newStatus, reason) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await authFetch(`${API}/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason: reason || undefined }),
      });
      setSuccess(`User ${userId} status changed to "${newStatus}".`);
      setModal(null);
      fetchUsers();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  if (viewUser) {
    return (
      <>
        <button className="admin-back-btn" onClick={() => setViewUser(null)}>← Back to Users</button>
        <div className="admin-detail-panel">
          <h3>👤 User #{viewUser.id}</h3>
          <div className="admin-detail-grid">
            <div className="admin-detail-field"><label>Email</label><span>{viewUser.email || '—'}</span></div>
            <div className="admin-detail-field"><label>Mobile</label><span>{viewUser.mobile}</span></div>
            <div className="admin-detail-field"><label>Role</label><span>{viewUser.role}</span></div>
            <div className="admin-detail-field">
              <label>Status</label>
              <span className={`admin-status-badge status-${viewUser.account_status}`}>{viewUser.account_status}</span>
            </div>
            <div className="admin-detail-field"><label>Verified</label><span>{viewUser.is_verified ? '✅ Yes' : '❌ No'}</span></div>
            <div className="admin-detail-field"><label>Registered</label><span>{viewUser.created_at ? new Date(viewUser.created_at).toLocaleString() : '—'}</span></div>
          </div>
          {viewUser.profile && (
            <div style={{ marginTop: 20 }}>
              <h3>📋 Profile Details</h3>
              <div className="admin-detail-grid">
                {Object.entries(viewUser.profile).map(([k, v]) => (
                  <div className="admin-detail-field" key={k}>
                    <label>{k.replace(/_/g, ' ')}</label>
                    <span>{v != null ? String(v) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>All Users</h1>
        <p>Manage platform user accounts</p>
      </div>
      {error && <div className="admin-error-banner">⚠️ {error}</div>}
      {success && <div className="admin-success-banner">✅ {success}</div>}

      <div className="admin-filters">
        <select className="admin-filter-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="farmer">Farmer</option>
          <option value="psychiatrist">Psychiatrist</option>
          <option value="warehouse_owner">Warehouse Owner</option>
          <option value="admin">Admin</option>
        </select>
        <select className="admin-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading users...</p></div>
      ) : users.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">👥</div>
          <h3>No users found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email || u.mobile}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</td>
                    <td><span className={`admin-status-badge status-${u.account_status}`}>{u.account_status.replace('_', ' ')}</span></td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-view" onClick={() => handleViewUser(u.id)} disabled={viewLoading}>View</button>
                        {u.account_status !== 'suspended' && u.account_status !== 'rejected' && (
                          <button className="admin-btn admin-btn-suspend" disabled={actionLoading}
                            onClick={() => setModal({ type: 'suspend', userId: u.id, name: u.email || u.mobile })}>
                            Suspend
                          </button>
                        )}
                        {(u.account_status === 'suspended' || u.account_status === 'rejected') && (
                          <button className="admin-btn admin-btn-approve" disabled={actionLoading}
                            onClick={() => setModal({ type: 'activate', userId: u.id, name: u.email || u.mobile })}>
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <span className="admin-pagination-info">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </span>
            <div className="admin-pagination-btns">
              <button className="admin-pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
              <button className="admin-pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
            </div>
          </div>
        </>
      )}

      {modal?.type === 'suspend' && (
        <ConfirmModal
          title="Suspend User"
          message={`Are you sure you want to suspend "${modal.name}"?`}
          confirmLabel="Suspend"
          confirmClass="confirm-suspend"
          onConfirm={(reason) => handleStatusAction(modal.userId, 'suspended', reason)}
          onCancel={() => setModal(null)}
          loading={actionLoading}
          showReason={true}
        />
      )}
      {modal?.type === 'activate' && (
        <ConfirmModal
          title="Activate User"
          message={`Are you sure you want to reactivate "${modal.name}"?`}
          confirmLabel="Activate"
          confirmClass="confirm-approve"
          onConfirm={(reason) => handleStatusAction(modal.userId, 'active', reason)}
          onCancel={() => setModal(null)}
          loading={actionLoading}
          showReason={false}
        />
      )}
    </>
  );
}

// ── Insurance Section ──
function InsuranceSection() {
  const [data, setData] = useState({ requests: [], total: 0 });
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInsurance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      if (statusFilter) params.set('status', statusFilter);
      const res = await authFetch(`${API}/insurance-requests?${params}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter]);

  useEffect(() => { fetchInsurance(); }, [fetchInsurance]);

  const handleStatusUpdate = async (requestId, newStatus, notes) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await authFetch(`${API}/insurance-requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
      });
      setSuccess(`Insurance request #${requestId} updated to "${newStatus}".`);
      setModal(null);
      fetchInsurance();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(data.total / perPage);
  const statusOptions = { pending: ['processing', 'approved', 'rejected'], processing: ['approved', 'rejected'], approved: ['paid'] };

  return (
    <>
      <div className="admin-page-header">
        <h1>Insurance Requests</h1>
        <p>Review and manage insurance applications</p>
      </div>
      {error && <div className="admin-error-banner">⚠️ {error}</div>}
      {success && <div className="admin-success-banner">✅ {success}</div>}

      <div className="admin-filters">
        <select className="admin-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading insurance requests...</p></div>
      ) : data.requests.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🛡️</div>
          <h3>No insurance requests</h3>
          <p>No requests match your filter.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Farmer</th>
                  <th>District</th>
                  <th>Crop</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.farmer_name}</td>
                    <td>{r.district || '—'}</td>
                    <td>{r.crop_name || '—'}</td>
                    <td>{r.request_type || '—'}</td>
                    <td><span className={`admin-status-badge status-${r.req_status}`}>{r.req_status}</span></td>
                    <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                    <td>
                      {statusOptions[r.req_status] && (
                        <button className="admin-btn admin-btn-status" disabled={actionLoading}
                          onClick={() => setModal({ requestId: r.id, options: statusOptions[r.req_status] })}>
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <span className="admin-pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, data.total)} of {data.total}</span>
            <div className="admin-pagination-btns">
              <button className="admin-pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
              <button className="admin-pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
            </div>
          </div>
        </>
      )}

      {modal && (
        <StatusModal
          title="Update Insurance Status"
          options={modal.options}
          onConfirm={(s, n) => handleStatusUpdate(modal.requestId, s, n)}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </>
  );
}

// ── Loans Section ──
function LoansSection() {
  const [data, setData] = useState({ applications: [], total: 0 });
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      if (statusFilter) params.set('status', statusFilter);
      const res = await authFetch(`${API}/loan-applications?${params}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleStatusUpdate = async (appId, newStatus, notes) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await authFetch(`${API}/loan-applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
      });
      setSuccess(`Loan application #${appId} updated to "${newStatus}".`);
      setModal(null);
      fetchLoans();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(data.total / perPage);
  const statusOptions = { pending: ['under_review', 'approved', 'rejected'], under_review: ['approved', 'rejected'] };

  return (
    <>
      <div className="admin-page-header">
        <h1>Loan Applications</h1>
        <p>Review and manage loan requests</p>
      </div>
      {error && <div className="admin-error-banner">⚠️ {error}</div>}
      {success && <div className="admin-success-banner">✅ {success}</div>}

      <div className="admin-filters">
        <select className="admin-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading loan applications...</p></div>
      ) : data.applications.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">💰</div>
          <h3>No loan applications</h3>
          <p>No applications match your filter.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Farmer</th>
                  <th>Village</th>
                  <th>Amount (₹)</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.applications.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.farmer_name}</td>
                    <td>{r.village || '—'}</td>
                    <td>₹{Number(r.loan_amount).toLocaleString('en-IN')}</td>
                    <td>{r.loan_type || '—'}</td>
                    <td><span className={`admin-status-badge status-${r.app_status}`}>{r.app_status.replace('_', ' ')}</span></td>
                    <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                    <td>
                      {statusOptions[r.app_status] && (
                        <button className="admin-btn admin-btn-status" disabled={actionLoading}
                          onClick={() => setModal({ appId: r.id, options: statusOptions[r.app_status] })}>
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <span className="admin-pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, data.total)} of {data.total}</span>
            <div className="admin-pagination-btns">
              <button className="admin-pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
              <button className="admin-pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
            </div>
          </div>
        </>
      )}

      {modal && (
        <StatusModal
          title="Update Loan Status"
          options={modal.options}
          onConfirm={(s, n) => handleStatusUpdate(modal.appId, s, n)}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </>
  );
}

// ── Mental Health Section ──
function MentalHealthSection() {
  const [data, setData] = useState({ requests: [], total: 0 });
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusModal, setStatusModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMH = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      if (statusFilter) params.set('status', statusFilter);
      const res = await authFetch(`${API}/mental-health-requests?${params}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter]);

  useEffect(() => { fetchMH(); }, [fetchMH]);

  const handleStatusUpdate = async (requestId, newStatus, notes) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await authFetch(`${API}/mental-health-requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
      });
      setSuccess(`Mental health request #${requestId} updated to "${newStatus}".`);
      setStatusModal(null);
      fetchMH();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(data.total / perPage);
  const statusOptions = { pending: ['contacted', 'resolved'], contacted: ['resolved'] };

  return (
    <>
      <div className="admin-page-header">
        <h1>Mental Health Requests</h1>
        <p>Operational view — private message content is not displayed</p>
      </div>
      {error && <div className="admin-error-banner">⚠️ {error}</div>}
      {success && <div className="admin-success-banner">✅ {success}</div>}

      <div className="admin-filters">
        <select className="admin-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-loading-spinner" /><p>Loading mental health requests...</p></div>
      ) : data.requests.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🧠</div>
          <h3>No mental health requests</h3>
          <p>No requests match your filter.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Farmer</th>
                  <th>Concern</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.farmer_name}</td>
                    <td>{r.concern_type || '—'}</td>
                    <td><span className={`admin-status-badge status-${r.req_status}`}>{r.req_status}</span></td>
                    <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="admin-actions">
                        {statusOptions[r.req_status] && (
                          <button className="admin-btn admin-btn-status" disabled={actionLoading}
                            onClick={() => setStatusModal({ requestId: r.id, options: statusOptions[r.req_status] })}>
                            Update Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <span className="admin-pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, data.total)} of {data.total}</span>
            <div className="admin-pagination-btns">
              <button className="admin-pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
              <button className="admin-pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
            </div>
          </div>
        </>
      )}

      {statusModal && (
        <StatusModal
          title="Update Mental Health Request"
          options={statusModal.options}
          onConfirm={(s, n) => handleStatusUpdate(statusModal.requestId, s, n)}
          onCancel={() => setStatusModal(null)}
          loading={actionLoading}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ADMIN PORTAL
// ═══════════════════════════════════════════════════════════════════

export default function AdminPortalPage() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats for overview and sidebar badge
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const res = await authFetch(`${API}/stats`);
      setStats(res);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleNav = (key) => {
    setSection(key);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar overlay for mobile */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>🔒 Admin Portal</h2>
          <p>{user?.email || user?.mobile}</p>
        </div>
        <nav className="admin-sidebar-nav">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              className={`admin-nav-item ${section === s.key ? 'active' : ''}`}
              onClick={() => handleNav(s.key)}
            >
              <span className="admin-nav-icon">{s.icon}</span>
              {s.label}
              {s.key === 'pending' && stats?.pending_approvals > 0 && (
                <span className="admin-nav-badge">{stats.pending_approvals}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={logout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile toggle */}
      <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(o => !o)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Main content */}
      <main className="admin-main">
        {section === 'overview' && <OverviewSection stats={stats} loading={statsLoading} error={statsError} />}
        {section === 'pending' && <PendingApprovalsSection onRefresh={fetchStats} />}
        {section === 'users' && <AllUsersSection onRefresh={fetchStats} />}
        {section === 'insurance' && <InsuranceSection />}
        {section === 'loans' && <LoansSection />}
        {section === 'mental_health' && <MentalHealthSection />}
      </main>
    </div>
  );
}
