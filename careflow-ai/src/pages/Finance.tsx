
import React, { useState, useEffect } from 'react';
import {
  BadgePoundSterling, FileText, Download, Send, CheckCircle2,
  AlertCircle, Printer, DollarSign, Wallet, TrendingUp, MoreHorizontal, Plus, X
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

  // Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ clientId: '', amount: 0, desc: '', dueDate: '' });

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const loadData = async () => {
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
      console.error(e);
      toast.error("Failed to load finance data");
    }
  };

  // Handlers
  const handleApprovePayroll = async (id: string) => {
    try {
      await financeService.updatePayrollStatus(id, 'approved');
      toast.success("Payroll approved");
      loadData();
    } catch (e) { toast.error("Failed to approve"); }
  };

  const handleMarkPaidPayroll = async (id: string) => {
    try {
      await financeService.updatePayrollStatus(id, 'paid');
      toast.success("Marked as paid");
      loadData();
    } catch (e) { toast.error("Failed to update"); }
  };

  const handleRunPayroll = async () => {
    if (!currentTenant) return;
    try {
      // Mocking a pay period for now
      const start = new Date().toISOString().split('T')[0];
      const end = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      await financeService.runPayroll(currentTenant.id, start, end);
      toast.success("Payroll run generated successfully");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to run payroll");
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    try {
      await financeService.createInvoice({
        tenantId: currentTenant.id,
        clientId: newInvoice.clientId,
        totalAmount: newInvoice.amount,
        dueDate: newInvoice.dueDate,
        items: [{ description: newInvoice.desc, quantity: 1, unitPrice: newInvoice.amount, total: newInvoice.amount }]
      });
      toast.success("Invoice created");
      setIsInvoiceModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create invoice");
    }
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await financeService.updateInvoiceStatus(id, 'sent');
      toast.success("Invoice sent to client"); // Mock email send
      loadData();
    } catch (e) { toast.error("Failed to send"); }
  };

  // Helper for badges
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      'Paid': 'bg-green-100 text-green-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Draft': 'bg-slate-100 text-slate-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Overdue': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  // Render Payroll Tab
  const renderPayroll = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Gross Pay</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">£{payrollData.reduce((acc, curr) => acc + curr.grossPay, 0).toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Wallet size={20} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Approval</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{payrollData.filter(p => p.status === 'Draft').length} Staff</h3>
            </div>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><AlertCircle size={20} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Next Pay Run</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">31 Oct</h3>
            </div>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Payroll Run History</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={handleRunPayroll}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> Run Payroll (All Active Staff)
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {payrollData.length === 0 ? <p className="p-8 text-center text-slate-500">No payroll records found.</p> : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Rate</th>
                  <th className="px-6 py-4">Gross Pay</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{record.staffName}</div>
                      <div className="text-xs text-slate-500">{record.role}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">{record.totalHours}h</td>
                    <td className="px-6 py-4">£{record.hourlyRate.toFixed(2)}/h</td>
                    <td className="px-6 py-4 font-bold text-slate-900">£{record.grossPay.toLocaleString()}</td>
                    <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === 'Draft' && (
                          <button onClick={() => handleApprovePayroll(record.id)} className="text-blue-600 font-medium hover:underline">Approve</button>
                        )}
                        {record.status === 'Approved' && (
                          <button onClick={() => handleMarkPaidPayroll(record.id)} className="text-green-600 font-medium hover:underline">Pay</button>
                        )}
                        <button className="p-1.5 hover:bg-slate-200 rounded text-slate-500"><MoreHorizontal size={16} /></button>
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue (Oct)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">£{invoiceData.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><DollarSign size={20} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Overdue Amount</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 text-red-600">
                £{invoiceData.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Draft Invoices</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{invoiceData.filter(i => i.status === 'Draft').length}</h3>
            </div>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><FileText size={20} /></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsInvoiceModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700"
        >
          <Plus size={18} /> Create New Invoice
        </button>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-4">
        {invoiceData.length === 0 ? <p className="text-center text-slate-500 py-8">No invoices generated yet.</p> :
          invoiceData.map((inv) => (
            <div key={inv.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{inv.clientName}</h3>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span>#{inv.id.substring(0, 8)}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>Due: {inv.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">£{inv.totalAmount.toLocaleString()}</div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Download PDF"><Download size={20} /></button>
                  {inv.status === 'Draft' && (
                    <button onClick={() => handleSendInvoice(inv.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Send Invoice"><Send size={20} /></button>
                  )}
                  {inv.status === 'Overdue' && (
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Send Reminder"><Send size={20} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Finance & Billing</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Payroll
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Invoicing
        </button>
      </div>

      {activeTab === 'payroll' ? renderPayroll() : renderInvoices()}

      {/* Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create New Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                <select
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  value={newInvoice.clientId}
                  onChange={e => setNewInvoice({ ...newInvoice, clientId: e.target.value })}
                  required
                >
                  <option value="">Select a Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Weekly Care Fee"
                  value={newInvoice.desc}
                  onChange={e => setNewInvoice({ ...newInvoice, desc: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (£)</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    min="0" step="0.01"
                    value={newInvoice.amount}
                    onChange={e => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    value={newInvoice.dueDate}
                    onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 mt-2">
                Create Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
