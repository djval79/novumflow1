import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use ONLY direct Supabase auth - no Edge Functions
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        log.security('failed_login', {
          component: 'SimpleLoginPage',
          metadata: { email, reason: authError.message }
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create or update admin profile - direct database call
        await supabase
          .from('users_profiles')
          .upsert({
            user_id: data.user.id,
            full_name: 'Administrator',
            role: 'Admin',
            email: data.user.email,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        log.track('login_success', {
          component: 'SimpleLoginPage',
          userId: data.user.id
        });

        navigate('/dashboard');
      }
    } catch (err) {
      log.error('Login error', err, { component: 'SimpleLoginPage' });
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function createQuickAccount() {
    setLoading(true);
    try {
      // Create account with direct auth
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@novumflow.com',
        password: 'admin123456',
      });

      if (error) throw error;

      if (data.user) {
        // Create admin profile
        await supabase
          .from('users_profiles')
          .upsert({
            user_id: data.user.id,
            full_name: 'System Administrator',
            role: 'Admin',
            email: data.user.email,
            created_at: new Date().toISOString(),
          });

        log.track('quick_account_created', {
          component: 'SimpleLoginPage',
          userId: data.user.id
        });

        alert('Admin account created!\nEmail: admin@novumflow.com\nPassword: admin123456\nRedirecting...');
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      log.error('Quick account creation failed', err, { component: 'SimpleLoginPage' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">NOVUMFLOW Access</h1>
          <p className="text-center text-gray-600 mb-8">Direct Authentication (No Edge Functions)</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={createQuickAccount}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Instant Admin Account'}
            </button>

            <div className="text-center text-gray-500 text-sm">OR</div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Bypass method for Edge Function issues
          </p>
        </div>
      </div>
    </div>
  );
}