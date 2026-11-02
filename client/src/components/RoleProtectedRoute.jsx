import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleProtectedRoute({
  children,
  allowedRoles = [],
  requireApproval = false,
}) {
  const { user, isAuthenticated, isLoading, isApproved } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px'
      }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireApproval && !isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}
