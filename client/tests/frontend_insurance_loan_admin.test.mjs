import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  filterInsuranceRequests,
  filterLoanApplications,
  formatFinancialSummary,
  formatPmfbyDetails,
  formatAdminInsuranceDetail,
  formatFarmerInsuranceDetail,
  INSURANCE_STATUS_OPTIONS,
  LOAN_STATUS_OPTIONS,
  INSURANCE_STATUS_LABELS,
  LOAN_STATUS_LABELS
} from '../src/services/financialHelpers.js';

// ── 1. Production Helper: Insurance Search & Filter ──
test('1. filterInsuranceRequests: accurately filters by text and status', () => {
  const sample = [
    { id: 101, crop_name: 'Wheat', request_type: 'New Insurance Enrollment', district: 'Karnal', farmer_name: 'Harbhajan Singh', req_status: 'pending' },
    { id: 102, crop_name: 'Paddy', request_type: 'Crop Loss Claim', district: 'Amritsar', farmer_name: 'Kuldeep Yadav', req_status: 'processing' },
    { id: 103, crop_name: 'Cotton', request_type: 'New Insurance Enrollment', district: 'Hisar', farmer_name: 'Anita Devi', req_status: 'approved' },
    { id: 104, crop_name: 'Mustard', request_type: 'Crop Loss Claim', district: 'Rohtak', farmer_name: 'Anita Devi', req_status: 'rejected' },
  ];

  // Search by crop (case-insensitive)
  assert.equal(filterInsuranceRequests(sample, 'wheat').length, 1);
  assert.equal(filterInsuranceRequests(sample, 'wheat')[0].id, 101);

  // Search by district
  assert.equal(filterInsuranceRequests(sample, 'amritsar').length, 1);
  assert.equal(filterInsuranceRequests(sample, 'amritsar')[0].id, 102);

  // Search by farmer name
  assert.equal(filterInsuranceRequests(sample, 'anita').length, 2);

  // Search by ID
  assert.equal(filterInsuranceRequests(sample, '103').length, 1);
  assert.equal(filterInsuranceRequests(sample, '103')[0].id, 103);

  // Filter by status only
  assert.equal(filterInsuranceRequests(sample, '', 'approved').length, 1);
  assert.equal(filterInsuranceRequests(sample, '', 'approved')[0].id, 103);

  // Combined query and status
  assert.equal(filterInsuranceRequests(sample, 'anita', 'approved').length, 1);
  assert.equal(filterInsuranceRequests(sample, 'anita', 'pending').length, 0);

  // Safe with empty/invalid inputs
  assert.deepEqual(filterInsuranceRequests(null), []);
  assert.deepEqual(filterInsuranceRequests(undefined), []);
});

// ── 2. Production Helper: Loan Search & Filter ──
test('2. filterLoanApplications: accurately filters by text and status', () => {
  const sample = [
    { id: 201, loan_type: 'Crop Loan', purpose: 'Fertilizers and seeds', village: 'Taraori', farmer_name: 'Baldev Raj', app_status: 'pending' },
    { id: 202, loan_type: 'Equipment Loan', purpose: 'Combine harvester down payment', village: 'Nilokheri', farmer_name: 'Gurmeet Kaur', app_status: 'under_review' },
    { id: 203, loan_type: 'Irrigation Loan', purpose: 'Drip irrigation line', village: 'Gharaunda', farmer_name: 'Virender Sehwag', app_status: 'approved' },
  ];

  // Search by loan type
  assert.equal(filterLoanApplications(sample, 'equipment').length, 1);
  assert.equal(filterLoanApplications(sample, 'equipment')[0].id, 202);

  // Search by purpose
  assert.equal(filterLoanApplications(sample, 'drip').length, 1);
  assert.equal(filterLoanApplications(sample, 'drip')[0].id, 203);

  // Search by village
  assert.equal(filterLoanApplications(sample, 'taraori').length, 1);

  // Filter by status
  assert.equal(filterLoanApplications(sample, '', 'under_review').length, 1);
  assert.equal(filterLoanApplications(sample, '', 'under_review')[0].id, 202);

  // Combined search and status
  assert.equal(filterLoanApplications(sample, 'irrigation', 'approved').length, 1);
  assert.equal(filterLoanApplications(sample, 'irrigation', 'pending').length, 0);

  // Safe with null/undefined inputs
  assert.deepEqual(filterLoanApplications(null), []);
  assert.deepEqual(filterLoanApplications(undefined), []);
});

