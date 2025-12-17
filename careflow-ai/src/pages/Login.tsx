import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Lock, Mail, ArrowRight, AlertCircle, User, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'carer'>('carer');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already logged in
  const { user } = useAuth();
  React.useEffect(() => {
    if (user) {
      console.log('Login: User already authenticated, redirecting to', from);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      console.log('Login: Attempting login for', email);
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          console.error('Login: SignUp error', error);
          setError(error.message);
        } else {
          console.log('Login: SignUp success, navigating to', from);
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Login: SignIn error', error);
          setError(error.message || 'Failed to sign in');
        } else {
          console.log('Login: SignIn success, navigating to', from);
          navigate(from, { replace: true });

          // Fallback redirect if navigate fails or hangs
          setTimeout(() => {
            console.warn('Login: Navigation fallback triggered');
            window.location.href = '/#/';
            window.location.reload();
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Login: Unexpected error', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      setMessage('Magic link sent! Check your email to sign in.');
    } catch (err: any) {
      console.error('Magic Link Error:', err);
      setError(err.message || 'Failed to send magic link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setMessage('Password reset link sent! Check your email.');
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for demo
  const fillDemo = (role: string) => {
    setPassword('password123'); // Assuming this is the password, or user can type it
    if (role === 'admin') setEmail('mrsonirie@gmail.com');
    if (role === 'carer') setEmail('carer@ringstead.com'); // Placeholder
    if (role === 'family') setEmail('family@ringstead.com');
    if (role === 'client') setEmail('client@ringstead.com');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">CareFlow AI</h1>
          <p className="text-primary-100 mt-2">Secure Care Management Portal</p>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-100 p-1 rounded-lg flex">
              <button
                onClick={() => setIsSignUp(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${!isSignUp ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${isSignUp ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Create Account
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                <Mail size={16} />
                {message}
              </div>
            )}

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('carer')}
                      className={`p-3 border rounded-lg text-sm font-medium transition-all ${role === 'carer' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      Carer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`p-3 border rounded-lg text-sm font-medium transition-all ${role === 'admin' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="name@careflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={!isSignUp && !message} // Not required if just sending magic link
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Create Account' : 'Sign In')}
              {!isSubmitting && <ArrowRight size={20} />}
            </button>

            {!isSignUp && (
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={isSubmitting}
                className="w-full bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Wand2 size={18} className="text-purple-600" />
                Sign in with Magic Link
              </button>
            )}
          </form>

          {!isSignUp && (
            <div className="mt-8">
              <p className="text-xs text-center text-slate-400 uppercase tracking-wider font-semibold mb-4">Demo Credentials (Click to fill)</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => fillDemo('admin')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Admin</button>
                <button onClick={() => fillDemo('carer')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Carer</button>
                <button onClick={() => fillDemo('family')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Family</button>
                <button onClick={() => fillDemo('client')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Client</button>
              </div>
              <p className="text-xs text-center text-slate-400 mt-2">Password: password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;