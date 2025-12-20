
import React, { useState, useEffect } from 'react';
import {
   Receipt, Plus, UploadCloud, CheckCircle2, XCircle,
   Sparkles, Loader2, Car, ShoppingBag, GraduationCap,
   MoreHorizontal, Download, Filter
} from 'lucide-react';
import { expenseService, staffService } from '../services/supabaseService';
import { analyzeReceipt } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { UserRole } from '../types';
import { toast } from 'sonner';

// Local types until types.ts is fully propagated
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
   // Simplified Role Check - In production use robust RBAC
   const isAdmin = user?.role === UserRole.ADMIN || user?.email?.includes('admin');

   const [activeTab, setActiveTab] = useState<'my-claims' | 'approvals'>('my-claims');
   const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
   const [isScanning, setIsScanning] = useState(false);
   const [showScanner, setShowScanner] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);

   // Form State
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

         // 1. Get Expenses
         const expensesData = await expenseService.getAll();

         // 2. Identify Current Staff ID from User ID
         // We probably should have this in context, but fetching here for now
         const allStaff = await staffService.getAll();
         const me = allStaff.find((s: any) => s.email === user?.email);
         // Note: s.email match is rudimentary, usually link via user_id
         // If we can't find staff, we might be Admin only or data is missing

         if (me) setCurrentStaffId(me.id);

         setExpenses(expensesData.map((e: any) => ({
            ...e,
            date: new Date(e.date).toISOString().split('T')[0] // Ensure format
         })));

      } catch (error) {
         console.error("Error loading expenses", error);
         toast.error("Failed to load expenses");
      } finally {
         setIsLoading(false);
      }
   };

   // Filter
   const myClaims = expenses.filter(e => currentStaffId && e.staffId === currentStaffId);
   const pendingApprovals = expenses.filter(e => e.status === 'submitted' || e.status === 'pending'); // Handle both cases just in case
   const displayedClaims = activeTab === 'my-claims' ? myClaims : pendingApprovals; // 'approvals' shows pending. Or should it show all history? 
   // Let's make approvals show all if needed, but usually filtered. The mock showed "expenses" (all).
   // Let's stick to: "approvals" shows ALL claims for admin view, maybe sorted by pending first.
   const adminViewClaims = activeTab === 'approvals' ? expenses.sort((a, b) => (a.status === 'submitted' ? -1 : 1)) : myClaims;

   // Handlers
   const handleApprove = async (id: string) => {
      try {
         await expenseService.updateStatus(id, 'approved');
         setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
         toast.success("Claim approved");
      } catch (error) {
         toast.error("Failed to approve");
      }
   };

   const handleReject = async (id: string) => {
      try {
         await expenseService.updateStatus(id, 'rejected'); // Add reason prompt in real app
         setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
         toast.success("Claim rejected");
      } catch (error) {
         toast.error("Failed to reject");
      }
   };

   const handleScanReceipt = async () => {
      setIsScanning(true);
      // Mock image data for now if no real upload logic
      const mockImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      try {
         const result = await analyzeReceipt(mockImage);
         // Auto-fill form
         setFormData({
            date: result.date || new Date().toISOString().split('T')[0],
            type: result.category || 'Purchase',
            amount: result.total?.toString() || '',
            description: `${result.category} at ${result.merchant}`,
            image: mockImage
         } as any);

         toast.success("Receipt scanned successfully");
      } catch (error) {
         console.error(error);
         toast.error("Scan failed");
      } finally {
         setIsScanning(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentTenant || !currentStaffId) {
         toast.error("You must be a staff member to submit claims");
         return;
      }

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

         toast.success("Claim submitted");
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
         console.error(error);
         toast.error("Failed to submit claim");
      }
   };

   const getIcon = (type: string) => {
      switch (type) {
         case 'Mileage': return <Car size={18} className="text-blue-600" />;
         case 'Purchase': return <ShoppingBag size={18} className="text-green-600" />;
         case 'Training': return <GraduationCap size={18} className="text-purple-600" />;
         default: return <Receipt size={18} className="text-slate-600" />;
      }
   };

   const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
         case 'approved': return 'bg-green-100 text-green-700 border-green-200';
         case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
         default: return 'bg-amber-100 text-amber-700 border-amber-200';
      }
   };

   if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

   return (
      <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Expenses & Mileage</h1>
               <p className="text-slate-500 text-sm">Submit claims, track reimbursement, and manage approvals.</p>
            </div>
            <div className="flex gap-2">
               <button
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2"
               >
                  <Plus size={18} /> New Claim
               </button>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
            <button
               onClick={() => setActiveTab('my-claims')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'my-claims' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <Receipt size={16} /> My Claims
            </button>
            {isAdmin && (
               <button
                  onClick={() => setActiveTab('approvals')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
               >
                  <CheckCircle2 size={16} /> Approvals
                  {pendingApprovals.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full ml-1">{pendingApprovals.length}</span>}
               </button>
            )}
         </div>

         {/* Content */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">
                  {activeTab === 'my-claims' ? 'My Expense History' : 'All Claims (Manage Approvals)'}
               </h3>
               <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><Filter size={18} /></button>
                  <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><Download size={18} /></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                     <tr>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Description</th>
                        {activeTab === 'approvals' && <th className="px-6 py-3 font-medium">Staff Member</th>}
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {(activeTab === 'approvals' ? adminViewClaims : myClaims).map(claim => (
                        <tr key={claim.id} className="hover:bg-slate-50">
                           <td className="px-6 py-4 text-slate-600">{claim.date}</td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                 {getIcon(claim.type)}
                                 <span className="font-medium text-slate-700">{claim.type}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{claim.merchantName || '-'}</p>
                              <p className="text-xs text-slate-500">{claim.description}</p>
                           </td>
                           {activeTab === 'approvals' && (
                              <td className="px-6 py-4 font-medium text-slate-700">{claim.staffName || 'Unknown'}</td>
                           )}
                           <td className="px-6 py-4 font-bold text-slate-900">£{Number(claim.amount).toFixed(2)}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(claim.status)}`}>
                                 {claim.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              {activeTab === 'approvals' && (claim.status === 'pending' || claim.status === 'submitted') ? (
                                 <div className="flex justify-end gap-2">
                                    <button onClick={() => handleApprove(claim.id)} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded" title="Approve">
                                       <CheckCircle2 size={18} />
                                    </button>
                                    <button onClick={() => handleReject(claim.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded" title="Reject">
                                       <XCircle size={18} />
                                    </button>
                                 </div>
                              ) : (
                                 <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal size={18} />
                                 </button>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {(activeTab === 'approvals' ? adminViewClaims : myClaims).length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                     <Receipt size={48} className="mx-auto mb-2 opacity-20" />
                     <p>No claims found.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Smart Scan Modal */}
         {showScanner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={20} /> AI Receipt Scanner
                     </h3>
                     <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-slate-100 rounded-full"><XCircle size={20} /></button>
                  </div>

                  <div
                     onClick={handleScanReceipt}
                     className="border-2 border-dashed border-purple-200 bg-purple-50 rounded-xl p-8 flex flex-col items-center justify-center text-purple-600 cursor-pointer hover:bg-purple-100 transition-colors mb-4"
                  >
                     {isScanning ? (
                        <div className="text-center">
                           <Loader2 size={32} className="animate-spin mb-2 mx-auto" />
                           <p className="font-bold">Extracting Data...</p>
                           <p className="text-xs mt-1">Reading Merchant, Date & Total</p>
                        </div>
                     ) : (
                        <div className="text-center">
                           <UploadCloud size={32} className="mb-2 mx-auto" />
                           <p className="font-bold">Upload Receipt Image</p>
                           <p className="text-xs mt-1">or drag and drop here</p>
                           <p className="text-[10px] text-purple-400 mt-2">(Click to simulate scan)</p>
                        </div>
                     )}
                  </div>

                  <div className="flex items-center gap-3 my-4">
                     <div className="h-px bg-slate-200 flex-1"></div>
                     <span className="text-xs text-slate-400 font-bold uppercase">Or Enter Manually</span>
                     <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <form className="space-y-3" onSubmit={handleSubmit}>
                     <input
                        type="date"
                        required
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                     />
                     <select
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                     >
                        <option>Mileage</option>
                        <option>Purchase</option>
                        <option>Training</option>
                        <option>Other</option>
                     </select>
                     <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Amount (£)"
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                     />
                     <textarea
                        placeholder="Description"
                        required
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm h-20"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                     ></textarea>

                     <button type="submit" disabled={isScanning || !currentStaffId} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50">
                        {currentStaffId ? 'Submit Claim' : 'Staff Profile Not Found'}
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Expenses;
