
import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { UserRole } from './types';
import QuickActions from './components/QuickActions';
import { DashboardSkeleton, Skeleton } from './components/Skeleton';
import { PWAUpdatePrompt, OfflineBanner, InstallPrompt } from './components/PWAComponents';
import LandingPage from './pages/LandingPage';

// Loading Skeleton for page transitions
const PageLoader = () => (
  <DashboardSkeleton />
);

// Simple centered loader for auth pages
const AuthPageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
      <Skeleton variant="text" width={120} height={16} className="mx-auto" />
    </div>
  </div>
);

// Lazy load all pages for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ShiftManagement = React.lazy(() => import('./pages/ShiftManagement'));
const CarePlanning = React.lazy(() => import('./pages/CarePlanning'));
const People = React.lazy(() => import('./pages/People'));
const Finance = React.lazy(() => import('./pages/Finance'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Integrations = React.lazy(() => import('./pages/Integrations'));
const Login = React.lazy(() => import('./pages/Login'));
const AcceptInvite = React.lazy(() => import('./pages/AcceptInvite'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const FinanceDashboard = React.lazy(() => import('./pages/FinanceDashboard'));
const VisitDetails = React.lazy(() => import('./pages/VisitDetails'));
const Messages = React.lazy(() => import('./pages/Messages'));
const StaffPortal = React.lazy(() => import('./pages/StaffPortal'));
const RouteOptimizer = React.lazy(() => import('./pages/RouteOptimizer'));
const MedicationPage = React.lazy(() => import('./pages/Medication'));
const FormsPage = React.lazy(() => import('./pages/Forms'));
const TrainingPage = React.lazy(() => import('./pages/Training'));
const IncidentsPage = React.lazy(() => import('./pages/Incidents'));
const Recruitment = React.lazy(() => import('./pages/Recruitment'));
const CRM = React.lazy(() => import('./pages/CRM'));
const Telehealth = React.lazy(() => import('./pages/Telehealth'));
const Documents = React.lazy(() => import('./pages/Documents'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Help = React.lazy(() => import('./pages/Help'));
const Assets = React.lazy(() => import('./pages/Assets'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const ShiftMarket = React.lazy(() => import('./pages/ShiftMarket'));
const Activities = React.lazy(() => import('./pages/Activities'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const DataImport = React.lazy(() => import('./pages/DataImport'));
const Feedback = React.lazy(() => import('./pages/Feedback'));
const Nutrition = React.lazy(() => import('./pages/Nutrition'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const MobileSchedule = React.lazy(() => import('./pages/MobileSchedule'));
const TenantSettings = React.lazy(() => import('./pages/TenantSettings'));

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto h-full">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      {/* Quick Actions FAB */}
      <QuickActions />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <>
      {/* PWA Components */}
      <OfflineBanner />
      <PWAUpdatePrompt />
      <InstallPrompt />

      <AuthProvider>
        <TenantProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Suspense fallback={<AuthPageLoader />}><Login /></Suspense>} />
              <Route path="/accept-invite" element={<Suspense fallback={<AuthPageLoader />}><AcceptInvite /></Suspense>} />
              <Route path="/onboarding" element={<Suspense fallback={<AuthPageLoader />}><Onboarding /></Suspense>} />

              {/* Protected Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/my-day" element={<MobileSchedule />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/telehealth" element={<Telehealth />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/nutrition" element={<Nutrition />} />

                  {/* Admin & Carer Only */}
                  <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CARER]} />}>
                    <Route path="/rostering" element={<ShiftManagement />} />
                    <Route path="/shift-market" element={<ShiftMarket />} />
                    <Route path="/visit/:id" element={<VisitDetails />} />
                    <Route path="/people" element={<People />} />
                    <Route path="/finance" element={<FinanceDashboard />} />
                    <Route path="/staff-hub" element={<StaffPortal />} />
                    <Route path="/routes" element={<RouteOptimizer />} />
                    <Route path="/forms" element={<FormsPage />} />
                    <Route path="/training" element={<TrainingPage />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/inventory" element={<Inventory />} />
                  </Route>

                  {/* Admin Only */}
                  <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/incidents" element={<IncidentsPage />} />
                    <Route path="/recruitment" element={<Recruitment />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/assets" element={<Assets />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/import" element={<DataImport />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/tenant-settings" element={<TenantSettings />} />
                  </Route>

                  {/* All Roles (Content differs inside component) */}
                  <Route path="/care-plans" element={<CarePlanning />} />
                  <Route path="/medication" element={<MedicationPage />} />
                </Route>
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </TenantProvider>
      </AuthProvider>
    </>
  );
};

export default App;
