
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ShiftManagement from './pages/ShiftManagement';
import CarePlanning from './pages/CarePlanning';
import People from './pages/People';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import AcceptInvite from './pages/AcceptInvite';
import Onboarding from './pages/Onboarding';
import FinanceDashboard from './pages/FinanceDashboard';
import VisitDetails from './pages/VisitDetails';
import Messages from './pages/Messages';
import StaffPortal from './pages/StaffPortal';
import RouteOptimizer from './pages/RouteOptimizer';
import MedicationPage from './pages/Medication';
import FormsPage from './pages/Forms';
import TrainingPage from './pages/Training';
import IncidentsPage from './pages/Incidents';
import Recruitment from './pages/Recruitment';
import CRM from './pages/CRM';
import Telehealth from './pages/Telehealth';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import Help from './pages/Help';
import Assets from './pages/Assets';
import Expenses from './pages/Expenses';
import ShiftMarket from './pages/ShiftMarket';
import Activities from './pages/Activities';
import UserManagement from './pages/UserManagement';
import DataImport from './pages/DataImport';
import Feedback from './pages/Feedback';
import Nutrition from './pages/Nutrition';
import Inventory from './pages/Inventory';
import MobileSchedule from './pages/MobileSchedule';
import TenantSettings from './pages/TenantSettings';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { UserRole } from './types';
import QuickActions from './components/QuickActions';

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
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
    <AuthProvider>
      <TenantProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
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
  );
};

export default App;
