import React, { useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { X, Mail, Loader2, Check, Copy, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInviteSent?: () => void;
}

export default function InviteUserModal({ isOpen, onClose, onInviteSent }: InviteUserModalProps) {
    const { currentTenant } = useTenant();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('carer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    if (!isOpen || !currentTenant) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInviteLink(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('invite_user_to_tenant', {
                p_email: email,
                p_role: role,
                p_tenant_id: currentTenant.id
            });

            if (rpcError) throw rpcError;

            const { data: invite, error: inviteError } = await supabase
                .from('tenant_invitations')
                .select('token')
                .eq('id', data)
                .single();

            if (inviteError) throw inviteError;

            if (invite?.token) {
                const link = `${window.location.origin}/accept-invite?token=${invite.token}`;
                setInviteLink(link);
                toast.success('Secure Link Generated');
            } else {
                toast.success('Invitation Protocol Initiated');
            }

            if (onInviteSent) onInviteSent();
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to send invitation.';
            setError(errorMessage);
            toast.error('Invitation Failed', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            toast.success('Link Copied to Clipboard');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 relative">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <UserPlus className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Dispatch Invite</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Identity Authorization</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {inviteLink ? (
                        <div className="space-y-8 text-center animate-in slide-in-from-bottom-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                                    <Check className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Protocol Active</h4>
                                    <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs mx-auto">
                                        Secure access link generated for <span className="text-emerald-600 font-bold">{email}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                                    <code className="flex-1 px-4 py-3 text-xs font-mono text-slate-600 truncate bg-white rounded-xl border border-slate-100">
                                        {inviteLink}
                                    </code>
                                    <button
                                        onClick={copyLink}
                                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors shadow-lg active:scale-95"
                                        title="Copy Link"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Expires in 48 hours
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Close Terminal
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-rose-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">Error Protocol</p>
                                        <p className="text-xs text-rose-600 mt-1">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Authorized Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="colleague@careflow.ai"
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border-4 border-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-300 placeholder:font-normal"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">clearance Level</label>
                                    <div className="relative">
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full px-6 py-5 bg-slate-50 border-4 border-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="carer">Carer (Field Access)</option>
                                            <option value="senior_carer">Senior Carer</option>
                                            <option value="nurse">Nurse</option>
                                            <option value="manager">Manager (Admin)</option>
                                            <option value="admin">System Administrator</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Shield className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    Dispatch
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
