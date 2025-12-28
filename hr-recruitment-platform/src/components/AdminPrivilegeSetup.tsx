import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, Settings } from 'lucide-react';

export default function AdminPrivilegeSetup() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkCurrentRole();
  }, [user]);

  async function checkCurrentRole() {
    if (!user) return;

    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('role, full_name')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserRole(data.role || 'No role assigned');
      } else {
        setUserRole('No profile found');
      }
    } catch (error) {
      log.error('Error checking role', error, { component: 'AdminPrivilegeSetup', action: 'checkCurrentRole' });
      setUserRole('Error checking role');
    } finally {
      setChecking(false);
    }
  }

  async function setupFullAdminAccess() {
    if (!user) return;

    setLoading(true);
    try {
      // Use direct DB call instead of Edge Function for reliability
      const { error } = await supabase
        .from('users_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          full_name: 'System Administrator',
          role: 'Admin',
          updated_at: new Date().toISOString(),
          permissions: JSON.stringify([
            'create_jobs',
            'manage_applications',
            'schedule_interviews',
            'manage_employees',
            'create_announcements',
            'manage_documents',
            'generate_letters',
            'access_reports',
            'manage_settings',
            'admin_access'
          ])
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      if (error) throw error;

      setUserRole('Admin');
      setSuccess(true);

      // Add audit log (best effort)
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'SET_ADMIN_PRIVILEGES',
        entity_type: 'users_profiles',
        entity_id: user.id,
        details: 'Full admin access granted via Edge Function',
        timestamp: new Date().toISOString()
      });

      // Refresh the page after 2 seconds to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      log.error('Error setting admin privileges', error, { component: 'AdminPrivilegeSetup', action: 'setupFullAdminAccess' });
      alert('Failed to grant admin access: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const isAdmin = userRole === 'Admin';
  const needsSetup = !isAdmin && userRole !== 'checking';

  // Hide badge if user is already Admin
  if (isAdmin) return null;

  if (success) {
    return (
      <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-medium text-green-800">Admin Access Granted!</h3>
            <p className="text-sm text-green-600">Full privileges activated. Refreshing page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-md">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">Account Privileges</h3>
            <p className="text-sm text-gray-600">Email: {user.email}</p>
          </div>
        </div>

        <div className="mb-3 p-3 bg-gray-50 rounded">
          <p className="text-sm">
            <strong>Current Role:</strong> {checking ? 'Checking...' : userRole}
          </p>
          {isAdmin && (
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Full Admin Access</span>
            </div>
          )}
        </div>

        {needsSetup && (
          <div>
            <p className="text-sm text-orange-600 mb-3">
              You need admin privileges to access all features including the Notice Board.
            </p>
            <button
              onClick={setupFullAdminAccess}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Setting up...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  Grant Full Admin Access
                </>
              )}
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="text-center">
            <p className="text-sm text-green-600">✅ You have full admin privileges!</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Refresh page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}