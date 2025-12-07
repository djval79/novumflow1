import React, { useEffect } from 'react';
import { automationService } from '@/lib/services/AutomationService';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import AppLayout from './components/AppLayout';
import FeatureRoute from './components/FeatureRoute';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import HRModulePage from './pages/HRModulePage';
import RecruitmentPage from './pages/RecruitmentPage';
import LettersPage from './pages/LettersPage';
import SettingsPage from './pages/SettingsPage';
import RecruitSettingsPage from './pages/RecruitSettingsPage';
import CompliancePage from './pages/CompliancePage';
import BiometricPage from './pages/BiometricPage';
import AutomationPage from './pages/AutomationPage';
import DocumentsPage from './pages/DocumentsPage';
import MessagingPage from './pages/MessagingPage';
import NoticeBoardPage from './pages/NoticeBoardPage';
import PerformancePage from './pages/PerformancePage';
import IntegrationsPage from './pages/IntegrationsPage';
import FormsPage from './pages/FormsPage';
import TenantManagementPage from './pages/TenantManagementPage';
import ComplianceDashboardPage from './pages/ComplianceDashboardPage';
import AuditLogPage from './pages/AuditLogPage';
import PrivacyPage from './pages/PrivacyPage';
import SupportPage from './pages/SupportPage';
import InspectorDashboard from './pages/InspectorDashboard';
import StaffPassportPage from './pages/StaffPassportPage';
import StaffPortalPage from './pages/StaffPortalPage';
import LandingPage from './pages/LandingPage';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // RBAC: Smart Redirects
  // If user is a 'carer' (and NOT a super admin), they are restricted to the Staff Portal and Passport
  // We allow them to access /staff-portal, /my-passport, /documents, /noticeboard, /training
  const restrictedRoutes = ['/dashboard', '/hr', '/recruitment', '/settings', '/compliance-dashboard'];
  const isRestrictedUser = profile?.role === 'carer' || profile?.role === 'staff';
  const isSuperAdmin = profile?.is_super_admin;

  if (isRestrictedUser && !isSuperAdmin) {
    // If they are trying to access a restricted route, bounce them to portal
    // We check if the current path STARTS with any restricted path
    const isTryingRestricted = restrictedRoutes.some(route => location.pathname.startsWith(route));

    // Also, if they are at root '/', send them to portal instead of dashboard
    if (location.pathname === '/' || isTryingRestricted) {
      return <Navigate to="/staff-portal" replace />;
    }
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import TenantSignupPage from './pages/TenantSignupPage';
import AdminPortalPage from './pages/AdminPortalPage';


function App() {
  useEffect(() => {
    // Service is initialized on import, but we can add cleanup here if needed
    return () => {
      automationService.cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/tenant/create" element={<TenantSignupPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<FeatureRoute feature="dashboard"><DashboardPage /></FeatureRoute>} />
              <Route path="hr" element={<FeatureRoute feature="hr_module"><HRModulePage /></FeatureRoute>} />
              <Route path="recruitment" element={<FeatureRoute feature="recruitment"><RecruitmentPage /></FeatureRoute>} />
              <Route path="performance" element={<FeatureRoute feature="performance"><PerformancePage /></FeatureRoute>} />
              <Route path="integrations" element={<FeatureRoute feature="integrations"><IntegrationsPage /></FeatureRoute>} />
              <Route path="documents" element={<FeatureRoute feature="documents"><DocumentsPage /></FeatureRoute>} />
              <Route path="messaging" element={<FeatureRoute feature="messaging"><MessagingPage /></FeatureRoute>} />
              <Route path="noticeboard" element={<FeatureRoute feature="noticeboard"><NoticeBoardPage /></FeatureRoute>} />
              <Route path="compliance" element={<FeatureRoute feature="compliance"><CompliancePage /></FeatureRoute>} />
              <Route path="biometric" element={<FeatureRoute feature="biometric"><BiometricPage /></FeatureRoute>} />
              <Route path="automation" element={<FeatureRoute feature="automation"><AutomationPage /></FeatureRoute>} />
              <Route path="letters" element={<FeatureRoute feature="letters"><LettersPage /></FeatureRoute>} />
              <Route path="settings" element={<FeatureRoute feature="settings"><SettingsPage /></FeatureRoute>} />
              <Route path="recruit-settings" element={<FeatureRoute feature="recruit_settings"><RecruitSettingsPage /></FeatureRoute>} />
              <Route path="forms" element={<FeatureRoute feature="forms"><FormsPage /></FeatureRoute>} />
              <Route path="tenant-management" element={<TenantManagementPage />} />
              <Route path="compliance-dashboard" element={<ComplianceDashboardPage />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
              <Route path="admin" element={<AdminPortalPage />} />
            </Route>

            {/* Standalone Protected Routes (No App Layout) */}
            <Route
              path="/inspector-mode"
              element={
                <ProtectedRoute>
                  <InspectorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-passport"
              element={
                <ProtectedRoute>
                  <StaffPassportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-portal"
              element={
                <ProtectedRoute>
                  <StaffPortalPage />
                </ProtectedRoute>
              }
            />

            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
