
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Lock, Mail, ArrowRight, User, Wand2, ShieldCheck, Zap, Globe, Cpu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'carer'>('carer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const { user } = useAuth();
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const authToast = toast.loading('Initiating handshake protocol...');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          toast.error('Identity Creation Failure', { id: authToast, description: error.message });
        } else {
          toast.success('Identity Manifested', { id: authToast });
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error('Authentication Aborted', { id: authToast, description: error.message || 'Verification level 0' });
        } else {
          toast.success('Authorization Granted', { id: authToast });
          // The landing page or App.tsx will handle the redirect based on auth state
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      toast.error('Neural Logic Corruption', { id: authToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error('Identity Vector Required', { description: 'Please enter your email address for magic link dispatch.' });
      return;
    }
    setIsSubmitting(true);
    const magicToast = toast.loading('Calibrating magic link trajectory...');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success('Vector Dispatched', { id: magicToast, description: 'Check your transmission terminal (Inbox).' });
    } catch (err: any) {
      toast.error('Dispatch Failure', { id: magicToast, description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Identity Vector Required', { description: 'Email address needed for credential reset.' });
      return;
    }
    setIsSubmitting(true);
    const resetToast = toast.loading('Retrieving credential hash reset...');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Reset Link Archived', { id: resetToast, description: 'Transmission sent to registered address.' });
    } catch (err: any) {
      toast.error('Hash Retrieval Failed', { id: resetToast, description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (role: string) => {
    setPassword('password123');
    if (role === 'admin') setEmail('admin@careflow.ai');
    if (role === 'carer') setEmail('carer@careflow.ai');
    if (role === 'family') setEmail('family@careflow.ai');
    if (role === 'client') setEmail('client@careflow.ai');
    toast.info(`Pre-loading ${role} credentials`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-8 sm:px-8 sm:py-12 overflow-hidden relative">
      {/* Enhanced Neural Background with Better Contrast */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/20 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-cyan-600/15 rounded-full blur-[100px] -ml-32 -mb-32"></div>
      <div className="absolute inset-0 bg-grid-white/[0.03] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>

      <div className="max-w-xl w-full bg-white rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.7)] overflow-hidden border-2 border-white/20 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-slate-950 p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-cyan-600/20 pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white/10 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 sm:mb-10 backdrop-blur-3xl shadow-2xl relative z-10 border-2 border-white/20 transition-transform group-hover:rotate-12 group-hover:scale-110">
            <Lock className="text-white" size={32} sm:size={40} lg:size={48} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white relative z-10 tracking-tighter uppercase leading-none">
            CareFlow <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-cyan-400/80 mt-3 sm:mt-4 font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-[8px] sm:text-[10px] relative z-10">Neural Intelligence Protocol • secure entry</p>
        </div>

        <div className="p-8 sm:p-12 lg:p-16 space-y-8 sm:space-y-12">
          <div className="flex justify-center">
            <div className="bg-slate-100 p-2 rounded-[2rem] flex w-full shadow-inner border border-slate-200">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] transition-all ${!isSignUp ? 'bg-white shadow-2xl text-slate-900 scale-[1.05]' : 'text-slate-600 hover:text-slate-900'}`}
                aria-pressed={!isSignUp}
                role="tab"
              >
                Authenticate
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] transition-all ${isSignUp ? 'bg-white shadow-2xl text-slate-900 scale-[1.05]' : 'text-slate-600 hover:text-slate-900'}`}
                aria-pressed={isSignUp}
                role="tab"
              >
                Manifest
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {isSignUp && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
<div className="space-y-3">
                   <label htmlFor="fullName" className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] ml-6">Legal Name Binding</label>
                   <div className="relative">
                     <User className="absolute left-6 top-5 text-slate-500" size={20} aria-hidden="true" />
                     <input
                       id="fullName"
                       name="fullName"
                       type="text"
                       required={isSignUp}
                       className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-900 uppercase tracking-tight placeholder:text-slate-400"
                       placeholder="UNIT NAME"
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       aria-describedby="fullName-help"
                     />
                   </div>
                 </div>

<div className="space-y-3">
                   <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] ml-6">Functional Role Tier</label>
                   <div className="grid grid-cols-2 gap-6" role="radiogroup" aria-labelledby="role-label">
                     <button
                       type="button"
                       onClick={() => setRole('carer')}
                       className={`py-5 border-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${role === 'carer' ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xl scale-[1.05]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                       role="radio"
                       aria-checked={role === 'carer'}
                     >
                       Operational
                     </button>
                     <button
                       type="button"
                       onClick={() => setRole('admin')}
                       className={`py-5 border-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${role === 'admin' ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xl scale-[1.05]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                       role="radio"
                       aria-checked={role === 'admin'}
                     >
                       Executive
                     </button>
                   </div>
                 </div>
              </div>
            )}

            <div className="space-y-3">
              <label htmlFor="email" className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] ml-6">Neural Identity Vector</label>
              <div className="relative">
                <Mail className="absolute left-6 top-5 text-slate-500" size={20} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-900 uppercase tracking-tight placeholder:text-slate-400"
                  placeholder="ID@CAREFLOW.AI"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="email-help"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-6">
                <label htmlFor="password" className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Passkey Hash</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.4em] underline decoration-2 underline-offset-2"
                  >
                    Reset Vector?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-5 text-slate-500" size={20} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={!isSignUp}
                  autoComplete="current-password"
                  className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-900 tracking-wider placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-help"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] hover:bg-black transition-all flex items-center justify-center gap-6 disabled:opacity-70 shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:shadow-blue-500/20 active:scale-95 group/btn focus:ring-4 focus:ring-blue-500/50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} aria-label="Loading" /> : (isSignUp ? 'Manifest Identity' : 'Authorize Entry')}
              {!isSubmitting && <Zap size={24} className="text-cyan-400 group-hover:scale-125 transition-transform" aria-hidden="true" />}
            </button>

            {!isSignUp && (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={isSubmitting}
                  className="w-full bg-white border-4 border-slate-200 text-slate-600 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-4 shadow-sm active:scale-95 focus:ring-4 focus:ring-blue-500/50"
                >
                  <Wand2 size={24} className="text-cyan-500" aria-hidden="true" />
                  Warp Vector (Magic Link)
                </button>
              </div>
            )}
          </form>

          {!isSignUp && (
            <div className="mt-20 bg-slate-100 p-10 rounded-[3.5rem] border-2 border-slate-200 shadow-inner relative overflow-hidden group/demo">
              <div className="absolute top-0 right-0 p-8 opacity-10 scale-150"><Cpu className="text-slate-600" size={64} aria-hidden="true" /></div>
              <p className="text-[10px] text-center text-slate-600 uppercase font-black tracking-[0.5em] mb-8 relative z-10">Simulation Buffer / Demo Access</p>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <button onClick={() => fillDemo('admin')} className="flex items-center justify-center gap-3 px-6 py-4 text-[9px] font-black uppercase tracking-widest bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-2xl text-slate-600 transition-all shadow-sm focus:ring-2 focus:ring-blue-500/50">
                  <ShieldCheck size={16} aria-hidden="true" /> Admin Hub
                </button>
                <button onClick={() => fillDemo('carer')} className="flex items-center justify-center gap-3 px-6 py-4 text-[9px] font-black uppercase tracking-widest bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-2xl text-slate-600 transition-all shadow-sm focus:ring-2 focus:ring-blue-500/50">
                  <Globe size={16} aria-hidden="true" /> Carer Grid
                </button>
              </div>
              <p className="text-[9px] text-center text-slate-500 font-bold mt-8 uppercase tracking-[0.4em]">Passkey Hash: password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;