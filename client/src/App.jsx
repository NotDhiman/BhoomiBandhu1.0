import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

// Core Farmer Feature Pages (Preserved)
import IndexPage from './pages/IndexPage.jsx';
import StoragePage from './pages/StoragePage.jsx';
import InsurancePage from './pages/InsurancePage.jsx';
import SchemesPage from './pages/SchemesPage.jsx';
import FinancialPage from './pages/FinancialPage.jsx';
import MlCropAdvisorPage from './pages/MlCropAdvisorPage.jsx';
import GeminiAdvisorPage from './pages/GeminiAdvisorPage.jsx';
import MentalHealthPage from './pages/MentalHealthPage.jsx';
import StatusTrackingPage from './pages/StatusTrackingPage.jsx';
import PmfbyEnrollmentPage from './pages/PmfbyEnrollmentPage.jsx';
import ClaimFilingPage from './pages/ClaimFilingPage.jsx';
import RiskAwarenessPage from './pages/RiskAwarenessPage.jsx';

// Authentication Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// Portals & Route Protection
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';
import FarmerDashboardPage from './pages/portals/FarmerDashboardPage.jsx';
import PsychiatristPortalPage from './pages/portals/PsychiatristPortalPage.jsx';
import WarehousePortalPage from './pages/portals/WarehousePortalPage.jsx';
import AdminPortalPage from './pages/portals/AdminPortalPage.jsx';
import PendingApprovalPage from './pages/portals/PendingApprovalPage.jsx';
import UnauthorizedPage from './pages/portals/UnauthorizedPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing & Authentication Routes */}
          <Route path="/" element={<IndexPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* Protected Farmer Portal */}
          <Route
            path="/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={['farmer']}>
                <FarmerDashboardPage />
              </RoleProtectedRoute>
            }
          />

          {/* Role Protected Professional & Admin Portals */}
          <Route
            path="/portal/psychiatrist"
            element={
              <RoleProtectedRoute allowedRoles={['psychiatrist']} requireApproval={true}>
                <PsychiatristPortalPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/portal/warehouse"
            element={
              <RoleProtectedRoute allowedRoles={['warehouse_owner']}>
                <WarehousePortalPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/portal/admin"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <AdminPortalPage />
              </RoleProtectedRoute>
            }
          />

          {/* Preserved Farmer Feature Routes */}
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/insurance" element={<InsurancePage />} />
          <Route path="/schemes" element={<SchemesPage />} />
          <Route path="/financial" element={<FinancialPage />} />
          <Route path="/ml-crop-advisor" element={<MlCropAdvisorPage />} />
          <Route path="/gemini-advisor" element={<GeminiAdvisorPage />} />
          <Route path="/mental-health" element={<MentalHealthPage />} />
          <Route path="/status-tracking" element={<StatusTrackingPage />} />
          <Route path="/pmfby-enrollment" element={<PmfbyEnrollmentPage />} />
          <Route path="/claim-filing" element={<ClaimFilingPage />} />
          <Route path="/risk-awareness" element={<RiskAwarenessPage />} />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
