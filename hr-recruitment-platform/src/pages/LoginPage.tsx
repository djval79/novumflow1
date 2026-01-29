import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, AlertCircle, Loader2, Shield, Eye, EyeOff, Mail, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QuickAdminSetup from '../components/QuickAdminSetup';
import { log } from '@/lib/logger';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [domain, setDomain] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const { signIn, signInWithSSO } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAttemptsRemaining(null);

    try {
      const { error: authError } = await signIn(email, password);

      if (authError) {
        log.error('Auth error', authError, { component: 'LoginPage', action: 'handleSubmit', metadata: { email } });
        setError(authError.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users_profiles')
          .select('role, full_name')
          .eq('user_id', user.id)
          .single();

        if (!profile && !profileError) {
          await supabase
            .from('users_profiles')
            .upsert({
              user_id: user.id,
              full_name: 'System Administrator',
              role: 'admin',
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

  async function handleSSOSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain) return;
    setLoading(true);
    const { error } = await signInWithSSO(domain);
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="w-full max-w-md sm:max-w-lg relative z-10">
        {/* Main login card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-scale-in">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 sm:p-8 text-center relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src="/assets/branding/novumsolvo-logo.jpg"
                    alt="NovumSolvo"
                    className="h-12 sm:h-16 w-auto object-contain drop-shadow-lg"
                  />
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
                  </div>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-cyan-100 text-sm sm:text-base">
                Sign in to your HR workspace
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Error state with improved UX */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 animate-slide-up">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    {attemptsRemaining !== null && attemptsRemaining > 0 && (
                      <p className="text-sm mt-1">
                        {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                      </p>
                    )}
                    {attemptsRemaining === 0 && (
                      <Link to="/forgot-password" className="text-sm mt-2 inline-block font-medium underline hover:text-red-800 transition-colors">
                        Reset your password
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab navigation with improved design */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => setIsEnterprise(false)}
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  !isEnterprise 
                    ? 'bg-white text-cyan-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Standard Login
              </button>
              <button
                onClick={() => setIsEnterprise(true)}
                className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isEnterprise 
                    ? 'bg-white text-cyan-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Enterprise SSO
              </button>
            </div>

            {!isEnterprise ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email field with enhanced UX */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                      focusedField === 'email' ? 'text-cyan-500' : 'text-gray-400'
                    }`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-all duration-200 ${
                        focusedField === 'email' 
                          ? 'border-cyan-500 bg-cyan-50/50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                {/* Password field with show/hide toggle */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                      focusedField === 'password' ? 'text-cyan-500' : 'text-gray-400'
                    }`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl outline-none transition-all duration-200 ${
                        focusedField === 'password' 
                          ? 'border-cyan-500 bg-cyan-50/50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Enhanced submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <span className="relative flex items-center gap-3">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSSOSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="domain" className="block text-sm font-semibold text-gray-700">
                    Company Domain
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <input
                      id="domain"
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all duration-200 hover:border-gray-300"
                      placeholder="e.g. acme-corp.com"
                    />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    You will be redirected to your organization's Identity Provider (SAML 2.0/OIDC) to complete authentication.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !domain}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5 text-cyan-400" />
                  )}
                  Continue with SSO
                </button>
              </form>
            )}

            {/* Footer links */}
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Sign up
                </Link>
              </p>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Want to start your own workspace?</p>
                <Link
                  to="/tenant/create"
                  className="inline-flex items-center text-sm px-4 py-2 rounded-full transition-all duration-200 font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 hover:scale-105"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Create New Organization
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Brand footer */}
        <div className="mt-8 text-center text-white animate-fade-in">
          <p className="text-sm font-bold mb-1">NovumFlow</p>
          <p className="text-xs text-gray-300 mb-1">HR & Recruitment Management Platform</p>
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-cyan-400">NovumSolvo Ltd</span>
          </p>
        </div>
      </div>

      <QuickAdminSetup />
    </div>
  );
}