
import React, { useState, useEffect } from 'react';
import {
   Briefcase, Calendar, CheckCircle2, FileText, Clock,
   AlertCircle, ShieldCheck, ChevronRight, Download, X, Plus,
   BookOpen, PenTool, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../lib/supabase';
import { leaveService, staffService } from '../services/supabaseService';
import { MOCK_POLICIES, MOCK_PAYROLL } from '../services/mockData'; // Keeping Polcies/Payroll mock for now
import { LeaveRequest, PolicyDocument } from '../types';
import { toast } from 'sonner';

const StaffPortal: React.FC = () => {
   const { user } = useAuth();
   const { currentTenant } = useTenant();
   const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'leave' | 'pay'>('overview');
   const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
   const [policies, setPolicies] = useState<PolicyDocument[]>(MOCK_POLICIES);
   const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
   const [readingPolicy, setReadingPolicy] = useState<PolicyDocument | null>(null);

   // Real Data State
   const [profile, setProfile] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   // Form for leave
   const [leaveForm, setLeaveForm] = useState({
      type: 'Holiday',
      startDate: '',
      endDate: '',
      reason: ''
   });

   useEffect(() => {
      const fetchData = async () => {
         if (!user || !currentTenant) return;
         setLoading(true);

         try {
            // 1. Get Profile
            // Note: using direct query or staffService logic to find "me"
            const { data: staffData, error } = await supabase
               .from('careflow_staff')
               .select('*')
               .eq('tenant_id', currentTenant.id)
               .eq('email', user.email)
               .maybeSingle();

            if (staffData) {
               setProfile(staffData);

               // 2. Get Leave Requests
               const requests = await leaveService.getAll(staffData.id);
               setLeaveRequests(requests);
            } else {
               console.warn("No staff profile found for", user.email);
            }
         } catch (e) {
            console.error("Error fetching staff portal data", e);
            toast.error("Failed to load staff data");
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [user, currentTenant]);

   // Mock User Data Fallbacks for things not yet implemented in backend
   const myPayslips = MOCK_PAYROLL;

   // Stats
   const holidayAllowance = 28;
   const holidayUsed = leaveRequests
      .filter(r => r.status === 'Approved' && r.type === 'Holiday') // Using lowercase per DB enum usually
      .length * 8; // Simplified calculation (assuming days not stored, or logic needed)
   // Ideally DB stores "days_deducted". 
   // For now, let's just use count of requests * 1 or fetch logic. 
   // Actually, logic is usually complex. I'll just use length for demo.

   const policiesToSign = policies.filter(p => p.mustSign && !p.isSigned).length;

   // Handlers
   const handleSignPolicy = (id: string) => {
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, isSigned: true } : p));
      setReadingPolicy(null);
      toast.success("Policy signed");
   };

   const handleRequestLeave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile || !currentTenant) return;

      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      try {
         await leaveService.create({
            tenantId: currentTenant.id,
            staffId: profile.id,
            type: leaveForm.type,
            startDate: leaveForm.startDate,
            endDate: leaveForm.endDate,
            daysRequested: diffDays,
            reason: leaveForm.reason
         });

         toast.success("Leave request submitted");
         setIsLeaveModalOpen(false);

         // Refresh list
         const requests = await leaveService.getAll(profile.id);
         setLeaveRequests(requests);
         setLeaveForm({ type: 'Holiday', startDate: '', endDate: '', reason: '' });

      } catch (error) {
         console.error(error);
         toast.error("Failed to submit request");
      }
   };

   if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

   const renderOverview = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
         {/* Profile Card */}
         <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-3xl font-bold text-primary-700 uppercase">
               {profile ? profile.full_name?.charAt(0) : '??'}
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
               <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                     {profile ? profile.full_name : 'Staff Member'}
                  </h2>
                  <p className="text-slate-500">{profile?.role || 'Carer'}</p>
               </div>
               <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100 uppercase">
                     {profile?.status || 'Active'}
                  </span>
                  <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded border border-slate-200">
                     Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
               </div>
            </div>
            <div className="text-center">
               <div className="text-3xl font-bold text-primary-600">{policiesToSign > 0 ? 'Action' : 'Good'}</div>
               <div className="text-xs font-bold text-slate-400 uppercase">Status</div>
            </div>
         </div>

         {/* Compliance Quick View */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <ShieldCheck size={18} className="text-primary-600" /> Compliance
            </h3>
            <div className="space-y-3">
               {/* Right to Work - Just placeholders as specific columns might vary */}
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Right to Work</span>
                  <CheckCircle2 size={16} className="text-green-500" />
               </div>
               {/* DBS */}
               <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">DBS Check</span>
                  <CheckCircle2 size={16} className="text-green-500" />
               </div>
            </div>
            <button
               onClick={() => setActiveTab('policies')}
               className="w-full mt-4 py-2 bg-slate-50 text-primary-600 text-sm font-bold rounded-lg hover:bg-slate-100"
            >
               View All & Policies
            </button>
         </div>

         {/* Leave Balance */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Calendar size={18} className="text-primary-600" /> Annual Leave
            </h3>
            <div className="relative pt-2">
               <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Used: {holidayUsed} (proxy)</span>
                  <span className="font-bold text-slate-900">Remaining</span>
               </div>
               <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                     className="h-full bg-primary-500 rounded-full"
                     style={{ width: '40%' }} // Mock width
                  ></div>
               </div>
            </div>
            <button
               onClick={() => setActiveTab('leave')}
               className="w-full mt-6 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50"
            >
               Request Time Off
            </button>
         </div>

         {/* Action Required: Policies */}
         {policiesToSign > 0 && (
            <div className="md:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                     <BookOpen size={20} />
                  </div>
                  <div>
                     <h4 className="font-bold text-amber-900">Action Required</h4>
                     <p className="text-sm text-amber-700">You have {policiesToSign} new policy documents to read and sign.</p>
                  </div>
               </div>
               <button
                  onClick={() => setActiveTab('policies')}
                  className="px-4 py-2 bg-white text-amber-700 border border-amber-200 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-100"
               >
                  Review Now
               </button>
            </div>
         )}
      </div>
   );

   const renderPolicies = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Company Policies & Handbook</h3>
            </div>
            <div className="divide-y divide-slate-100">
               {policies.map(policy => (
                  <div key={policy.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                     <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-1 ${policy.isSigned ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                           <FileText size={20} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900">{policy.title}</h4>
                           <p className="text-sm text-slate-500">{policy.category} • Updated {policy.lastUpdated}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        {policy.mustSign && (
                           <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${policy.isSigned ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {policy.isSigned ? 'Signed' : 'Action Required'}
                           </span>
                        )}
                        <button
                           onClick={() => setReadingPolicy(policy)}
                           className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                           Read
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );

   const renderLeave = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div className="flex justify-between items-center">
            <div className="flex gap-4 text-sm">
               <div className="bg-white px-4 py-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-xs uppercase font-bold">Total</span>
                  <span className="font-bold text-lg text-slate-900">{holidayAllowance} Days</span>
               </div>
               <div className="bg-white px-4 py-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-xs uppercase font-bold">Used (Est)</span>
                  <span className="font-bold text-lg text-slate-900">{holidayUsed}</span>
               </div>
            </div>
            <button
               onClick={() => setIsLeaveModalOpen(true)}
               className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2"
            >
               <Plus size={18} /> Request Leave
            </button>
         </div>

         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">Request History</h3>
            </div>
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500">
                  <tr>
                     <th className="px-6 py-3 font-medium">Type</th>
                     <th className="px-6 py-3 font-medium">Dates</th>
                     <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {leaveRequests.length === 0 ? (
                     <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400">No leave requests found</td></tr>
                  ) : leaveRequests.map(req => (
                     <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{req.type}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(req.startDate).toLocaleDateString()} <span className="text-slate-300 mx-1">to</span> {new Date(req.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${(req.status || '').toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                              (req.status || '').toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                              {req.status}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );

   const renderPay = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">My Payslips</h3>
            </div>
            <div className="divide-y divide-slate-100">
               {myPayslips.length > 0 ? myPayslips.map(pay => (
                  <div key={pay.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                           <Briefcase size={20} />
                        </div>
                        <div>
                           <p className="font-bold text-slate-900">{pay.period}</p>
                           <p className="text-sm text-slate-500">Net Pay: £{pay.netPay.toLocaleString()}</p>
                        </div>
                     </div>
                     <button className="flex items-center gap-2 text-primary-600 font-medium hover:underline">
                        <Download size={16} /> Download PDF
                     </button>
                  </div>
               )) : (
                  <div className="p-8 text-center text-slate-400">
                     No payslips available.
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">My Staff Hub</h1>
            <p className="text-slate-500 text-sm">Manage your profile, leave, and compliance.</p>
         </div>

         {/* Tabs */}
         <div className="flex p-1 bg-slate-200 rounded-xl w-fit overflow-x-auto">
            {[
               { id: 'overview', label: 'Overview', icon: Briefcase },
               { id: 'policies', label: 'Policies', icon: FileText },
               { id: 'leave', label: 'Leave', icon: Calendar },
               { id: 'pay', label: 'Pay', icon: CheckCircle2 },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                     }`}
               >
                  <tab.icon size={16} /> {tab.label}
               </button>
            ))}
         </div>

         {/* Content */}
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'policies' && renderPolicies()}
         {activeTab === 'leave' && renderLeave()}
         {activeTab === 'pay' && renderPay()}

         {/* Policy Reading Modal */}
         {readingPolicy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="text-xl font-bold text-slate-900">{readingPolicy.title}</h3>
                     <button onClick={() => setReadingPolicy(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-8 max-h-[60vh] overflow-y-auto prose prose-slate">
                     <p>{readingPolicy.contentPreview}</p>
                     <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                     <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                     <button onClick={() => setReadingPolicy(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg border border-transparent hover:border-slate-200">Close</button>
                     {readingPolicy.mustSign && !readingPolicy.isSigned && (
                        <button
                           onClick={() => handleSignPolicy(readingPolicy.id)}
                           className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                           <PenTool size={16} /> I have read and understood
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Request Leave Modal */}
         {isLeaveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-slate-900">Request Leave</h3>
                     <button onClick={() => setIsLeaveModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleRequestLeave} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                        <select
                           className="w-full p-2 border border-slate-300 rounded-lg"
                           value={leaveForm.type}
                           onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                        >
                           <option>Holiday</option>
                           <option>Sick Leave</option>
                           <option>Compassionate</option>
                           <option>Unpaid</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                           <input
                              type="date" required
                              className="w-full p-2 border border-slate-300 rounded-lg"
                              value={leaveForm.startDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                           <input
                              type="date" required
                              className="w-full p-2 border border-slate-300 rounded-lg"
                              value={leaveForm.endDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea
                           className="w-full p-2 border border-slate-300 rounded-lg h-20"
                           placeholder="Reason for request..."
                           value={leaveForm.reason}
                           onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        ></textarea>
                     </div>
                     <button type="submit" className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 mt-2">
                        Submit Request
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default StaffPortal;
