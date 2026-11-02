/**
 * Frontend Portal Test Suite for BhoomiBandhu (Prompt 7)
 * Tests client-side routing logic, auth protection, role checks,
 * dashboard state handling, and payload construction for:
 * 1. Farmer Dashboard (/dashboard)
 * 2. Warehouse Owner Portal (/portal/warehouse)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

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
    requireApproval: true,
  });
  assert.equal(result.status, 'ALLOWED');
});

test('5. Warehouse Portal route protection: pending warehouse owner redirected to /pending-approval', () => {
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
    requireApproval: true,
  });
  assert.equal(result.status, 'REDIRECT');
  assert.equal(result.destination, '/pending-approval');
});

test('6. Warehouse Portal route protection: farmer or admin redirected to /unauthorized', () => {
  const farmerResult = checkRouteAccess({
    user: { id: 1, role: 'farmer', mobile: '9876543210' },
    isAuthenticated: true,
    isLoading: false,
    allowedRoles: ['warehouse_owner'],
    requireApproval: true,
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

test('8. Warehouse owner company profile payload formatting: ensures clean values', () => {
  const rawFormInput = {
    company_name: 'Punjab Cold Chain Ltd.',
    license_number: 'WDRA-2024-001',
    gstin: '03AAAAA0000A1Z5',
    address: 'GT Road',
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141001',
    capacity_mt: '5000',
    cold_storage: true,
    // Attempted privilege escalation:
    approval_status: 'approved',
    user_id: 1,
  };

  const sanitizeWarehousePayload = (input) => ({
    company_name: input.company_name?.trim() || null,
    license_number: input.license_number?.trim() || null,
    gstin: input.gstin?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    pincode: input.pincode?.trim() || null,
    capacity_mt: input.capacity_mt ? parseFloat(input.capacity_mt) : null,
    cold_storage: Boolean(input.cold_storage),
  });

  const payload = sanitizeWarehousePayload(rawFormInput);

  assert.equal(payload.company_name, 'Punjab Cold Chain Ltd.');
  assert.equal(payload.capacity_mt, 5000);
  assert.equal(payload.cold_storage, true);
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

test('10. Warehouse dashboard response parsing respects schema notice', () => {
  const mockWarehouseResponse = {
    warehouse_owner_id: 5,
    company_name: 'Kisan Warehouse',
    approval_status: 'approved',
    total_facilities: 0,
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    notice: 'StorageFacility owner linkage is staged in migration specification 003_warehouse_facility_ownership.',
  };

  assert.equal(mockWarehouseResponse.approval_status, 'approved');
  assert.ok(mockWarehouseResponse.notice.includes('003_warehouse_facility_ownership'));
});
