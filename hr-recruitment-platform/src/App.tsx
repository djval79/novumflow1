import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

function App() {
  return (
    <AuthProvider>
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
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="hr" element={<HRModulePage />} />
            <Route path="recruitment" element={<RecruitmentPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="messaging" element={<MessagingPage />} />
            <Route path="noticeboard" element={<NoticeBoardPage />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="biometric" element={<BiometricPage />} />
            <Route path="automation" element={<AutomationPage />} />
            <Route path="letters" element={<LettersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="recruit-settings" element={<RecruitSettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
