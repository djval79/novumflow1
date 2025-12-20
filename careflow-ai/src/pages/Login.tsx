
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
          navigate(from, { replace: true });
          setTimeout(() => {
            window.location.href = '/#/';
            if (window.location.hash !== '#/') window.location.reload();
          }, 800);
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
    if (role === 'admin') setEmail('mrsonirie@gmail.com');
    if (role === 'carer') setEmail('carer@ringstead.com');
    if (role === 'family') setEmail('family@ringstead.com');
    if (role === 'client') setEmail('client@ringstead.com');
    toast.info(`Pre-loading ${role} credentials`);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 overflow-hidden relative">
      {/* Neural Background Elements */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>

      <div className="max-w-xl w-full bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-slate-900 p-16 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/30 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-28 h-28 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 backdrop-blur-3xl shadow-2xl relative z-10 border border-white/10 transition-transform group-hover:rotate-12 group-hover:scale-110">
            <Lock className="text-white" size={48} />
          </div>
          <h1 className="text-5xl font-black text-white relative z-10 tracking-tighter uppercase leading-none">
            CareFlow <span className="text-primary-500">AI</span>
          </h1>
          <p className="text-primary-500/60 mt-4 font-black uppercase tracking-[0.5em] text-[10px] relative z-10">Neural Intelligence Protocol • secure entry</p>
        </div>

        <div className="p-16 space-y-12">
          <div className="flex justify-center">
            <div className="bg-slate-50 p-2 rounded-[2rem] flex w-full shadow-inner border border-slate-100">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] transition-all ${!isSignUp ? 'bg-white shadow-2xl text-slate-900 scale-[1.05]' : 'text-slate-400 hover:text-slate-900'}`}
              >
                Authenticate
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] transition-all ${isSignUp ? 'bg-white shadow-2xl text-slate-900 scale-[1.05]' : 'text-slate-400 hover:text-slate-900'}`}
              >
                Manifest
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {isSignUp && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-8">
                <div className="space-y-3">
                  <label htmlFor="fullName" className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Legal Name Binding</label>
                  <div className="relative">
                    <User className="absolute left-6 top-5 text-slate-300" size={20} />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required={isSignUp}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 uppercase tracking-tight placeholder:text-slate-300"
                      placeholder="UNIT NAME"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Functional Role Tier</label>
                  <div className="grid grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => setRole('carer')}
                      className={`py-5 border-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${role === 'carer' ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-xl scale-[1.05]' : 'border-slate-50 bg-slate-50 text-slate-300 hover:border-slate-200'}`}
                    >
                      Operational
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-5 border-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${role === 'admin' ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-xl scale-[1.05]' : 'border-slate-50 bg-slate-50 text-slate-300 hover:border-slate-200'}`}
                    >
                      Executive
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label htmlFor="email" className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Neural Identity Vector</label>
              <div className="relative">
                <Mail className="absolute left-6 top-5 text-slate-300" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 uppercase tracking-tight placeholder:text-slate-300"
                  placeholder="ID@CAREFLOW.AI"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-6">
                <label htmlFor="password" className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Passkey Hash</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[9px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-[0.4em]"
                  >
                    Reset Vector?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-5 text-slate-300" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required={!isSignUp}
                  autoComplete="current-password"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 tracking-wider placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] hover:bg-black transition-all flex items-center justify-center gap-6 disabled:opacity-70 shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:shadow-primary-500/20 active:scale-95 group/btn"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? 'Manifest Identity' : 'Authorize Entry')}
              {!isSubmitting && <Zap size={24} className="text-primary-500 group-hover:scale-125 transition-transform" />}
            </button>

            {!isSignUp && (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={isSubmitting}
                  className="w-full bg-white border-4 border-slate-50 text-slate-400 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:text-slate-900 hover:border-slate-100 transition-all flex items-center justify-center gap-4 shadow-sm active:scale-95"
                >
                  <Wand2 size={24} className="text-primary-500" />
                  Warp Vector (Magic Link)
                </button>
              </div>
            )}
          </form>

          {!isSignUp && (
            <div className="mt-20 bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 shadow-inner relative overflow-hidden group/demo">
              <div className="absolute top-0 right-0 p-8 opacity-5 scale-150"><Cpu className="text-slate-900" size={64} /></div>
              <p className="text-[10px] text-center text-slate-400 uppercase font-black tracking-[0.5em] mb-8 relative z-10">Simulation Buffer / Demo Access</p>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <button onClick={() => fillDemo('admin')} className="flex items-center justify-center gap-3 px-6 py-4 text-[9px] font-black uppercase tracking-widest bg-white border-2 border-slate-100 hover:border-primary-500 hover:text-primary-600 rounded-2xl text-slate-500 transition-all shadow-sm">
                  <ShieldCheck size={16} /> Admin Hub
                </button>
                <button onClick={() => fillDemo('carer')} className="flex items-center justify-center gap-3 px-6 py-4 text-[9px] font-black uppercase tracking-widest bg-white border-2 border-slate-100 hover:border-primary-500 hover:text-primary-600 rounded-2xl text-slate-500 transition-all shadow-sm">
                  <Globe size={16} /> Carer Grid
                </button>
              </div>
              <p className="text-[9px] text-center text-slate-300 font-bold mt-8 uppercase tracking-[0.4em]">Passkey Hash: password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;