import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QuickAdminSetup from '../components/QuickAdminSetup';
import { log } from '@/lib/logger';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAttemptsRemaining(null);

    try {
      // Use AuthContext signIn method for authentication
      const { error: authError } = await signIn(email, password);

      if (authError) {
        log.error('Auth error', authError, { component: 'LoginPage', action: 'handleSubmit', metadata: { email } });
        setError(authError.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Get the current user after successful sign-in
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user has a profile, create admin profile if needed
        const { data: profile, error: profileError } = await supabase
          .from('users_profiles')
          .select('role, full_name')
          .eq('user_id', user.id)
          .single();

        if (!profile && !profileError) {
          // Create admin profile for existing user
          await supabase
            .from('users_profiles')
            .upsert({
              user_id: user.id,
              full_name: 'System Administrator',
              role: 'Admin',
              created_at: new Date().toISOString(),
            });
        }

        navigate('/dashboard');
      }
    } catch (err: unknown) {
      log.error('Login error', err, { component: 'LoginPage', action: 'handleSubmit' });
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* NovumSolvo Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/assets/branding/novumsolvo-logo.jpg"
              alt="NovumSolvo"
              className="h-24 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-center text-gray-600 mb-8">Sign in to NovumFlow</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{error}</p>
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <p className="text-sm mt-1 font-semibold">
                      {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                    </p>
                  )}
                  {attemptsRemaining === 0 && (
                    <Link to="/forgot-password" className="text-sm mt-2 inline-block underline">
                      Reset your password
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-700">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-600 hover:text-cyan-700 font-semibold">
              Sign up
            </Link>
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-2">Want to start your own workspace?</p>
            <Link
              to="/tenant/create"
              className="inline-flex items-center text-sm text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-full hover:bg-cyan-100 transition font-medium"
            >
              <Building2 className="w-4 h-4 mr-1.5" />
              Create New Organization
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-white mb-1">NovumFlow</p>
          <p className="text-xs text-gray-300">HR & Recruitment Management Platform</p>
          <p className="text-xs text-gray-400 mt-2">Powered by <span className="text-cyan-400 font-semibold">NovumSolvo Ltd</span></p>
        </div>
      </div>

      {/* Quick Admin Setup */}
      <QuickAdminSetup />
    </div>
  );
}
