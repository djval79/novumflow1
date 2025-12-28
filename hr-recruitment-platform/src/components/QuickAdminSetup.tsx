import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { Shield, Settings } from 'lucide-react';

export default function QuickAdminSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function createAdminAccount() {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Set up admin profile
        const { error: profileError } = await supabase
          .from('users_profiles')
          .upsert({
            user_id: authData.user.id,
            full_name: 'System Administrator',
            role: 'Admin',
            created_at: new Date().toISOString(),
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
          });

        if (profileError) {
          log.error('Profile setup error', profileError, { component: 'QuickAdminSetup', action: 'createAdminAccount' });
          // Continue anyway, as the main account is created
        }

        // Log the action
        await supabase.from('audit_logs').insert({
          user_id: authData.user.id,
          action: 'CREATE_ADMIN_ACCOUNT',
          entity_type: 'users_profiles',
          entity_id: authData.user.id,
          details: 'Admin account created with full privileges',
          timestamp: new Date().toISOString()
        });

        setSuccess(true);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      }
    } catch (error: any) {
      log.error('Error creating admin account', error, { component: 'QuickAdminSetup', action: 'createAdminAccount' });
      setError(error.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-medium text-green-800">Admin Account Created!</h3>
            <p className="text-sm text-green-600">Full admin privileges granted. Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Settings className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-medium text-gray-900">Quick Admin Setup</h3>
            <p className="text-xs text-gray-600">Create admin account instantly</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Admin email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Admin password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            onClick={createAdminAccount}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Create Admin Account
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Creates account with full admin privileges for Notice Board and all features
          </p>
        </div>
      </div>
    </div>
  );
}