
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { Users, Mail, MoreVertical, Shield, User, Trash2 } from 'lucide-react';
import InviteUserModal from '@/components/InviteUserModal';

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
         // 1. Fetch Members
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

         // 2. Fetch Invitations
         const { data: invitesData, error: invitesError } = await supabase
            .from('tenant_invitations')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'pending');

         if (invitesError) {
            // Ignore error if table doesn't exist yet (migration pending)
            console.warn('Could not fetch invitations:', invitesError);
         } else {
            setInvitations(invitesData || []);
         }

      } catch (error) {
         console.error('Error fetching team:', error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, [currentTenant]);

   const handleRevokeInvite = async (id: string) => {
      if (!confirm('Are you sure you want to revoke this invitation?')) return;

      try {
         await supabase
            .from('tenant_invitations')
            .delete()
            .eq('id', id);

         fetchData(); // Refresh list
      } catch (error) {
         console.error('Error revoking invite:', error);
      }
   };

   if (!currentTenant) return <div>Loading...</div>;

   return (
      <div className="max-w-5xl mx-auto p-6">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
               <p className="text-gray-500">Manage access and roles for {currentTenant.name}</p>
            </div>
            <button
               onClick={() => setShowInviteModal(true)}
               className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
               <Mail className="w-4 h-4" />
               Invite Member
            </button>
         </div>

         <div className="space-y-8">
            {/* Pending Invitations */}
            {invitations.length > 0 && (
               <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                  <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                     <Mail className="w-4 h-4 text-orange-600" />
                     <h3 className="font-semibold text-orange-900">Pending Invitations</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                     {invitations.map((invite) => (
                        <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                           <div>
                              <p className="font-medium text-gray-900">{invite.email}</p>
                              <p className="text-sm text-gray-500">
                                 Invited as <span className="capitalize font-medium">{invite.role.replace('_', ' ')}</span> • {new Date(invite.created_at).toLocaleDateString()}
                              </p>
                           </div>
                           <button
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                           >
                              Revoke
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Active Members */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Active Members ({members.length})</h3>
               </div>

               {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading team...</div>
               ) : (
                  <div className="divide-y divide-gray-200">
                     {members.map((member) => (
                        <div key={member.user_id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
                                 {member.profile?.full_name?.[0] || member.profile?.email?.[0] || '?'}
                              </div>
                              <div>
                                 <p className="font-medium text-gray-900">
                                    {member.profile?.full_name || 'Unknown User'}
                                    {member.user_id === supabase.auth.getUser() && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">You</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">{member.profile?.email}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                    member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                       'bg-gray-100 text-gray-800'}`}>
                                 {member.role.replace('_', ' ')}
                              </span>

                              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                                 <MoreVertical className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
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
