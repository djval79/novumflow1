import React, { useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { X, Mail, Loader2, Check, Copy } from 'lucide-react';
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
                toast.success('Invitation link generated!');
            } else {
                toast.success('Invitation sent successfully!');
            }

            if (onInviteSent) onInviteSent();
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to send invitation.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            toast.success('Link copied to clipboard!');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-cyan-600" />
                        Invite Team Member
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {inviteLink ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Check className="w-6 h-6 text-green-600" />
                                </div>
                                <h4 className="font-medium text-green-900">Invitation Created!</h4>
                                <p className="text-sm text-green-700 mt-1">
                                    Share this link with the user to join <strong>{currentTenant.name}</strong>.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono"
                                />
                                <button
                                    onClick={copyLink}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                    title="Copy Link"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-white"
                                >
                                    <option value="carer">Carer</option>
                                    <option value="senior_carer">Senior Carer</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Admins and Managers can manage settings and other users.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