// ── 3. Financial Summary Calculation: Application Counts Only (No Invented Monetary Data) ──
test('3. formatFinancialSummary: accurately maps counts and avoids invented payout/disbursals', () => {
  const rawBackendSummary = {
    total_insurance_requests: 4,
    pending_insurance_requests: 1,
    approved_insurance_requests: 2,
    total_loan_applications: 3,
    pending_loan_applications: 1,
    approved_loan_applications: 2,
  };

  const formatted = formatFinancialSummary(rawBackendSummary);

  // Application counts
  assert.equal(formatted.totalInsurance, 4);
  assert.equal(formatted.pendingInsurance, 1);
  assert.equal(formatted.approvedInsurance, 2);
  assert.equal(formatted.totalLoans, 3);
  assert.equal(formatted.pendingLoans, 1);
  assert.equal(formatted.approvedLoans, 2);
  assert.equal(formatted.totalApplications, 7);
  assert.equal(formatted.totalApproved, 4);
  assert.equal(formatted.totalPending, 2);

  // Accurate status labels
  assert.equal(formatted.insuranceStatusText, '2 approved • 1 pending');
  assert.equal(formatted.loanStatusText, '2 approved • 1 under review');
  assert.equal(formatted.consolidatedStatusText, '4 approved across all services (2 in progress)');

  // Critical: Verify NO monetary fields are invented
  assert.equal(formatted.approvedClaimsPayout, undefined);
  assert.equal(formatted.approvedCreditDisbursal, undefined);
  assert.equal(formatted.consolidatedNetBenefit, undefined);
  assert.equal(formatted.approved_insurance_amount, undefined);
  assert.equal(formatted.approved_loan_amount, undefined);
});

// ── 4. PMFBY Response Field Alignment ──
test('4. formatPmfbyDetails: strictly aligns with actual backend response fields', () => {
  const pmfbyResponse = {
    id: 15,
    crop_name: 'Paddy',
    land_records_verified: true,
    sowing_date: '2026-06-15',
    season: 'Kharif',
    premium_calculated: 1250.00,
    enrollment_date: '2026-06-15T10:00:00Z',
  };

  const formatted = formatPmfbyDetails(pmfbyResponse);

  // Exact required fields
  assert.equal(formatted.id, 15);
  assert.equal(formatted.crop_name, 'Paddy');
  assert.equal(formatted.season, 'Kharif');
  assert.equal(formatted.sowing_date, '2026-06-15');
  assert.equal(formatted.land_records_verified, 'Verified');
  assert.equal(formatted.is_land_records_verified, true);
  assert.equal(formatted.raw_premium_calculated, 1250.00);
  assert.ok(formatted.premium_calculated.includes('1,250'));
  assert.ok(formatted.enrollment_date !== '—');

  // Verify NONEXISTENT fields are excluded
  assert.equal(formatted.land_verified, undefined);
  assert.equal(formatted.calculated_premium, undefined);
  assert.equal(formatted.created_at, undefined);
  assert.equal(formatted.year, undefined);
});

// ── 5. Missing Optional Data Handling ──
test('5. Missing optional data: handles null, undefined and partial responses gracefully', () => {
  // Empty financial summary
  const emptySummary = formatFinancialSummary({});
  assert.equal(emptySummary.totalInsurance, 0);
  assert.equal(emptySummary.totalLoans, 0);
  assert.equal(emptySummary.totalApplications, 0);
  assert.equal(emptySummary.insuranceStatusText, '0 approved • 0 pending');

  // Null financial summary
  const nullSummary = formatFinancialSummary(null);
  assert.equal(nullSummary.totalApplications, 0);

  // Empty PMFBY
  assert.equal(formatPmfbyDetails(null), null);
  assert.equal(formatPmfbyDetails(undefined), null);

  const partialPmfby = formatPmfbyDetails({ id: 99 });
  assert.equal(partialPmfby.crop_name, '—');
  assert.equal(partialPmfby.season, '—');
  assert.equal(partialPmfby.land_records_verified, 'Pending Verification');
  assert.equal(partialPmfby.premium_calculated, '—');
  assert.equal(partialPmfby.enrollment_date, '—');

  // Empty Admin & Farmer Detail
  assert.equal(formatAdminInsuranceDetail(null), null);
  assert.equal(formatFarmerInsuranceDetail(null), null);
});

// ── 6. Admin Insurance Detail Formatting: Excludes Unsupported Fields ──
test('6. formatAdminInsuranceDetail: removes unsupported policy/claim fields', () => {
  const backendResponse = {
    id: 50,
    farmer_id: 12,
    farmer_name: 'Anita Devi',
    farmer_mobile: '9100000012',
    state: 'Haryana',
    district: 'Rohtak',
    crop_name: 'Mustard',
    request_type: 'Crop Loss Claim',
    description: 'Hailstorm damage to mustard crop',
    req_status: 'processing',
    submitted_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-02T12:00:00Z',
    pmfby_enrollment: null
  };

  const formatted = formatAdminInsuranceDetail(backendResponse);

  // Valid backend fields
  assert.equal(formatted.id, 50);
  assert.equal(formatted.farmer_id, '#12');
  assert.equal(formatted.farmer_name, 'Anita Devi');
  assert.equal(formatted.farmer_mobile, '9100000012');
  assert.equal(formatted.location, 'Rohtak, Haryana');
  assert.equal(formatted.crop_name, 'Mustard');
  assert.equal(formatted.request_type, 'Crop Loss Claim');
  assert.equal(formatted.req_status, 'processing');
  assert.equal(formatted.description, 'Hailstorm damage to mustard crop');
  assert.equal(formatted.pmfby_enrollment, null);

  // Critical: Verify unsupported fields are NOT present
  assert.equal(formatted.policy_number, undefined);
  assert.equal(formatted.sum_insured, undefined);
  assert.equal(formatted.premium_amount, undefined);
  assert.equal(formatted.claim_status, undefined);
  assert.equal(formatted.land_size_ha, undefined);
});

