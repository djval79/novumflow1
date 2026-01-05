import React, { useEffect, Suspense } from 'react';
import { automationService } from '@/lib/services/AutomationService';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { QueryProvider } from './contexts/QueryProvider';
import { HelpProvider } from './contexts/HelpContext';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import AppLayout from './components/AppLayout';
import FeatureRoute from './components/FeatureRoute';

// Critical pages - loaded immediately
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';

// Lazy-loaded pages - loaded on demand for better initial performance
const HRModulePage = React.lazy(() => import('./pages/HRModulePage'));
const RecruitmentPage = React.lazy(() => import('./pages/RecruitmentPage'));
const LettersPage = React.lazy(() => import('./pages/LettersPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const RecruitSettingsPage = React.lazy(() => import('./pages/RecruitSettingsPage'));
const CompliancePage = React.lazy(() => import('./pages/CompliancePage'));
const BiometricPage = React.lazy(() => import('./pages/BiometricPage'));
const AutomationPage = React.lazy(() => import('./pages/AutomationPage'));
const DocumentsPage = React.lazy(() => import('./pages/DocumentsPage'));
const MessagingPage = React.lazy(() => import('./pages/MessagingPage'));
const NoticeBoardPage = React.lazy(() => import('./pages/NoticeBoardPage'));
const PerformancePageRefactored = React.lazy(() => import('./pages/PerformancePageRefactored'));
const IntegrationsPage = React.lazy(() => import('./pages/IntegrationsPage'));
const FormsPage = React.lazy(() => import('./pages/FormsPage'));
const TenantManagementPage = React.lazy(() => import('./pages/TenantManagementPage'));
const ComplianceDashboardPage = React.lazy(() => import('./pages/ComplianceDashboardPage'));
const ComplianceHubPage = React.lazy(() => import('./pages/ComplianceHubPage'));
const AuditLogPage = React.lazy(() => import('./pages/AuditLogPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const InspectorDashboard = React.lazy(() => import('./pages/InspectorDashboard'));
const StaffPassportPage = React.lazy(() => import('./pages/StaffPassportPage'));
const StaffPortalPage = React.lazy(() => import('./pages/StaffPortalPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const CareFlowLandingPage = React.lazy(() => import('./pages/CareFlowLandingPage'));
const TenantSignupPage = React.lazy(() => import('./pages/TenantSignupPage'));
const AdminPortalPage = React.lazy(() => import('./pages/AdminPortalPage'));
const AdminSecurityDashboard = React.lazy(() => import('./pages/AdminSecurityDashboard'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));
const TrainingPage = React.lazy(() => import('./pages/TrainingPage'));
const ComplianceFormsPage = React.lazy(() => import('./pages/ComplianceFormsPage'));
const WorkforceManagementPage = React.lazy(() => import('./pages/WorkforceManagementPage'));
const GovernanceDashboard = React.lazy(() => import('./pages/GovernanceDashboard'));
const SponsorGuardianPage = React.lazy(() => import('./pages/SponsorGuardianPage'));
const BillingPage = React.lazy(() => import('./pages/BillingPage'));
const ShiftManagementPage = React.lazy(() => import('./pages/ShiftManagementPage'));
const ClientManagementPage = React.lazy(() => import('./pages/ClientManagementPage'));
const IncidentReportingPage = React.lazy(() => import('./pages/IncidentReportingPage'));
const ExpenseManagementPage = React.lazy(() => import('./pages/ExpenseManagementPage'));
const AuditTrailPage = React.lazy(() => import('./pages/AuditTrailPage'));

// Loading spinner for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

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

  return <div>{children}</div>;
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

  return <div>{children}</div>;
}




function App() {
  useEffect(() => {
    // Service is initialized on import, but we can add cleanup here if needed
    return () => {
      automationService.cleanup();
    };
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>
          <HelpProvider>
            <BrowserRouter>
              <PWAUpdateNotification />
              <Suspense fallback={<PageLoader />}>
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

                  {/* Landing Pages - Domain-aware routing */}
                  <Route
                    path="/"
                    element={
                      <PublicRoute>
                        <Suspense fallback={<PageLoader />}>
                          {/* Show CareFlow landing on careflow domains, NovumFlow landing otherwise */}
                          {window.location.hostname.includes('careflow') ? (
                            <CareFlowLandingPage />
                          ) : (
                            <LandingPage />
                          )}
                        </Suspense>
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/careflow"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <CareFlowLandingPage />
                      </Suspense>
                    }
                  />

                  {/* Protected Routes (App Wrapper) */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<FeatureRoute feature="dashboard"><DashboardPage /></FeatureRoute>} />
                    <Route path="hr" element={<FeatureRoute feature="hr_module"><HRModulePage /></FeatureRoute>} />
                    <Route path="recruitment" element={<FeatureRoute feature="recruitment"><RecruitmentPage /></FeatureRoute>} />
                    <Route path="performance" element={<FeatureRoute feature="performance"><PerformancePageRefactored /></FeatureRoute>} />
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
                    <Route path="compliance-hub" element={<ComplianceHubPage />} />
                    <Route path="compliance-forms" element={<ComplianceFormsPage />} />
                    <Route path="audit-logs" element={<AuditLogPage />} />
                    <Route path="admin" element={<AdminPortalPage />} />
                    <Route path="admin/security" element={<AdminSecurityDashboard />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="team" element={<TeamPage />} />
                    <Route path="onboarding" element={<OnboardingPage />} />
                    <Route path="training" element={<TrainingPage />} />
                    <Route path="workforce-management" element={<WorkforceManagementPage />} />
                    <Route path="governance" element={<GovernanceDashboard />} />
                    <Route path="sponsor-guardian" element={<SponsorGuardianPage />} />
                    <Route path="billing" element={<BillingPage />} />
                    <Route path="shifts" element={<ShiftManagementPage />} />
                    <Route path="clients" element={<ClientManagementPage />} />
                    <Route path="incidents" element={<IncidentReportingPage />} />
                    <Route path="expenses" element={<ExpenseManagementPage />} />
                    <Route path="audit" element={<AuditTrailPage />} />
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

                  {/* Standalone Protected Routes (No App Layout) */}{/*  */}

                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </HelpProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
