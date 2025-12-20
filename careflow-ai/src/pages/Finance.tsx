
import React, { useState, useEffect } from 'react';
import {
  BadgePoundSterling, FileText, Download, Send, CheckCircle2,
  AlertCircle, Printer, DollarSign, Wallet, TrendingUp, MoreHorizontal, Plus, X, PieChart, Landmark, ArrowUpRight, Scale
} from 'lucide-react';
import { PayrollRecord, Invoice, Client } from '../types';
import { financeService, clientService } from '../services/supabaseService';
import { useTenant } from '../context/TenantContext';
import { toast } from 'sonner';

const Finance: React.FC = () => {
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'payroll' | 'invoices'>('payroll');

  // Data State
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [invoiceData, setInvoiceData] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ clientId: '', amount: 0, desc: '', dueDate: '' });

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payroll, invoices, clientList] = await Promise.all([
        financeService.getPayrollRuns(),
        financeService.getInvoices(),
        currentTenant ? clientService.getByTenant(currentTenant.id) : []
      ]);
      setPayrollData(payroll);
      setInvoiceData(invoices);
      setClients(clientList);
    } catch (e) {
      toast.error("Cloud synchronization failure", {
        description: "Failed to load financial records from the secure vault."
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleApprovePayroll = async (id: string) => {
    const approveToast = toast.loading('Authorizing payroll distribution...');
    try {
      await financeService.updatePayrollStatus(id, 'approved');
      toast.success("Payroll cycle authorized", { id: approveToast });
      loadData();
    } catch (e) {
      toast.error("Authorization failed", { id: approveToast });
    }
  };

  const handleMarkPaidPayroll = async (id: string) => {
    const payToast = toast.loading('Processing bank transfer simulation...');
    try {
      await financeService.updatePayrollStatus(id, 'paid');
      toast.success("Transfer successfully processed", { id: payToast });
      loadData();
    } catch (e) {
      toast.error("Payment execution error", { id: payToast });
    }
  };

  const handleRunPayroll = async () => {
    if (!currentTenant) return;
    const runToast = toast.loading('Computing algorithmic pay structures...');
    try {
      const start = new Date().toISOString().split('T')[0];
      const end = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      await financeService.runPayroll(currentTenant.id, start, end);
      toast.success("New payroll vector generated", { id: runToast });
      loadData();
    } catch (e) {
      toast.error("Algorithmic error", {
        id: runToast,
        description: "Failed to compute hours and rates for active staff."
      });
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    const createToast = toast.loading('Generating ledger entry...');
    try {
      await financeService.createInvoice({
        tenantId: currentTenant.id,
        clientId: newInvoice.clientId,
        totalAmount: newInvoice.amount,
        dueDate: newInvoice.dueDate,
        items: [{ description: newInvoice.desc, quantity: 1, unitPrice: newInvoice.amount, total: newInvoice.amount }]
      });
      toast.success("Invoice successfully emitted", { id: createToast });
      setIsInvoiceModalOpen(false);
      loadData();
    } catch (e) {
      toast.error("Ledger error", { id: createToast });
    }
  };

  const handleSendInvoice = async (id: string) => {
    const sendToast = toast.loading('Dispatching digital asset...');
    try {
      await financeService.updateInvoiceStatus(id, 'sent');
      toast.success("Invoice successfully dispatched to client profile", { id: sendToast });
      loadData();
    } catch (e) {
      toast.error("Dispatch failure", { id: sendToast });
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      'Paid': 'bg-green-50 text-green-700 border-green-100',
      'Approved': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Draft': 'bg-slate-100 text-slate-500 border-slate-200',
      'Sent': 'bg-blue-50 text-blue-700 border-blue-100',
      'Overdue': 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  // Render Payroll Tab
  const renderPayroll = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Liquid Expenditure</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">£{payrollData.reduce((acc, curr) => acc + curr.grossPay, 0).toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                <TrendingUp size={14} /> Fiscal Neutral
              </div>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-inner"><Landmark size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Authorizations</p>
              <h3 className="text-4xl font-black text-rose-600 tracking-tight">{payrollData.filter(p => p.status === 'Draft').length} Units</h3>
              <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-widest">
                <AlertCircle size={14} /> Requires Signature
              </div>
            </div>
            <div className="p-4 bg-rose-50 text-rose-600 rounded-[1.5rem] shadow-inner"><ArrowUpRight size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Operational Margin</p>
              <h3 className="text-4xl font-black text-green-600 tracking-tight">24.5%</h3>
              <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest">
                <Scale size={14} /> Optimization Optimized
              </div>
            </div>
            <div className="p-4 bg-green-50 text-green-600 rounded-[1.5rem] shadow-inner"><TrendingUp size={24} /></div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-50/20">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Staff Distribution Ledger</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Authenticated Disbursement Vectors</p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-white border border-slate-200 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-all">
              <Download size={16} /> Export Fiscal Data
            </button>
            <button
              onClick={handleRunPayroll}
              className="px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl hover:shadow-indigo-500/10 flex items-center gap-3 transition-all active:scale-95"
            >
              <CheckCircle2 size={18} /> Execute Algorithmic Payroll
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          {payrollData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <Landmark size={48} className="text-slate-100 mb-6" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Vectorized Data Found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-50">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Identity</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Work Vectors</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Unit Rate</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gross Asset Value</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold text-sm">
                {payrollData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="font-black text-slate-900 text-base">{record.staffName}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{record.role}</div>
                    </td>
                    <td className="px-10 py-8 text-center tabular-nums text-slate-700">{record.totalHours}h Unit</td>
                    <td className="px-10 py-8 text-center tabular-nums text-slate-500">£{record.hourlyRate.toFixed(2)}</td>
                    <td className="px-10 py-8 text-center tabular-nums font-black text-slate-900 text-lg">£{record.grossPay.toLocaleString()}</td>
                    <td className="px-10 py-8 text-center"><StatusBadge status={record.status} /></td>
                    <td className="px-10 py-8">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {record.status === 'Draft' && (
                          <button onClick={() => handleApprovePayroll(record.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">Authorize</button>
                        )}
                        {record.status === 'Approved' && (
                          <button onClick={() => handleMarkPaidPayroll(record.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">Process</button>
                        )}
                        <button className="p-3 hover:bg-white border-2 border-transparent hover:border-slate-100 rounded-2xl text-slate-300 hover:text-slate-900 transition-all shadow-sm"><MoreHorizontal size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  // Render Invoices Tab
  const renderInvoices = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Invoicing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Pipeline Revenue</p>
            <h3 className="text-4xl font-black text-white tracking-tight">£{invoiceData.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}</h3>
            <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest mt-4">
              <PieChart size={14} /> Real-time Inflow
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Arrears & Late Vectors</p>
          <h3 className="text-4xl font-black text-rose-600 tracking-tight">
            £{invoiceData.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
          </h3>
          <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest mt-4">
            <AlertCircle size={14} /> Action Required
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Unemitted Drafts</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">{invoiceData.filter(i => i.status === 'Draft').length} Units</h3>
          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">
            <FileText size={14} /> Ready for Dispatch
          </div>
        </div>
      </div>

      <div className="flex justify-end pr-2">
        <button
          onClick={() => {
            setIsInvoiceModalOpen(true);
            toast.info('Ledger terminal opened');
          }}
          className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black shadow-2xl transition-all active:scale-95"
        >
          <Plus size={24} /> Create New Fiscal Asset
        </button>
      </div>

      {/* Modern Invoices List */}
      <div className="grid grid-cols-1 gap-6">
        {invoiceData.length === 0 ? (
          <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No Active Invoices in Stream</div>
        ) : (
          invoiceData.map((inv) => (
            <div key={inv.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all flex flex-col lg:flex-row items-center justify-between gap-10 group">
              <div className="flex items-center gap-8 w-full lg:w-auto">
                <div className="w-20 h-20 bg-slate-900 border-4 border-slate-50 rounded-[1.75rem] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{inv.clientName}</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">ID_{inv.id.substring(0, 8).toUpperCase()}</span>
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Clock size={12} /> Due for Settlement: {inv.dueDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-10 w-full lg:w-auto justify-between lg:justify-end">
                <div className="text-center sm:text-right space-y-2">
                  <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">£{inv.totalAmount.toLocaleString()}</div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="flex gap-4">
                  <button className="p-5 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-[1.25rem] transition-all" title="Archive as PDF"><Download size={20} /></button>
                  {inv.status === 'Draft' && (
                    <button onClick={() => handleSendInvoice(inv.id)} className="p-5 bg-indigo-50 text-indigo-600 hover:bg-black hover:text-white rounded-[1.25rem] transition-all" title="Dispatch to Client"><Send size={20} /></button>
                  )}
                  {(inv.status === 'Overdue' || inv.status === 'Sent') && (
                    <button className="p-5 bg-rose-50 text-rose-600 hover:bg-black hover:text-white rounded-[1.25rem] transition-all" title="Transmit Reminder"><Send size={20} /></button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Fiscal <span className="text-indigo-600">Terminal</span></h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Operational Billing & Cloud-Based Ledger System</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 bg-white rounded-[2rem] border border-slate-200 shadow-xl">
          <button
            onClick={() => {
              setActiveTab('payroll');
              toast.info('Switching to Payroll Stream');
            }}
            className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Payroll Units
          </button>
          <button
            onClick={() => {
              setActiveTab('invoices');
              toast.info('Switching to Inflow Stream');
            }}
            className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invoices' ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Invoicing Hub
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {activeTab === 'payroll' ? renderPayroll() : renderInvoices()}
      </div>

      {/* Premium Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6 border-none ring-0">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ledger Entry</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Generation of new Fiscal Invoice Vector</p>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Authenticated Client Target</label>
                <select
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={newInvoice.clientId}
                  onChange={e => setNewInvoice({ ...newInvoice, clientId: e.target.value })}
                  required
                >
                  <option value="">Select Protocol Target</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Operational Description</label>
                <input
                  type="text"
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="e.g. Clinical Support Cycle Alpha"
                  value={newInvoice.desc}
                  onChange={e => setNewInvoice({ ...newInvoice, desc: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Total Asset Value (£)</label>
                  <input
                    type="number"
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 tabular-nums focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    min="0" step="0.01"
                    placeholder="0.00"
                    value={newInvoice.amount || ''}
                    onChange={e => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Settlement Due Date</label>
                  <input
                    type="date"
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    value={newInvoice.dueDate}
                    onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button className="w-full py-8 bg-slate-900 text-white rounded-[1.75rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-black shadow-2xl transition-all active:scale-95 group flex items-center justify-center gap-4 mt-4">
                <BadgePoundSterling size={24} className="group-hover:rotate-12 transition-transform" />
                Initialize Ledger Emit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
