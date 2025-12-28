import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';

export default function AdminSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setupAdmin = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users_profiles')
        .upsert({
          user_id: user.id,
          full_name: 'System Administrator',
          role: 'Admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (!error) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      log.error('Error setting admin role', error, { component: 'AdminSetup', action: 'setupAdmin' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
        ✅ Admin role set successfully! Refreshing page...
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow z-50">
      <div className="flex items-center gap-3">
        <span className="text-sm">Need Admin access?</span>
        <button
          onClick={setupAdmin}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Setting...' : 'Set Admin Role'}
        </button>
      </div>
    </div>
  );
}