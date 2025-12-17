
import React, { useState } from 'react';
import { 
  Receipt, Plus, UploadCloud, CheckCircle2, XCircle, 
  Sparkles, Loader2, Car, ShoppingBag, GraduationCap, 
  MoreHorizontal, Download, Filter
} from 'lucide-react';
import { MOCK_EXPENSES } from '../services/mockData';
import { ExpenseClaim } from '../types';
import { analyzeReceipt } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const [activeTab, setActiveTab] = useState<'my-claims' | 'approvals'>('my-claims');
  const [expenses, setExpenses] = useState<ExpenseClaim[]>(MOCK_EXPENSES);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Filter
  const myClaims = expenses.filter(e => e.staffName === user?.name || e.staffId === user?.id);
  const pendingApprovals = expenses.filter(e => e.status === 'Pending');

  const displayedClaims = activeTab === 'my-claims' ? myClaims : expenses;

  // Handlers
  const handleApprove = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
  };

  const handleReject = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));
  };

  const handleScanReceipt = async () => {
    setIsScanning(true);
    // Mock image data
    const mockImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    try {
      const result = await analyzeReceipt(mockImage);
      
      const newClaim: ExpenseClaim = {
        id: `ex_${Date.now()}`,
        staffId: user?.id || '1',
        staffName: user?.name || 'Unknown',
        date: result.date,
        type: result.category,
        amount: result.total,
        description: `${result.category} at ${result.merchant}`,
        status: 'Pending',
        merchantName: result.merchant
      };

      setExpenses([newClaim, ...expenses]);
      setShowScanner(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Mileage': return <Car size={18} className="text-blue-600" />;
      case 'Purchase': return <ShoppingBag size={18} className="text-green-600" />;
      case 'Training': return <GraduationCap size={18} className="text-purple-600" />;
      default: return <Receipt size={18} className="text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

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
               {activeTab === 'my-claims' ? 'My Expense History' : 'Pending Approvals'}
            </h3>
            <div className="flex gap-2">
               <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><Filter size={18}/></button>
               <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><Download size={18}/></button>
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
                  {displayedClaims.map(claim => (
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
                           <td className="px-6 py-4 font-medium text-slate-700">{claim.staffName}</td>
                        )}
                        <td className="px-6 py-4 font-bold text-slate-900">£{claim.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(claim.status)}`}>
                              {claim.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {activeTab === 'approvals' && claim.status === 'Pending' ? (
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
            {displayedClaims.length === 0 && (
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
                  <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-slate-100 rounded-full"><XCircle size={20}/></button>
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
                     </div>
                  )}
               </div>

               <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs text-slate-400 font-bold uppercase">Or Enter Manually</span>
                  <div className="h-px bg-slate-200 flex-1"></div>
               </div>

               <form className="space-y-3">
                  <input type="date" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                  <select className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                     <option>Mileage</option>
                     <option>Purchase</option>
                     <option>Training</option>
                     <option>Other</option>
                  </select>
                  <input type="number" placeholder="Amount (£)" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                  <textarea placeholder="Description" className="w-full p-2 border border-slate-300 rounded-lg text-sm h-20"></textarea>
                  
                  <button type="button" className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">
                     Submit Claim
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Expenses;
