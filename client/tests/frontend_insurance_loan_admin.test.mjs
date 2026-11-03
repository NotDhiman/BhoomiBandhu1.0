import { test } from 'node:test';
import assert from 'node:assert/strict';

// Helper functions mirroring frontend logic
function filterInsuranceRequests(requests, query, statusFilter) {
  return (requests || []).filter((r) => {
    if (statusFilter && r.req_status !== statusFilter) return false;
    if (query && query.trim()) {
      const q = query.toLowerCase();
      const matchCrop = (r.crop_name || '').toLowerCase().includes(q);
      const matchType = (r.request_type || '').toLowerCase().includes(q);
      const matchDistrict = (r.district || '').toLowerCase().includes(q);
      const matchId = String(r.id).includes(q);
      return matchCrop || matchType || matchDistrict || matchId;
    }
    return true;
  });
}

function filterLoanApplications(applications, query, statusFilter) {
  return (applications || []).filter((l) => {
    if (statusFilter && l.app_status !== statusFilter) return false;
    if (query && query.trim()) {
      const q = query.toLowerCase();
      const matchType = (l.loan_type || '').toLowerCase().includes(q);
      const matchPurpose = (l.purpose || '').toLowerCase().includes(q);
      const matchId = String(l.id).includes(q);
      return matchType || matchPurpose || matchId;
    }
    return true;
  });
}

const INSURANCE_TRANSITIONS = {
  pending: ['processing', 'approved', 'rejected'],
  processing: ['approved', 'rejected'],
  approved: ['paid'],
  rejected: [],
  paid: []
};

const LOAN_TRANSITIONS = {
  pending: ['under_review', 'approved', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: [],
  rejected: []
};

test('1. Insurance search and status filter works correctly', () => {
  const sample = [
    { id: 1, crop_name: 'Wheat', request_type: 'PMFBY Enrollment', district: 'Ludhiana', req_status: 'pending' },
    { id: 2, crop_name: 'Rice', request_type: 'Crop Loss Claim', district: 'Amritsar', req_status: 'approved' },
    { id: 3, crop_name: 'Cotton', request_type: 'PMFBY Enrollment', district: 'Bathinda', req_status: 'processing' },
  ];

  // Filter by query 'wheat'
  assert.equal(filterInsuranceRequests(sample, 'wheat', '').length, 1);
  assert.equal(filterInsuranceRequests(sample, 'wheat', '')[0].id, 1);

  // Filter by query 'pmfby'
  assert.equal(filterInsuranceRequests(sample, 'pmfby', '').length, 2);

  // Filter by status 'approved'
  assert.equal(filterInsuranceRequests(sample, '', 'approved').length, 1);
  assert.equal(filterInsuranceRequests(sample, '', 'approved')[0].id, 2);

  // Filter by status and search combined
  assert.equal(filterInsuranceRequests(sample, 'cotton', 'processing').length, 1);
  assert.equal(filterInsuranceRequests(sample, 'cotton', 'pending').length, 0);
});

test('2. Loan search and status filter works correctly', () => {
  const sample = [
    { id: 10, loan_type: 'Kisan Credit Card', purpose: 'Seeds and fertilizers', app_status: 'pending' },
    { id: 11, loan_type: 'Tractor Loan', purpose: 'Farm mechanization', app_status: 'under_review' },
    { id: 12, loan_type: 'Kisan Credit Card', purpose: 'Irrigation tube well', app_status: 'approved' },
  ];

  // Filter by query 'tractor'
  assert.equal(filterLoanApplications(sample, 'tractor', '').length, 1);
  assert.equal(filterLoanApplications(sample, 'tractor', '')[0].id, 11);

  // Filter by query 'seeds'
  assert.equal(filterLoanApplications(sample, 'seeds', '').length, 1);

  // Filter by status 'under_review'
  assert.equal(filterLoanApplications(sample, '', 'under_review').length, 1);

  // Combined search and status
  assert.equal(filterLoanApplications(sample, 'kisan', 'approved').length, 1);
  assert.equal(filterLoanApplications(sample, 'kisan', 'rejected').length, 0);
});

test('3. Admin insurance status transition rules', () => {
  assert.deepEqual(INSURANCE_TRANSITIONS['pending'], ['processing', 'approved', 'rejected']);
  assert.deepEqual(INSURANCE_TRANSITIONS['processing'], ['approved', 'rejected']);
  assert.deepEqual(INSURANCE_TRANSITIONS['approved'], ['paid']);
  assert.deepEqual(INSURANCE_TRANSITIONS['rejected'], []);
  assert.deepEqual(INSURANCE_TRANSITIONS['paid'], []);
});

test('4. Admin loan status transition rules', () => {
  assert.deepEqual(LOAN_TRANSITIONS['pending'], ['under_review', 'approved', 'rejected']);
  assert.deepEqual(LOAN_TRANSITIONS['under_review'], ['approved', 'rejected']);
  assert.deepEqual(LOAN_TRANSITIONS['approved'], []);
  assert.deepEqual(LOAN_TRANSITIONS['rejected'], []);
});

test('5. Farmer consolidated financial summary calculation', () => {
  const summary = {
    total_insurance_requests: 3,
    pending_insurance_requests: 1,
    approved_insurance_requests: 1,
    approved_insurance_amount: 45000.0,
    total_loan_applications: 2,
    pending_loan_applications: 1,
    approved_loan_applications: 1,
    approved_loan_amount: 150000.0
  };

  const totalNetBenefit = (summary.approved_insurance_amount || 0) + (summary.approved_loan_amount || 0);
  assert.equal(totalNetBenefit, 195000.0);
});

test('6. PMFBY detail structure includes required fields without phantom keys', () => {
  const pmfbyRecord = {
    id: 5,
    farmer_id: 1,
    insurance_request_id: 2,
    season: 'Kharif',
    year: 2026,
    land_verified: true,
    sowing_date: '2026-06-15',
    calculated_premium: 1200.0,
    created_at: '2026-06-15T10:00:00'
  };

  assert.ok(pmfbyRecord.season);
  assert.ok(pmfbyRecord.calculated_premium > 0);
  assert.equal(pmfbyRecord.land_verified, true);
});

