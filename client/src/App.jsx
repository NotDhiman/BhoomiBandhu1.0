import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
