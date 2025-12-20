
import React, { useState, useEffect } from 'react';
import {
   Receipt, Plus, UploadCloud, CheckCircle2, XCircle,
   Sparkles, Loader2, Car, ShoppingBag, GraduationCap,
   MoreHorizontal, Download, Filter, Zap, Target, History, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { expenseService, staffService } from '../services/supabaseService';
import { analyzeReceipt } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { UserRole } from '../types';
import { toast } from 'sonner';

interface ExpenseClaim {
   id: string;
   staffId: string;
   staffName?: string;
   date: string;
   type: string;
   amount: number;
   description: string;
   status: string;
   merchantName?: string;
   receiptUrl?: string;
}

const Expenses: React.FC = () => {
   const { user } = useAuth();
   const { currentTenant } = useTenant();
   const isAdmin = user?.role === UserRole.ADMIN || user?.email?.includes('admin');

   const [activeTab, setActiveTab] = useState<'my-claims' | 'approvals'>('my-claims');
   const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
   const [isScanning, setIsScanning] = useState(false);
   const [showScanner, setShowScanner] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);

   const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      type: 'Purchase',
      amount: '',
      description: '',
      image: null as string | null
   });

   useEffect(() => {
      if (user && currentTenant) {
         loadData();
      }
   }, [user, currentTenant]);

   const loadData = async () => {
      setIsLoading(true);
      try {
         if (!currentTenant) return;
         const expensesData = await expenseService.getAll();
         const allStaff = await staffService.getAll();
         const me = allStaff.find((s: any) => s.email === user?.email);
         if (me) setCurrentStaffId(me.id);

         setExpenses(expensesData.map((e: any) => ({
            ...e,
            date: new Date(e.date).toISOString().split('T')[0]
         })));
      } catch (error) {
         toast.error("Bridge failure: Expense data retrieval interrupted");
      } finally {
         setIsLoading(false);
      }
   };

   const myClaims = expenses.filter(e => currentStaffId && e.staffId === currentStaffId);
   const pendingApprovals = expenses.filter(e => e.status === 'submitted' || e.status === 'pending');
   const adminViewClaims = activeTab === 'approvals' ? expenses.sort((a, b) => (a.status === 'submitted' ? -1 : 1)) : myClaims;

   const handleApprove = async (id: string) => {
      const appToast = toast.loading('Authorizing fiscal reimbursement...');
      try {
         await expenseService.updateStatus(id, 'approved');
         setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
         toast.success("Fiscal Authorization Granted", { id: appToast });
      } catch (error) {
         toast.error("Authorization Failure", { id: appToast });
      }
   };

   const handleReject = async (id: string) => {
      const rejToast = toast.loading('Decommissioning claim protocol...');
      try {
         await expenseService.updateStatus(id, 'rejected');
         setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
         toast.warning("Claim Decommissioned", { id: rejToast });
      } catch (error) {
         toast.error("Decommissioning Failure", { id: rejToast });
      }
   };

   const handleScanReceipt = async () => {
      setIsScanning(true);
      const scanToast = toast.loading('Initiating Neural Receipt Scan...');
      const mockImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      try {
         const result = await analyzeReceipt(mockImage);
         setFormData({
            date: result.date || new Date().toISOString().split('T')[0],
            type: result.category || 'Purchase',
            amount: result.total?.toString() || '',
            description: `${result.category} at ${result.merchant}`,
            image: mockImage
         } as any);
         toast.success("Metadata Extracted and Synthesized", { id: scanToast });
      } catch (error) {
         toast.error("Optical Recognition Failure", { id: scanToast });
      } finally {
         setIsScanning(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentTenant || !currentStaffId) {
         toast.error("Null Staff Identifier: Submission restricted");
         return;
      }

      const subToast = toast.loading('Dispatching fiscal manifest...');
      try {
         await expenseService.create({
            tenantId: currentTenant.id,
            staffId: currentStaffId,
            type: formData.type,
            amount: parseFloat(formData.amount),
            description: formData.description,
            date: formData.date,
            receiptUrl: formData.image || undefined
         });

         toast.success("Fiscal Manifest Securely Archived", { id: subToast });
         setShowScanner(false);
         setFormData({
            date: new Date().toISOString().split('T')[0],
            type: 'Purchase',
            amount: '',
            description: '',
            image: null
         });
         loadData();
      } catch (error) {
         toast.error("Manifest Transmission Failure", { id: subToast });
      }
   };

   const getIcon = (type: string) => {
      switch (type) {
         case 'Mileage': return <Car size={24} />;
         case 'Purchase': return <ShoppingBag size={24} />;
         case 'Training': return <GraduationCap size={24} />;
         default: return <Receipt size={24} />;
      }
   };

   const getStatusStyle = (status: string) => {
      switch (status.toLowerCase()) {
         case 'approved': return 'bg-emerald-900 border-emerald-500 text-emerald-400';
         case 'rejected': return 'bg-rose-900 border-rose-500 text-rose-400';
         default: return 'bg-amber-900 border-amber-500 text-amber-400';
      }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Fiscal <span className="text-primary-600">Claims</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Expense Management • Mileage Intelligence • Neural Receipt Calibration
               </p>
            </div>
            <button
               onClick={() => {
                  setShowScanner(true);
                  toast.info('Initializing New Claim Protocol');
               }}
               className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black flex items-center gap-6 active:scale-95 transition-all"
            >
               <Plus size={20} className="text-primary-500" /> Post Claim Manifest
            </button>
         </div>

         {/* Navigation Deck */}
         <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
            <button
               onClick={() => {
                  setActiveTab('my-claims');
                  toast.info('Retrieving Personal Ledger Spectrum');
               }}
               className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'my-claims' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <Receipt size={20} /> Personal Ledger
            </button>
            {isAdmin && (
               <button
                  onClick={() => {
                     setActiveTab('approvals');
                     toast.info('Retrieving Global Authorization Spectrum');
                  }}
                  className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 relative ${activeTab === 'approvals' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
               >
                  <CheckCircle2 size={20} /> Authorization
                  {pendingApprovals.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black h-8 w-8 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">{pendingApprovals.length}</span>}
               </button>
            )}
         </div>

         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5">
            <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
               <h3 className="font-black text-[12px] text-slate-900 uppercase tracking-[0.5em]">
                  {activeTab === 'my-claims' ? 'Personal Yield History' : 'Global Authorization Ledger'}
               </h3>
               <div className="flex gap-4">
                  <button onClick={() => toast.info('Filtering Protocol Active')} className="p-4 bg-white border-2 border-slate-50 rounded-2xl text-slate-400 hover:text-primary-600 hover:border-primary-500 transition-all shadow-sm"><Filter size={20} /></button>
                  <button onClick={() => toast.success('Fiscal Ledger Exported to CSV')} className="p-4 bg-white border-2 border-slate-50 rounded-2xl text-slate-400 hover:text-primary-600 hover:border-primary-500 transition-all shadow-sm"><Download size={20} /></button>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-50">
                     <tr>
                        <th className="px-12 py-8">Epoch</th>
                        <th className="px-12 py-8">Protocol</th>
                        <th className="px-12 py-8">Metadata</th>
                        {activeTab === 'approvals' && <th className="px-12 py-8">Origin Node</th>}
                        <th className="px-12 py-8">Fiscal Yield</th>
                        <th className="px-12 py-8">Integrity</th>
                        <th className="px-12 py-8 text-right">Telemetry</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {(activeTab === 'approvals' ? adminViewClaims : myClaims).map(claim => (
                        <tr key={claim.id} className="hover:bg-slate-50 transition-all group">
                           <td className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{claim.date}</td>
                           <td className="px-12 py-8">
                              <div className="flex items-center gap-4">
                                 <div className={`p-4 rounded-2xl shadow-xl transition-transform group-hover:scale-110
                                    ${claim.type === 'Mileage' ? 'bg-blue-900 text-blue-400' :
                                       claim.type === 'Purchase' ? 'bg-emerald-900 text-emerald-400' : 'bg-purple-900 text-purple-400'}
                                 `}>
                                    {getIcon(claim.type)}
                                 </div>
                                 <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{claim.type}</span>
                              </div>
                           </td>
                           <td className="px-12 py-8">
                              <p className="font-black text-lg text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-primary-600 transition-colors">{claim.merchantName || 'GENERIC MERCHANT'}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">{claim.description}</p>
                           </td>
                           {activeTab === 'approvals' && (
                              <td className="px-12 py-8">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-[10px] font-black uppercase">{(claim.staffName || 'U').charAt(0)}</div>
                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widestAlpha">{claim.staffName || 'Unknown Operator'}</span>
                                 </div>
                              </td>
                           )}
                           <td className="px-12 py-8 text-2xl font-black text-slate-900 tracking-tighter tabular-nums">£{Number(claim.amount).toFixed(2)}</td>
                           <td className="px-12 py-8">
                              <span className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-xl ${getStatusStyle(claim.status)}`}>
                                 {claim.status}
                              </span>
                           </td>
                           <td className="px-12 py-8 text-right">
                              {activeTab === 'approvals' && (claim.status === 'pending' || claim.status === 'submitted') ? (
                                 <div className="flex justify-end gap-4">
                                    <button onClick={() => handleApprove(claim.id)} className="p-4 bg-emerald-900 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-xl" title="Authorize">
                                       <CheckCircle2 size={24} />
                                    </button>
                                    <button onClick={() => handleReject(claim.id)} className="p-4 bg-rose-900 text-rose-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-xl" title="Decommission">
                                       <XCircle size={24} />
                                    </button>
                                 </div>
                              ) : (
                                 <button className="p-4 text-slate-300 hover:text-slate-900 transition-all hover:bg-white rounded-2xl">
                                    <MoreHorizontal size={24} />
                                 </button>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {(activeTab === 'approvals' ? adminViewClaims : myClaims).length === 0 && (
                  <div className="p-32 text-center grayscale opacity-10 flex flex-col items-center gap-10">
                     <Receipt size={120} className="text-slate-900" />
                     <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Fiscal Manifest</p>
                  </div>
               )}
            </div>
         </div>

         {/* Neural Scanner Modal */}
         {showScanner && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-2xl">
               <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] p-16 animate-in zoom-in-95 duration-500 relative border border-white/20">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none flex items-center gap-6">
                        <Sparkles className="text-primary-600" size={40} /> Neural Scan
                     </h3>
                     <button onClick={() => setShowScanner(false)} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-white rounded-full transition-all shadow-xl"><XCircle size={32} /></button>
                  </div>

                  <div
                     onClick={handleScanReceipt}
                     className="border-8 border-dashed border-slate-50 bg-slate-50/50 rounded-[3rem] p-16 flex flex-col items-center justify-center group/scan cursor-pointer hover:bg-white hover:border-primary-500 transition-all duration-500 relative overflow-hidden active:scale-95 shadow-inner"
                  >
                     <div className="absolute inset-0 bg-grid-slate-900/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                     {isScanning ? (
                        <div className="text-center space-y-6 relative z-10">
                           <Loader2 size={64} className="animate-spin text-primary-600 mx-auto" />
                           <div className="space-y-1">
                              <p className="font-black text-[12px] uppercase tracking-[0.4em] text-slate-900">Extracting Metadata...</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">Optical Logic Sequence Active</p>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center space-y-6 relative z-10">
                           <div className="p-8 bg-white rounded-full shadow-2xl group-hover/scan:scale-110 transition-transform"><UploadCloud size={64} className="text-primary-600" /></div>
                           <div className="space-y-1">
                              <p className="font-black text-[12px] uppercase tracking-[0.4em] text-slate-900">Upload Receipt Manifest</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drag/Drop or Click to Initialize</p>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="flex items-center gap-10 my-12">
                     <div className="h-px bg-slate-100 flex-1"></div>
                     <span className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">Manual Calibration</span>
                     <div className="h-px bg-slate-100 flex-1"></div>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                     <div className="grid grid-cols-2 gap-6">
                        <input
                           type="date"
                           required
                           className="w-full p-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widest focus:border-primary-500 outline-none transition-all shadow-inner"
                           value={formData.date}
                           onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                        <select
                           className="w-full p-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widest focus:border-primary-500 outline-none transition-all shadow-inner appearance-none"
                           value={formData.type}
                           onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                           <option>Mileage</option>
                           <option>Purchase</option>
                           <option>Training</option>
                           <option>Other Protocol</option>
                        </select>
                     </div>
                     <div className="relative">
                        <Target className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200" size={24} />
                        <input
                           type="number"
                           step="0.01"
                           required
                           placeholder="FISCAL AMOUNT (£)"
                           className="w-full pl-16 pr-6 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widest focus:border-primary-500 outline-none transition-all shadow-inner"
                           value={formData.amount}
                           onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                     </div>
                     <textarea
                        placeholder="MANIFEST DESCRIPTION / FISCAL CONTEXT"
                        required
                        className="w-full p-8 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widest focus:border-primary-500 outline-none transition-all h-[150px] shadow-inner"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                     ></textarea>

                     <button type="submit" disabled={isScanning || !currentStaffId} className="w-full py-8 bg-slate-900 text-white font-black uppercase tracking-[0.5em] text-[11px] rounded-[2.5rem] hover:bg-black disabled:opacity-30 shadow-2xl transition-all active:scale-95 mt-6">
                        {currentStaffId ? 'Synchronize Claim Manifest' : 'Operator Record Null'}
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Expenses;
