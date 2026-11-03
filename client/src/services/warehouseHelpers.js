/**
 * Warehouse Portal Helper Utilities
 * Pure JavaScript logic for status mapping, banner messages, payload formatting,
 * and operational gating used by WarehousePortalPage.jsx.
 *
 * Provides single-source-of-truth helpers that can be unit-tested directly in Node.js
 * without requiring a DOM/React environment.
 */

export const WAREHOUSE_STATUS_LABELS = {
  active: 'APPROVED',
  pending_approval: 'PENDING VERIFICATION',
  suspended: 'SUSPENDED',
  rejected: 'REJECTED',
};

/**
 * Maps backend account_status string to standardized user-facing display label.
 * Exact backend values: 'active', 'pending_approval', 'suspended', 'rejected'.
 */
export function getWarehouseStatusLabel(status) {
  if (!status) return 'PENDING VERIFICATION';
  return WAREHOUSE_STATUS_LABELS[status] || status.toUpperCase();
}

/**
 * Returns banner configuration (title, message, icon, border color) for non-active states.
 * Pending owners see administrative verification message.
 * Suspended owners see suspension message.
 * Rejected owners see rejection message.
 */
export function getWarehouseStatusBanner(accountStatus) {
  if (accountStatus === 'pending_approval') {
    return {
      title: 'Account Verification Status: PENDING VERIFICATION',
      message:
        'Your warehouse owner profile is currently undergoing administrative verification by BhoomiBandhu. Once approved, operational facility management and incoming farmer storage booking requests will be automatically activated.',
      icon: '⏳',
      color: '#d97706',
    };
  }
  if (accountStatus === 'suspended') {
    return {
      title: 'Account Verification Status: SUSPENDED',
      message:
        'Your warehouse owner account has been suspended. Please contact BhoomiBandhu platform support to resolve this matter.',
      icon: '🚫',
      color: '#7c3aed',
    };
  }
  if (accountStatus === 'rejected') {
    return {
      title: 'Account Verification Status: REJECTED',
      message:
        'Your warehouse registration was not approved. Please review your company and license credentials or contact platform support.',
      icon: '❌',
      color: '#dc2626',
    };
  }
  return {
    title: `Account Verification Status: ${accountStatus ? accountStatus.toUpperCase() : 'PENDING VERIFICATION'}`,
    message:
      'Your warehouse registration was not approved. Please review your company and license credentials or contact platform support.',
    icon: '⏳',
    color: '#d97706',
  };
}

/**
 * Determines whether an operational action tile (Storage Units, Booking Requests) is disabled.
 * MUST return true for ALL users (including approved warehouse owners) pending database
 * migration 003_warehouse_facility_ownership and ownership CRUD implementation.
 */
export function isOperationalActionDisabled(actionName) {
  if (actionName === 'facilities' || actionName === 'bookings') {
    return true;
  }
  return false;
}

/**
 * Derives isApproved and accountStatus from the authenticated profile response.
 */
export function deriveWarehouseState(profileData) {
  const isApproved = Boolean(profileData?.is_approved);
  const accountStatus = profileData?.account_status || (profileData?.is_approved ? 'active' : 'pending_approval');
  return { isApproved, accountStatus };
}

/**
 * Formats edit profile payload ensuring only permitted fields (company_name, gstin) are sent.
 */
export function formatWarehouseEditPayload(formData) {
  return {
    company_name: formData.company_name?.trim() || null,
    gstin: formData.gstin?.trim() ? formData.gstin.trim().toUpperCase() : null,
  };
}

/**
 * Returns total facilities count from dashboard data or 0.
 * Obsolete capacity_mt is never referenced.
 */
export function getWarehouseFacilitiesCount(dashboardData) {
  return dashboardData?.total_facilities ?? 0;
}

