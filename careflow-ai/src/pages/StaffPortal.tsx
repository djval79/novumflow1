
import React, { useState, useEffect } from 'react';
import {
   Briefcase, Calendar, CheckCircle2, FileText, Clock,
   AlertCircle, ShieldCheck, ChevronRight, Download, X, Plus,
   BookOpen, PenTool, Loader2, User, Activity, Zap, TrendingUp, Shield, ArrowRight, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../lib/supabase';
import { leaveService, staffService, policyService, documentService } from '../services/supabaseService';
import complianceCheckService, { ComplianceStatus } from '../services/ComplianceCheckService';
import { LeaveRequest, PolicyDocument } from '../types';
import { toast } from 'sonner';

const StaffPortal: React.FC = () => {
   const { user } = useAuth();
   const { currentTenant } = useTenant();
   const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'leave' | 'pay' | 'documents'>('overview');
   const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
   const [policies, setPolicies] = useState<PolicyDocument[]>([]);
   const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
   const [readingPolicy, setReadingPolicy] = useState<PolicyDocument | null>(null);

   const [profile, setProfile] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [payslips, setPayslips] = useState<any[]>([]);
   const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
   const [documents, setDocuments] = useState<any[]>([]);
   const [documentsLoading, setDocumentsLoading] = useState(false);

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
            const { data: staffData } = await supabase
               .from('careflow_staff')
               .select('*')
               .eq('tenant_id', currentTenant.id)
               .eq('email', user.email)
               .maybeSingle();

            if (staffData) {
               setProfile(staffData);
               const requests = await leaveService.getAll(staffData.id);
               setLeaveRequests(requests);

               // Fetch real compliance data
               const comp = await complianceCheckService.checkStaffCompliance(staffData.id, currentTenant.id);
               setCompliance(comp);
            }

            const policiesData = await policyService.getAll(currentTenant.id);
            if (policiesData.length > 0) {
               const mapped = policiesData.map((p: any) => ({
                  id: p.id,
                  title: p.title,
                  category: p.category,
                  lastUpdated: p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : 'N/A',
                  mustSign: p.requiresAcknowledgement || false,
                  isSigned: false,
                  contentPreview: 'Click to view full policy document.'
               }));
               setPolicies(mapped);
            } else {
               setPolicies([
                  { id: '1', title: 'Health & Safety Policy', category: 'Health & Safety', lastUpdated: 'Dec 2024', mustSign: true, isSigned: false, contentPreview: 'Our commitment to maintaining a safe working environment...' },
                  { id: '2', title: 'Safeguarding Policy', category: 'Safeguarding', lastUpdated: 'Nov 2024', mustSign: true, isSigned: false, contentPreview: 'Protecting vulnerable adults is our priority...' },
                  { id: '3', title: 'Medication Policy', category: 'Clinical', lastUpdated: 'Oct 2024', mustSign: false, isSigned: false, contentPreview: 'Guidelines for safe medication administration...' }
               ]);
            }

            setPayslips([
               { id: '1', period: 'December 2024', netPay: 1850.00 },
               { id: '2', period: 'November 2024', netPay: 1920.00 },
               { id: '3', period: 'October 2024', netPay: 1780.00 }
            ]);

         } catch (e) {
            toast.error('Identity sync failure');
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [user, currentTenant]);

   useEffect(() => {
      const fetchDocs = async () => {
         if (activeTab === 'documents' && profile && currentTenant) {
            setDocumentsLoading(true);
            try {
               const docs = await documentService.getStaffDocuments(profile.novumflow_employee_id || profile.id, currentTenant.id);
               setDocuments(docs);
            } catch (err) {
               console.error('Error fetching documents:', err);
               toast.error('Failed to load documents');
            } finally {
               setDocumentsLoading(false);
            }
         }
      };
      fetchDocs();
   }, [activeTab, profile, currentTenant]);

   const holidayAllowance = 28;
   const holidayUsed = leaveRequests
      .filter(r => r.status === 'Approved' && r.type === 'Holiday')
      .length * 8;

   const policiesToSign = policies.filter(p => p.mustSign && !p.isSigned).length;

   const handleSignPolicy = (id: string, title: string) => {
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, isSigned: true } : p));
      setReadingPolicy(null);
      toast.success('Policy Acknowledged', {
         description: `Digital signature archived for: ${title}`
      });
   };

   const handleRequestLeave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile || !currentTenant) return;

      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const requestToast = toast.loading('Dispatching leave request protocol...');
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

         toast.success('Request Dispatched', { id: requestToast });
         setIsLeaveModalOpen(false);

         const requests = await leaveService.getAll(profile.id);
         setLeaveRequests(requests);
         setLeaveForm({ type: 'Holiday', startDate: '', endDate: '', reason: '' });

      } catch (error) {
         toast.error('Transmission Failure', { id: requestToast });
      }
   };

   if (loading) return <div className="flex h-full items-center justify-center p-10"><Loader2 className="animate-spin text-primary-600" size={64} /></div>;

   const renderOverview = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* Profile Dossier Card */}
         <div className="md:col-span-2 bg-white rounded-[4rem] border border-slate-100 shadow-2xl p-12 flex flex-col md:flex-row items-center md:items-start gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white uppercase shadow-2xl border-4 border-white transition-transform hover:rotate-6">
               {profile ? profile.full_name?.charAt(0) : '??'}
            </div>
            <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
               <div className="space-y-1">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                     {profile ? profile.full_name : 'Identity Null'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{profile?.role || 'Operational Unit'}</p>
               </div>
               <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[8px] font-black rounded-xl border border-green-100 uppercase tracking-widest shadow-sm">
                     {profile?.status || 'Active Status'}
                  </span>
                  <span className="px-4 py-1.5 bg-slate-50 text-slate-500 text-[8px] font-black rounded-xl border border-slate-100 uppercase tracking-widest">
                     Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
               </div>
            </div>
            <div className="text-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner min-w-[120px]">
               <div className={`text-3xl font-black ${policiesToSign > 0 ? 'text-amber-500' : 'text-primary-600'} tracking-tighter uppercase`}>{policiesToSign > 0 ? 'Review' : 'Verified'}</div>
               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Grid Status</div>
            </div>
         </div>

         {/* Compliance HUD */}
         <div className="bg-slate-900 text-white rounded-[3.5rem] shadow-2xl p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />
            <h3 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
               <ShieldCheck size={24} className="text-primary-400" /> Security Grid
            </h3>
            <div className="space-y-6">
               <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Right to Work</span>
                  {compliance?.rtw_status === 'valid' ? (
                     <CheckCircle2 size={18} className="text-green-500 animate-pulse" />
                  ) : (
                     <AlertCircle size={18} className="text-amber-500" />
                  )}
               </div>
               <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DBS Verified</span>
                  {compliance?.dbs_status === 'valid' ? (
                     <CheckCircle2 size={18} className="text-green-500 animate-pulse" />
                  ) : (
                     <AlertCircle size={18} className="text-amber-500" />
                  )}
               </div>
               <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Training</span>
                  <span className={`text-[10px] font-black ${compliance?.training_status === 'valid' ? 'text-green-500' : 'text-amber-500'}`}>
                     {compliance?.compliancePercentage || 0}%
                  </span>
               </div>
            </div>
            <button
               onClick={() => {
                  setActiveTab('policies');
                  toast.info('Accessing clinical policy manifest');
               }}
               className="w-full mt-10 py-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-primary-600 transition-all shadow-2xl active:scale-95"
            >
               Audit Protocols
            </button>
         </div>

         {/* Leave Balance Terminal */}
         <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl opacity-50 group-hover:opacity-100" />
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
               <Calendar size={24} className="text-indigo-500" /> PTO Vector
            </h3>
            <div className="space-y-6 relative z-10">
               <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                     <span className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{holidayAllowance - holidayUsed}</span>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Days Remaining</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-xl font-black text-indigo-500 tracking-tighter tabular-nums">-{holidayUsed}</span>
                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Utilized</span>
                  </div>
               </div>
               <div className="h-4 bg-slate-50 rounded-full overflow-hidden shadow-inner p-1 border border-slate-100">
                  <div
                     className="h-full bg-slate-900 rounded-full transition-all duration-1000 shadow-lg"
                     style={{ width: `${(holidayUsed / holidayAllowance) * 100}%` }}
                  ></div>
               </div>
            </div>
            <button
               onClick={() => {
                  setIsLeaveModalOpen(true);
                  toast.info('Initiating leave request protocol');
               }}
               className="w-full mt-12 py-4 border-2 border-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
            >
               Request Absense
            </button>
         </div>

         {/* Action Priority Alert */}
         {policiesToSign > 0 && (
            <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl border-4 border-amber-500/30 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50" />
               <div className="flex items-center gap-8 relative z-10">
                  <div className="p-6 bg-amber-500 text-white rounded-[1.75rem] shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-bounce group-hover:scale-110 transition-transform">
                     <BookOpen size={32} />
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Critical Compliance Warning</h4>
                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Detection of {policiesToSign} Unacknowledged Clinical Protocols.</p>
                  </div>
               </div>
               <button
                  onClick={() => setActiveTab('policies')}
                  className="mt-6 md:mt-0 px-10 py-5 bg-amber-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-amber-500 transition-all active:scale-95"
               >
                  Authorize Signing
               </button>
            </div>
         )}
      </div>
   );

   const renderPolicies = () => (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] flex items-center gap-4">
                  <Shield size={24} className="text-primary-600" /> Regulatory Manifest & Company Protocols
               </h3>
               <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-4 py-2 rounded-xl border border-primary-50 shadow-sm uppercase tracking-widestAlpha">Verification Level: Tier 1</span>
            </div>
            <div className="divide-y divide-slate-50">
               {policies.map(policy => (
                  <div key={policy.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-slate-50/50 transition-all group">
                     <div className="flex items-start gap-8">
                        <div className={`p-5 rounded-2xl shadow-2xl border-4 border-white transition-transform group-hover:scale-110 ${policy.isSigned ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}`}>
                           <FileText size={28} />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{policy.title}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{policy.category} LAYER • REVISION: {policy.lastUpdated}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        {policy.mustSign && (
                           <span className={`text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border shadow-sm ${policy.isSigned ? 'bg-green-50 text-green-700 border-green-100' : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'}`}>
                              {policy.isSigned ? 'Signature Archived' : 'PENDING AUTHORIZATION'}
                           </span>
                        )}
                        <button
                           onClick={() => {
                              setReadingPolicy(policy);
                              toast.info(`Retrieving protocol dossier: ${policy.title}`);
                           }}
                           className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm"
                        >
                           Examine
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );

   const renderLeave = () => (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8">
               <div className="bg-white px-10 py-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col gap-1 hover:scale-105 transition-transform">
                  <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest leading-none">Global Credit</span>
                  <span className="font-black text-3xl text-slate-900 tracking-tighter tabular-nums">{holidayAllowance} <span className="text-slate-300 text-sm">DAYS</span></span>
               </div>
               <div className="bg-slate-900 px-10 py-6 rounded-[2rem] shadow-2xl flex flex-col gap-1 hover:scale-105 transition-transform">
                  <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest leading-none">Net Burn Rate</span>
                  <span className="font-black text-3xl text-white tracking-tighter tabular-nums">{holidayUsed} <span className="text-slate-500 text-sm">DAYS</span></span>
               </div>
            </div>
            <button
               onClick={() => {
                  setIsLeaveModalOpen(true);
                  toast.info('Accessing Leave Authorization Terminal');
               }}
               className="px-10 py-5 bg-primary-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95"
            >
               <Plus size={20} /> Request New Vector
            </button>
         </div>

         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 bg-slate-50/20">
               <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] flex items-center gap-4">
                  <History size={24} className="text-primary-600" /> Operational Absense Log
               </h3>
            </div>
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                  <tr>
                     <th className="px-10 py-8">Request Type</th>
                     <th className="px-10 py-8">Temporal Range</th>
                     <th className="px-10 py-8">Auth Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {leaveRequests.length === 0 ? (
                     <tr><td colSpan={3} className="px-10 py-20 text-center flex flex-col items-center gap-4">
                        <Calendar size={48} className="text-slate-100 mx-auto" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Null History Buffer</p>
                     </td></tr>
                  ) : leaveRequests.map(req => (
                     <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-10 py-8 font-black text-slate-900 uppercase tracking-tight text-lg">{req.type}</td>
                        <td className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           {new Date(req.startDate).toLocaleDateString()}
                           <ArrowRight className="inline mx-4 text-primary-400" size={14} />
                           {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-8 text-right pr-20">
                           <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm ${(req.status || '').toLowerCase() === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                              (req.status || '').toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                              {req.status} Protocol
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
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] flex items-center gap-4">
                  <TrendingUp size={24} className="text-primary-600" /> Fiscal Remuneration Ledger
               </h3>
               <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-4 py-2 rounded-xl border border-primary-50 shadow-sm uppercase tracking-widestAlpha">Current Tier: Verified</span>
            </div>
            <div className="divide-y divide-slate-50">
               {payslips.length > 0 ? payslips.map(pay => (
                  <div key={pay.id} className="p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                     <div className="flex items-center gap-8">
                        <div className="p-5 bg-green-500 text-white rounded-2xl shadow-2xl group-hover:scale-110 transition-transform border-4 border-white">
                           <Briefcase size={28} />
                        </div>
                        <div className="space-y-1">
                           <p className="font-black text-slate-900 uppercase tracking-tight text-xl">{pay.period}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Settlement Volume: £{pay.netPay.toLocaleString()}</p>
                        </div>
                     </div>
                     <button
                        onClick={() => toast.success(`Initiating secure payload download: ${pay.period}`)}
                        className="flex items-center gap-4 px-8 py-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 border border-transparent hover:border-slate-700"
                     >
                        <Download size={18} /> Authorize Fetch
                     </button>
                  </div>
               )) : (
                  <div className="p-20 text-center flex flex-col items-center gap-6">
                     <TrendingUp size={64} className="text-slate-100" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Null Settlement Buffer</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   const renderDocuments = () => (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] flex items-center gap-4">
                  <FileText size={24} className="text-primary-600" /> Digital Document Repository
               </h3>
               {documentsLoading && <Loader2 className="animate-spin text-primary-600" size={20} />}
            </div>
            <div className="divide-y divide-slate-50">
               {documents.length > 0 ? documents.map(doc => (
                  <div key={doc.id} className="p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                     <div className="flex items-center gap-8">
                        <div className="p-5 bg-primary-500 text-white rounded-2xl shadow-2xl group-hover:scale-110 transition-transform border-4 border-white">
                           <FileText size={28} />
                        </div>
                        <div className="space-y-1">
                           <p className="font-black text-slate-900 uppercase tracking-tight text-xl">{doc.name}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">
                              {doc.category} • {doc.type} • {doc.uploadedDate}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black rounded-lg uppercase tracking-widest">
                           {doc.source === 'novumflow' ? 'NovumFlow Sync' : 'CareFlow Local'}
                        </span>
                        <a
                           href={doc.url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center gap-4 px-8 py-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                           <Download size={18} /> Download
                        </a>
                     </div>
                  </div>
               )) : !documentsLoading && (
                  <div className="p-20 text-center flex flex-col items-center gap-6 grayscale opacity-20">
                     <FileText size={64} className="text-slate-400" />
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">No documents archived</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-12 pb-12 animate-in fade-in duration-700 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-6">
                  <Briefcase className="text-primary-600" size={48} />
                  Staff <span className="text-primary-600">Hub</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
                  Operational Identity Terminal • Compliance Grid • Fiscal Ledger
               </p>
            </div>
         </div>

         {/* Navigation Deck */}
         <div className="flex p-2 bg-white border border-slate-100 rounded-[2.5rem] w-fit shadow-2xl relative z-20">
            {[
               { id: 'overview', label: 'Dossier', icon: Briefcase },
               { id: 'policies', label: 'Protocols', icon: FileText },
               { id: 'leave', label: 'Absense', icon: Calendar },
               { id: 'pay', label: 'Fiscal', icon: CheckCircle2 },
               { id: 'documents', label: 'Documents', icon: FileText },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => {
                     setActiveTab(tab.id as any);
                     toast.info(`Synchronizing deck: ${tab.label}`);
                  }}
                  className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
               >
                  <tab.icon size={18} /> {tab.label}
               </button>
            ))}
         </div>

         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'policies' && renderPolicies()}
         {activeTab === 'leave' && renderLeave()}
         {activeTab === 'pay' && renderPay()}
         {activeTab === 'documents' && renderDocuments()}

         {/* Policy Examination Modal */}
         {readingPolicy && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 relative">
                  <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                     <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{readingPolicy.title}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Section: {readingPolicy.category}</p>
                     </div>
                     <button onClick={() => setReadingPolicy(null)} className="p-4 hover:bg-white bg-slate-100 text-slate-900 rounded-3xl transition-all active:scale-90 shadow-sm"><X size={24} /></button>
                  </div>
                  <div className="p-16 max-h-[60vh] overflow-y-auto scrollbar-hide text-slate-600 space-y-8">
                     <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] border-l-8 border-l-indigo-500">
                        <p className="text-indigo-900 font-extrabold text-lg leading-relaxed uppercase tracking-tight italic">"{readingPolicy.contentPreview}"</p>
                     </div>
                     <div className="font-bold text-base leading-relaxed space-y-6 uppercase tracking-tight opacity-80">
                        <p>I. SYSTEMIC OBLIGATIONS: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                        <p>II. OPERATIONAL COMPLIANCE: Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                        <p>III. ETHICAL FRAMEWORK: Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                     </div>
                  </div>
                  <div className="p-12 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
                     <button onClick={() => setReadingPolicy(null)} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors">Abort Review</button>
                     {readingPolicy.mustSign && !readingPolicy.isSigned && (
                        <button
                           onClick={() => handleSignPolicy(readingPolicy.id, readingPolicy.title)}
                           className="px-12 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-[1.5rem] hover:bg-black flex items-center gap-4 shadow-2xl transition-all active:scale-95"
                        >
                           <PenTool size={20} /> Authorize & Sign Protocol
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Leave Authorization Terminal */}
         {isLeaveModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-12 animate-in zoom-in-95 duration-500 border border-slate-100 relative">
                  <div className="flex justify-between items-center mb-10">
                     <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Absense Protocol</h3>
                        <p className="text-[9px] font-black text-primary-600 uppercase tracking-[0.4em]">Temporal Allocation Request</p>
                     </div>
                     <button onClick={() => setIsLeaveModalOpen(false)} className="p-4 hover:bg-slate-50 bg-slate-100 text-slate-900 rounded-3xl transition-all shadow-sm active:scale-90"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleRequestLeave} className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Categorization</label>
                        <select
                           className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-primary-500/20 transition-all shadow-inner outline-none"
                           value={leaveForm.type}
                           onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                        >
                           <option>Holiday</option>
                           <option>Sick Leave</option>
                           <option>Compassionate</option>
                           <option>Unpaid</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Start Epoch</label>
                           <input
                              type="date" required
                              className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-primary-500/20 transition-all shadow-inner outline-none"
                              value={leaveForm.startDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">End Epoch</label>
                           <input
                              type="date" required
                              className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-primary-500/20 transition-all shadow-inner outline-none"
                              value={leaveForm.endDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                           />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Rationale Overlay (Optional)</label>
                        <textarea
                           className="w-full p-8 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-primary-500/20 transition-all shadow-inner min-h-[160px] outline-none placeholder:text-slate-300"
                           placeholder="Explain operational absence context..."
                           value={leaveForm.reason}
                           onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        ></textarea>
                     </div>
                     <button
                        type="submit"
                        className="w-full py-8 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-black transition-all flex items-center justify-center gap-6 active:scale-95"
                     >
                        <Zap size={24} className="text-primary-500" /> Dispatch Submission
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default StaffPortal;
