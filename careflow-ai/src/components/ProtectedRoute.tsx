import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  // IMPORTANT: All hooks must be called at the top, before any conditional returns
  const { tenants, loading: tenantLoading } = useTenant();

  const [showOverride, setShowOverride] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowOverride(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Also wait for tenant loading to complete
  if (loading || tenantLoading) {
    console.log('ProtectedRoute: Loading...');
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
          <div>
            <p className="text-slate-800 font-semibold text-lg">Verifying security...</p>
            <p className="text-slate-500 text-sm mt-1">Please wait while we check your credentials.</p>
          </div>

          {showOverride && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4">
                <p>Taking longer than expected? You can try to force entry.</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                Reload Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute: User:', user?.email, 'Profile:', profile, 'Path:', location.pathname);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user exists but no profile after loading, show error or allow limited access
  if (!profile) {
    console.warn('User logged in but no profile found. Consider creating profile.');
    // For now, allow access to dashboard but they might see limited features
    // You could also redirect to a profile creation page
  }

  // Normalize role for comparison (handle Admin vs admin)
  const userRole = profile?.role?.toLowerCase();
  const isSuperAdmin = profile?.is_super_admin;

  if (allowedRoles && userRole && !isSuperAdmin) {
    const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRole);
    if (!hasPermission) {
      console.log('Access Denied: Required', allowedRoles, 'Got', userRole);
      return <Navigate to="/" replace />;
    }
  }

  // Mobile App Redirect: Carers go straight to "My Day"
  if (userRole === 'carer' && location.pathname === '/') {
    return <Navigate to="/my-day" replace />;
  }

  // Tenant Check: If user has no tenants, force onboarding
  // (tenants and tenantLoading are now loaded at the top with other hooks)
  if (tenants.length === 0) {
    // If we are already on the onboarding page, allow access
    if (location.pathname === '/onboarding') {
      return <Outlet />;
    }

    console.log('No tenants found for user. Redirecting to Onboarding.');
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;