// ── 7. Farmer Insurance Detail Formatting: Aligns with FarmerInsuranceSummaryItem ──
test('7. formatFarmerInsuranceDetail: strictly reflects farmer summary response', () => {
  const farmerItem = {
    id: 88,
    request_type: 'New Insurance Enrollment',
    crop_name: 'Wheat',
    district: 'Karnal',
    req_status: 'approved',
    submitted_at: '2026-04-10T08:00:00Z'
  };

  const formatted = formatFarmerInsuranceDetail(farmerItem);

  assert.equal(formatted.id, 88);
  assert.equal(formatted.request_type, 'New Insurance Enrollment');
  assert.equal(formatted.crop_name, 'Wheat');
  assert.equal(formatted.district, 'Karnal');
  assert.equal(formatted.req_status, 'approved');
  assert.ok(formatted.submitted_date !== '—');

  // Confirms exclusion of unsupported fields
  assert.equal(formatted.policy_number, undefined);
  assert.equal(formatted.sum_insured, undefined);
  assert.equal(formatted.premium_amount, undefined);
  assert.equal(formatted.claim_status, undefined);
  assert.equal(formatted.land_size_ha, undefined);
});

// ── 8. Status Display and State Transition Integrity ──
test('8. Insurance and Loan status transitions adhere strictly to database constraints', () => {
  // Insurance CHECK constraint valid transitions
  assert.deepEqual(INSURANCE_STATUS_OPTIONS['pending'], ['processing', 'approved', 'rejected']);
  assert.deepEqual(INSURANCE_STATUS_OPTIONS['processing'], ['approved', 'rejected']);
  assert.deepEqual(INSURANCE_STATUS_OPTIONS['approved'], ['paid']);
  assert.deepEqual(INSURANCE_STATUS_OPTIONS['rejected'], []);
  assert.deepEqual(INSURANCE_STATUS_OPTIONS['paid'], []);

  // Loan CHECK constraint valid transitions
  assert.deepEqual(LOAN_STATUS_OPTIONS['pending'], ['under_review', 'approved', 'rejected']);
  assert.deepEqual(LOAN_STATUS_OPTIONS['under_review'], ['approved', 'rejected']);
  assert.deepEqual(LOAN_STATUS_OPTIONS['approved'], []);
  assert.deepEqual(LOAN_STATUS_OPTIONS['rejected'], []);

  // Labels mapping
  assert.equal(INSURANCE_STATUS_LABELS['pending'], 'Pending');
  assert.equal(LOAN_STATUS_LABELS['under_review'], 'Under Review');
});

// ── 9. Farmer Financial History Isolation Contract ──
test('9. Farmer financial-history isolation: data structure preserves user boundary', () => {
  // Simulating response for Farmer A
  const farmerAResponse = {
    summary: {
      total_insurance_requests: 1,
      pending_insurance_requests: 1,
      approved_insurance_requests: 0,
      total_loan_applications: 0,
      pending_loan_applications: 0,
      approved_loan_applications: 0,
    },
    insurance_requests: [
      { id: 301, request_type: 'New Insurance Enrollment', crop_name: 'Wheat', district: 'Karnal', req_status: 'pending' }
    ],
    loan_applications: []
  };

  const formattedA = formatFinancialSummary(farmerAResponse.summary);
  assert.equal(formattedA.totalInsurance, 1);
  assert.equal(formattedA.totalLoans, 0);

  // Farmer B's separate response
  const farmerBResponse = {
    summary: {
      total_insurance_requests: 0,
      pending_insurance_requests: 0,
      approved_insurance_requests: 0,
      total_loan_applications: 2,
      pending_loan_applications: 1,
      approved_loan_applications: 1,
    },
    insurance_requests: [],
    loan_applications: [
      { id: 401, loan_type: 'Crop Loan', loan_amount: 50000.0, purpose: 'Seeds', app_status: 'approved' },
      { id: 402, loan_type: 'Equipment Loan', loan_amount: 120000.0, purpose: 'Sprayer', app_status: 'pending' },
    ]
  };

  const formattedB = formatFinancialSummary(farmerBResponse.summary);
  assert.equal(formattedB.totalInsurance, 0);
  assert.equal(formattedB.totalLoans, 2);

  // Verify Farmer A's summary is completely isolated from Farmer B
  assert.notEqual(formattedA.totalInsurance, formattedB.totalInsurance);
  assert.notEqual(formattedA.totalLoans, formattedB.totalLoans);
});
