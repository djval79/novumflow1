import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QuickAdminSetup from '../components/QuickAdminSetup';

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
      // Use secure login edge function for account lockout protection
      const { data, error: invokeError } = await supabase.functions.invoke('secure-login', {
        body: {
          email,
          password,
          ipAddress: 'unknown',
          userAgent: navigator.userAgent,
        },
      });

      // Handle network/invoke errors
      if (invokeError) {
        console.error('Invoke error:', invokeError);
        setError('Unable to connect to authentication service. Please try again.');
        setLoading(false);
        return;
      }

      // Handle application errors from edge function
      if (data?.error) {
        const errorData = data.error;
        
        if (errorData.code === 'ACCOUNT_LOCKED') {
          setError(errorData.message);
          setAttemptsRemaining(0);
        } else if (errorData.code === 'INVALID_CREDENTIALS') {
          setError(errorData.message);
          setAttemptsRemaining(errorData.attemptsRemaining);
        } else {
          setError(errorData.message || 'Login failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // If secure login succeeded, also sign in with Supabase auth for session
      if (data?.data) {
        const { error: authError } = await signIn(email, password);
        
        if (authError) {
          setError(authError.message);
          setLoading(false);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
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
          
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-center text-gray-600 mb-8">Sign in to your HR account</p>

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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-600">
          HR & Recruitment Management Platform
        </p>
      </div>
      
      {/* Quick Admin Setup */}
      <QuickAdminSetup />
    </div>
  );
}
