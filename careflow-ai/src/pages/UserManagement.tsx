
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { Users, Mail, MoreVertical, Shield, User, Trash2, ShieldCheck, Activity, Loader2, UserPlus, X } from 'lucide-react';
import InviteUserModal from '@/components/InviteUserModal';
import { toast } from 'sonner';

interface TeamMember {
   user_id: string;
   role: string;
   is_active: boolean;
   profile: {
      full_name: string;
      email: string;
      avatar_url: string | null;
   };
}

interface Invitation {
   id: string;
   email: string;
   role: string;
   status: string;
   created_at: string;
}

export default function UserManagement() {
   const { currentTenant } = useTenant();
   const [members, setMembers] = useState<TeamMember[]>([]);
   const [invitations, setInvitations] = useState<Invitation[]>([]);
   const [loading, setLoading] = useState(true);
   const [showInviteModal, setShowInviteModal] = useState(false);

   const fetchData = async () => {
      if (!currentTenant) return;
      setLoading(true);

      try {
         const { data: membersData, error: membersError } = await supabase
            .from('user_tenant_memberships')
            .select(`
                    user_id,
                    role,
                    is_active,
                    profile:users_profiles(full_name, email, avatar_url)
                `)
            .eq('tenant_id', currentTenant.id);

         if (membersError) throw membersError;
         setMembers(membersData as any);

         const { data: invitesData, error: invitesError } = await supabase
            .from('tenant_invitations')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'pending');

         if (!invitesError) {
            setInvitations(invitesData || []);
         }

      } catch (error) {
         toast.error('Identity sync failure', {
            description: 'Could not synchronize team authorization levels.'
         });
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, [currentTenant]);

   const handleRevokeInvite = async (id: string, email: string) => {
      const revokeToast = toast.loading(`Revoking authorization vector for ${email}...`);
      try {
         const { error } = await supabase
            .from('tenant_invitations')
            .delete()
            .eq('id', id);

         if (error) throw error;

         toast.success('Invitation Purged', { id: revokeToast });
         fetchData();
      } catch (error) {
         toast.error('Purge failure', { id: revokeToast });
      }
   };

   if (!currentTenant) {
      return (
         <div className="flex flex-col h-full items-center justify-center gap-6 bg-slate-50">
            <Loader2 className="animate-spin text-primary-600" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Authorization Matrix...</p>
         </div>
      );
   }

   return (
      <div className="max-w-7xl mx-auto space-y-12 pb-12 animate-in fade-in duration-700 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10 pt-4">
            <div className="space-y-4">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-6">
                  <ShieldCheck className="text-primary-600" size={48} />
                  IAM <span className="text-primary-600">Console</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
                  Identity and Access Management Terminal for {currentTenant.name}
               </p>
            </div>
            <button
               onClick={() => {
                  setShowInviteModal(true);
                  toast.info('Accessing invitation terminal');
               }}
               className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all active:scale-95"
            >
               <UserPlus className="w-5 h-5" />
               Dispatch Invitation
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Active Members Terminal */}
            <div className="lg:col-span-2 bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-fit pb-10 relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
               <div className="px-10 py-10 border-b border-slate-50 bg-slate-50/20 relative z-10 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
                     <Activity size={24} className="text-primary-600" />
                     Authorized Identities ({members.length})
                  </h3>
               </div>

               {loading ? (
                  <div className="p-20 text-center flex flex-col items-center gap-8">
                     <Loader2 size={64} className="animate-spin text-slate-200" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sycing logical tiers...</p>
                  </div>
               ) : (
                  <div className="divide-y divide-slate-50 relative z-10">
                     {members.map((member) => (
                        <div key={member.user_id} className="px-10 py-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                           <div className="flex items-center gap-8 text-left">
                              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-2xl transition-transform group-hover:scale-110 border-4 border-white">
                                 {member.profile?.avatar_url ? (
                                    <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                 ) : (
                                    member.profile?.full_name?.[0] || member.profile?.email?.[0] || '?'
                                 )}
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    {member.profile?.full_name || 'Unknown Identity'}
                                 </p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{member.profile?.email}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-8">
                              <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm
                                            ${member.role === 'owner' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    member.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                       'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                 {member.role.replace('_', ' ')} tier
                              </span>

                              <button className="p-4 bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-white rounded-2xl border border-transparent hover:border-slate-200 transition-all active:scale-90 shadow-sm">
                                 <MoreVertical className="w-6 h-6" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Pending Invitations Protocol Panel */}
            <div className="space-y-8">
               <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl opacity-50" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-10 flex items-center gap-4 relative z-10">
                     <Mail className="w-6 h-6 text-primary-500" />
                     Awaiting Authorization
                  </h3>

                  {invitations.length === 0 ? (
                     <div className="py-20 text-center flex flex-col items-center gap-8 border-4 border-dashed border-white/5 rounded-[3rem] animate-in fade-in">
                        <Mail size={48} className="text-slate-800" />
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Null Invitation Streams</p>
                     </div>
                  ) : (
                     <div className="space-y-6 relative z-10 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                        {invitations.map((invite) => (
                           <div key={invite.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all group/invite">
                              <div className="space-y-2 mb-6 text-left">
                                 <p className="font-black text-white text-base truncate uppercase tracking-tight">{invite.email}</p>
                                 <div className="flex items-center gap-4">
                                    <span className="text-[8px] font-black text-primary-400 uppercase tracking-widest bg-primary-900/40 px-3 py-1 rounded-lg">
                                       {invite.role.replace('_', ' ')} access
                                    </span>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                       {new Date(invite.created_at).toLocaleDateString()}
                                    </span>
                                 </div>
                              </div>
                              <button
                                 onClick={() => handleRevokeInvite(invite.id, invite.email)}
                                 className="w-full py-4 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                              >
                                 <Trash2 size={16} /> Purge Invite
                              </button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center text-center gap-6">
                  <div className="p-6 bg-slate-50 rounded-2xl"><Shield className="text-primary-600" size={32} /></div>
                  <div className="space-y-2">
                     <p className="font-black text-slate-900 uppercase tracking-tighter text-lg">Security Protocol</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        All identities must be verified via secure clinical invitation to maintain NHS and HIPAA compliance standards.
                     </p>
                  </div>
               </div>
            </div>
         </div>

         <InviteUserModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onInviteSent={fetchData}
         />
      </div>
   );
}
