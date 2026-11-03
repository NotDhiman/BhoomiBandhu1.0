/**
 * Financial & Insurance Helper Utilities
 * Single-source-of-truth logic for status mappings, filtering, payload formatting,
 * and summary calculations used across AdminPortalPage.jsx and FarmerDashboardPage.jsx.
 */

export const INSURANCE_STATUS_OPTIONS = {
  pending: ['processing', 'approved', 'rejected'],
  processing: ['approved', 'rejected'],
  approved: ['paid'],
  rejected: [],
  paid: []
};

export const LOAN_STATUS_OPTIONS = {
  pending: ['under_review', 'approved', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: [],
  rejected: []
};

export const INSURANCE_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid'
};

export const LOAN_STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected'
};

/**
 * Filter insurance requests by text query (crop, type, district, ID, farmer) and status.
 */
export function filterInsuranceRequests(requests, query = '', statusFilter = '') {
  if (!Array.isArray(requests)) return [];
  const q = (query || '').trim().toLowerCase();
  const status = (statusFilter || '').trim();

  return requests.filter((r) => {
    if (status && r.req_status !== status) return false;
    if (q) {
      const matchCrop = (r.crop_name || '').toLowerCase().includes(q);
      const matchType = (r.request_type || '').toLowerCase().includes(q);
      const matchDistrict = (r.district || '').toLowerCase().includes(q);
      const matchFarmer = (r.farmer_name || '').toLowerCase().includes(q);
      const matchId = String(r.id).includes(q);
      return matchCrop || matchType || matchDistrict || matchFarmer || matchId;
    }
    return true;
  });
}

/**
 * Filter loan applications by text query (type, purpose, village, ID, farmer) and status.
 */
export function filterLoanApplications(applications, query = '', statusFilter = '') {
  if (!Array.isArray(applications)) return [];
  const q = (query || '').trim().toLowerCase();
  const status = (statusFilter || '').trim();

  return applications.filter((l) => {
    if (status && l.app_status !== status) return false;
    if (q) {
      const matchType = (l.loan_type || '').toLowerCase().includes(q);
      const matchPurpose = (l.purpose || '').toLowerCase().includes(q);
      const matchVillage = (l.village || '').toLowerCase().includes(q);
      const matchFarmer = (l.farmer_name || '').toLowerCase().includes(q);
      const matchId = String(l.id).includes(q);
      return matchType || matchPurpose || matchVillage || matchFarmer || matchId;
    }
    return true;
  });
}

/**
 * Formats consolidated farmer financial summary counts accurately from backend response.
 * Never calculates or invents payouts, credit disbursals, or monetary amounts.
 */
export function formatFinancialSummary(summary = {}) {
  const totalInsurance = Number(summary?.total_insurance_requests) || 0;
  const pendingInsurance = Number(summary?.pending_insurance_requests) || 0;
  const approvedInsurance = Number(summary?.approved_insurance_requests) || 0;

  const totalLoans = Number(summary?.total_loan_applications) || 0;
  const pendingLoans = Number(summary?.pending_loan_applications) || 0;
  const approvedLoans = Number(summary?.approved_loan_applications) || 0;

  const totalApplications = totalInsurance + totalLoans;
  const totalApproved = approvedInsurance + approvedLoans;
  const totalPending = pendingInsurance + pendingLoans;

  return {
    totalInsurance,
    pendingInsurance,
    approvedInsurance,
    totalLoans,
    pendingLoans,
    approvedLoans,
    totalApplications,
    totalApproved,
    totalPending,
    insuranceStatusText: `${approvedInsurance} approved • ${pendingInsurance} pending`,
    loanStatusText: `${approvedLoans} approved • ${pendingLoans} under review`,
    consolidatedStatusText: `${totalApproved} approved across all services (${totalPending} in progress)`
  };
}

/**
 * Formats PMFBY enrollment detail strictly using actual response fields:
 * - land_records_verified
 * - premium_calculated
 * - enrollment_date
 * - season
 * - sowing_date
 * - crop_name
 *
 * Explicitly rejects nonexistent keys (land_verified, calculated_premium, created_at, year).
 */
export function formatPmfbyDetails(pmfby) {
  if (!pmfby || typeof pmfby !== 'object') return null;

  return {
    id: pmfby.id ?? null,
    crop_name: pmfby.crop_name || '—',
    season: pmfby.season || '—',
    sowing_date: pmfby.sowing_date || '—',
    land_records_verified: pmfby.land_records_verified ? 'Verified' : 'Pending Verification',
    is_land_records_verified: Boolean(pmfby.land_records_verified),
    premium_calculated: pmfby.premium_calculated != null ? `₹${Number(pmfby.premium_calculated).toLocaleString('en-IN')}` : '—',
    raw_premium_calculated: pmfby.premium_calculated != null ? Number(pmfby.premium_calculated) : null,
    enrollment_date: pmfby.enrollment_date ? new Date(pmfby.enrollment_date).toLocaleDateString() : '—'
  };
}

/**
 * Formats Admin Insurance Request detail strictly using actual backend fields.
 * Excludes unsupported fields: policy_number, sum_insured, premium_amount, claim_status, land_size_ha.
 */
export function formatAdminInsuranceDetail(item) {
  if (!item || typeof item !== 'object') return null;

  return {
    id: item.id,
    farmer_id: item.farmer_id != null ? `#${item.farmer_id}` : '—',
    farmer_name: item.farmer_name || '—',
    farmer_mobile: item.farmer_mobile || '—',
    location: item.district ? `${item.district}, ${item.state || ''}`.replace(/,\s*$/, '') : (item.state || '—'),
    crop_name: item.crop_name || '—',
    request_type: item.request_type || '—',
    req_status: item.req_status || 'pending',
    description: item.description || null,
    submitted_date: item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '—',
    updated_date: item.updated_at ? new Date(item.updated_at).toLocaleString() : '—',
    pmfby_enrollment: formatPmfbyDetails(item.pmfby_enrollment)
  };
}

/**
 * Formats Farmer Insurance Request detail strictly using actual backend fields.
 * Only displays fields available in FarmerInsuranceSummaryItem.
 */
export function formatFarmerInsuranceDetail(item) {
  if (!item || typeof item !== 'object') return null;

  return {
    id: item.id,
    request_type: item.request_type || '—',
    crop_name: item.crop_name || '—',
    district: item.district || '—',
    req_status: item.req_status || 'pending',
    submitted_date: item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'
  };
}

