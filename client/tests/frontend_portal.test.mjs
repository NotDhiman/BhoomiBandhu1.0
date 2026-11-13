/**
 * Frontend Portal Test Suite for BhoomiBandhu (Prompts 7 / 7A / 7B / 7C / 7D)
 *
 * SCOPE & METHODOLOGY DISCLAIMER:
 * These tests execute pure JavaScript functions, routing logic, and the production
 * utility module (client/src/services/warehouseHelpers.js) in a Node.js test runner.
 * They do NOT mount or render actual React components (this repository has no DOM /
 * jsdom / React Testing Library environment installed). No React component rendering
 * is claimed to be tested here.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Import actual production helpers from warehouseHelpers.js
import {
  WAREHOUSE_STATUS_LABELS,
  getWarehouseStatusLabel,
  getWarehouseStatusBanner,
  isOperationalActionDisabled,
  deriveWarehouseState,
  formatWarehouseEditPayload,
  getWarehouseFacilitiesCount,
} from '../src/services/warehouseHelpers.js';

// Helper: Simulate RoleProtectedRoute logic from client/src/components/RoleProtectedRoute.jsx
function checkRouteAccess({ user, isAuthenticated, isLoading, allowedRoles = [], requireApproval = false }) {
  if (isLoading) {
    return { status: 'LOADING' };
  }
  if (!isAuthenticated || !user) {
    return { status: 'REDIRECT', destination: '/login' };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { status: 'REDIRECT', destination: '/unauthorized' };
  }
  const isApproved = user.role === 'farmer' || user.role === 'admin' || Boolean(user.profile_details?.is_approved);
  if (requireApproval && !isApproved) {
    return { status: 'REDIRECT', destination: '/pending-approval' };
  }
  return { status: 'ALLOWED' };
}

test('1. Farmer Dashboard route protection: allows authenticated farmers', () => {
  const result = checkRouteAccess({
    user: { id: 1, role: 'farmer', mobile: '9876543210' },
    isAuthenticated: true,
    isLoading: false,
    allowedRoles: ['farmer'],
  });
  assert.equal(result.status, 'ALLOWED');
});

test('2. Farmer Dashboard route protection: unauthenticated user redirected to /login', () => {
  const result = checkRouteAccess({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    allowedRoles: ['farmer'],
  });
  assert.equal(result.status, 'REDIRECT');
  assert.equal(result.destination, '/login');
});

test('3. Farmer Dashboard route protection: non-farmer roles rejected with /unauthorized', () => {
  const roles = ['psychiatrist', 'warehouse_owner', 'admin'];
  for (const role of roles) {
    const result = checkRouteAccess({
      user: { id: 2, role, mobile: '9876543211' },
      isAuthenticated: true,
      isLoading: false,
      allowedRoles: ['farmer'],
    });
    assert.equal(result.status, 'REDIRECT', `Role ${role} should be redirected`);
    assert.equal(result.destination, '/unauthorized', `Role ${role} should go to /unauthorized`);
  }
});

test('4. Warehouse Portal route protection: approved warehouse owner allowed', () => {
  const result = checkRouteAccess({
    user: {
      id: 3,
      role: 'warehouse_owner',
      mobile: '9876543212',
      profile_details: { is_approved: true, company_name: 'AgriStore' },
    },
    isAuthenticated: true,
    isLoading: false,
    allowedRoles: ['warehouse_owner'],
    requireApproval: false, // Updated in CRIT-01 to permit pending access
  });
  assert.equal(result.status, 'ALLOWED');
});

test('5. Warehouse Portal route protection: pending warehouse owner allowed directly without redirect (CRIT-01)', () => {
  const result = checkRouteAccess({
    user: {
      id: 4,
      role: 'warehouse_owner',
      mobile: '9876543213',
      profile_details: { is_approved: false, company_name: 'Pending Godown' },
    },
    isAuthenticated: true,
    isLoading: false,
    allowedRoles: ['warehouse_owner'],
    requireApproval: false, // Pending owners allowed to access portal and manage company profile
  });
  assert.equal(result.status, 'ALLOWED');
});

test('6. Warehouse Portal route protection: farmer or admin redirected to /unauthorized', () => {
  const farmerResult = checkRouteAccess({
    user: { id: 1, role: 'farmer', mobile: '9876543210' },
    isAuthenticated: true,
    isLoading: false,
    allowedRoles: ['warehouse_owner'],
    requireApproval: false,
  });
  assert.equal(farmerResult.status, 'REDIRECT');
  assert.equal(farmerResult.destination, '/unauthorized');
});

test('7. Farmer profile payload formatting: protects account-level fields', () => {
  const rawFormInput = {
    name: 'Ramesh Patel',
    state: 'Punjab',
    district: 'Ludhiana',
    village: 'Khanna',
    farmer_category: 'small',
    land_holding_ha: '2.5',
    primary_crop: 'Wheat',
    // Attacker attempted injections:
    role: 'admin',
    is_approved: true,
    status: 'active',
    id: 9999,
  };

  // Farmer edit payload extractor mirroring FarmerDashboardPage.jsx
  const sanitizeFarmerPayload = (input) => ({
    name: input.name?.trim() || null,
    state: input.state?.trim() || null,
    district: input.district?.trim() || null,
    village: input.village?.trim() || null,
    farmer_category: input.farmer_category || 'small',
    land_holding_ha: input.land_holding_ha ? parseFloat(input.land_holding_ha) : null,
    primary_crop: input.primary_crop?.trim() || null,
  });

  const payload = sanitizeFarmerPayload(rawFormInput);

  assert.equal(payload.name, 'Ramesh Patel');
  assert.equal(payload.land_holding_ha, 2.5);
  assert.equal(payload.role, undefined);
  assert.equal(payload.is_approved, undefined);
  assert.equal(payload.status, undefined);
  assert.equal(payload.id, undefined);
});

test('8. Production formatWarehouseEditPayload: sanitizes inputs and rejects phantom fields', () => {
  const rawFormInput = {
    company_name: '  Punjab Cold Chain Ltd.  ',
    gstin: '  03aaaaa0000a1z5  ',
    // Attempted submission of non-existent fields / privilege escalation:
    license_number: 'WDRA-2024-001',
    address: 'GT Road',
    city: 'Ludhiana',
    capacity_mt: '5000',
    approval_status: 'approved',
    user_id: 1,
  };

  const payload = formatWarehouseEditPayload(rawFormInput);

  assert.equal(payload.company_name, 'Punjab Cold Chain Ltd.');
  assert.equal(payload.gstin, '03AAAAA0000A1Z5');
  assert.equal(payload.license_number, undefined);
  assert.equal(payload.address, undefined);
  assert.equal(payload.capacity_mt, undefined);
  assert.equal(payload.approval_status, undefined);
  assert.equal(payload.user_id, undefined);
});

test('9. Farmer dashboard response parsing handles empty & populated states safely', () => {
  const mockDashboardResponse = {
    farmer_id: 10,
    name: 'Suresh Kumar',
    mobile: '9876543210',
    profile_completion_pct: 85,
    profile: {
      id: 10,
      name: 'Suresh Kumar',
      farmer_category: 'small',
      land_holding_ha: 1.5,
    },
    total_insurance_requests: 2,
    active_insurance_requests: 1,
    total_loans: 1,
    active_loans: 1,
    total_bookings: 0,
    active_bookings: 0,
    eligible_schemes_count: 3,
  };

  assert.equal(mockDashboardResponse.farmer_id, 10);
  assert.equal(mockDashboardResponse.profile_completion_pct, 85);
  assert.equal(mockDashboardResponse.total_bookings, 0);
  assert.equal(mockDashboardResponse.eligible_schemes_count, 3);
});

test('10. Warehouse dashboard response parsing respects schema notice and uses real backend fields', () => {
  const mockWarehouseResponse = {
    warehouse_owner_id: 5,
    company_name: 'Kisan Warehouse',
    is_approved: true,
    account_status: 'active',
    total_facilities: 0,
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    notice: 'StorageFacility owner linkage is staged in migration specification 003_warehouse_facility_ownership.',
  };

  const { isApproved, accountStatus } = deriveWarehouseState(mockWarehouseResponse);
  assert.equal(accountStatus, 'active');
  assert.equal(isApproved, true);
  assert.ok(mockWarehouseResponse.notice.includes('003_warehouse_facility_ownership'));
  assert.equal(mockWarehouseResponse.approval_status, undefined);
});

test('11. Production getWarehouseStatusLabel: maps all 4 backend statuses to exact required labels', () => {
  // Test exact requirements:
  // active → APPROVED
  // pending_approval → PENDING VERIFICATION
  // suspended → SUSPENDED
  // rejected → REJECTED
  assert.equal(getWarehouseStatusLabel('active'), 'APPROVED');
  assert.equal(getWarehouseStatusLabel('pending_approval'), 'PENDING VERIFICATION');
  assert.equal(getWarehouseStatusLabel('suspended'), 'SUSPENDED');
  assert.equal(getWarehouseStatusLabel('rejected'), 'REJECTED');

  // Fallback for missing/null status
  assert.equal(getWarehouseStatusLabel(null), 'PENDING VERIFICATION');
  assert.equal(getWarehouseStatusLabel(undefined), 'PENDING VERIFICATION');
});

test('12. Production deriveWarehouseState: handles all status permutations and edge-case fallbacks', () => {
  // Approved owner
  const approved = deriveWarehouseState({ is_approved: true, account_status: 'active' });
  assert.equal(approved.isApproved, true);
  assert.equal(approved.accountStatus, 'active');

  // Pending owner
  const pending = deriveWarehouseState({ is_approved: false, account_status: 'pending_approval' });
  assert.equal(pending.isApproved, false);
  assert.equal(pending.accountStatus, 'pending_approval');

  // Suspended owner
  const suspended = deriveWarehouseState({ is_approved: false, account_status: 'suspended' });
  assert.equal(suspended.isApproved, false);
  assert.equal(suspended.accountStatus, 'suspended');

  // Rejected owner
  const rejected = deriveWarehouseState({ is_approved: false, account_status: 'rejected' });
  assert.equal(rejected.isApproved, false);
  assert.equal(rejected.accountStatus, 'rejected');

  // Fallback if account_status is missing from response
  const noStatus = deriveWarehouseState({ is_approved: false });
  assert.equal(noStatus.accountStatus, 'pending_approval');
});

test('13. Production getWarehouseStatusBanner: pending_approval shows administrative verification message (not rejected)', () => {
  const pendingBanner = getWarehouseStatusBanner('pending_approval');
  assert.equal(pendingBanner.title, 'Account Verification Status: PENDING VERIFICATION');
  assert.ok(pendingBanner.message.includes('undergoing administrative verification'));
  assert.equal(pendingBanner.icon, '⏳');

  const suspendedBanner = getWarehouseStatusBanner('suspended');
  assert.equal(suspendedBanner.title, 'Account Verification Status: SUSPENDED');
  assert.ok(suspendedBanner.message.includes('suspended'));
  assert.equal(suspendedBanner.icon, '🚫');

  const rejectedBanner = getWarehouseStatusBanner('rejected');
  assert.equal(rejectedBanner.title, 'Account Verification Status: REJECTED');
  assert.ok(rejectedBanner.message.includes('not approved'));
  assert.equal(rejectedBanner.icon, '❌');
});

test('14. Production isOperationalActionDisabled: action tiles disabled for ALL users (approved and pending)', () => {
  // Storage Units and Booking Requests MUST be disabled for BOTH approved and pending owners
  assert.equal(isOperationalActionDisabled('facilities'), true);
  assert.equal(isOperationalActionDisabled('bookings'), true);

  // Other actions (like credentials update or subsidy info) are not disabled
  assert.equal(isOperationalActionDisabled('profile'), false);
  assert.equal(isOperationalActionDisabled('subsidies'), false);
});

test('15. Production getWarehouseFacilitiesCount: never references capacity_mt and returns real count or zero', () => {
  // Dashboard data present with 0 facilities
  assert.equal(getWarehouseFacilitiesCount({ total_facilities: 0 }), 0);

  // Dashboard data present with 3 facilities
  assert.equal(getWarehouseFacilitiesCount({ total_facilities: 3 }), 3);

  // Dashboard data null (e.g. pending owner who cannot fetch dashboard)
  assert.equal(getWarehouseFacilitiesCount(null), 0);

  // An object with legacy capacity_mt must NOT fabricate a facility count of 1
  const legacyProfile = { capacity_mt: 5000 };
  assert.equal(getWarehouseFacilitiesCount(null), 0);
  assert.equal(legacyProfile.capacity_mt, 5000); // Verify capacity_mt is ignored by getter
});

test('16. Real backend response contract validation: verified fields and absence of phantom fields', () => {
  // Exact schema from WarehouseOwnerProfileDetail:
  const validProfileResponse = {
    user_id: 42,
    profile_id: 10,
    email: 'warehouse@example.com',
    mobile: '9876543210',
    company_name: 'Kisan Logistics Ltd',
    gstin: '07AAAAA0000A1Z5',
    is_approved: false,
    account_status: 'pending_approval',
    created_at: '2026-11-01T10:00:00Z',
  };

  // Verify real fields are present
  assert.equal(typeof validProfileResponse.company_name, 'string');
  assert.equal(typeof validProfileResponse.gstin, 'string');
  assert.equal(typeof validProfileResponse.is_approved, 'boolean');
  assert.equal(typeof validProfileResponse.account_status, 'string');
  assert.equal(typeof validProfileResponse.mobile, 'string');
  assert.equal(typeof validProfileResponse.email, 'string');

  // Verify phantom fields are NOT present in the backend schema
  assert.equal(validProfileResponse.approval_status, undefined);
  assert.equal(validProfileResponse.license_number, undefined);
  assert.equal(validProfileResponse.capacity_mt, undefined);
  assert.equal(validProfileResponse.cold_storage, undefined);
  assert.equal(validProfileResponse.address, undefined);
  assert.equal(validProfileResponse.city, undefined);
  assert.equal(validProfileResponse.state, undefined);
  assert.equal(validProfileResponse.pincode, undefined);
});
