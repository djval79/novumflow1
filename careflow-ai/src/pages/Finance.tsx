
import React, { useState } from 'react';
import { 
  BadgePoundSterling, FileText, Download, Send, CheckCircle2, 
  AlertCircle, Printer, DollarSign, Wallet, TrendingUp, MoreHorizontal 
} from 'lucide-react';
import { PayrollRecord, Invoice } from '../types';
import { MOCK_PAYROLL } from '../services/mockData';

// Mock Data
const MOCK_INVOICES: Invoice[] = [
  { 
    id: 'INV-2023-001', clientId: '1', clientName: 'Council Funding Block A', date: '2023-10-01', dueDate: '2023-10-30', 
    items: [{ description: 'Care Services - Sept', quantity: 400, unitPrice: 22.50, total: 9000 }], 
    totalAmount: 9000, status: 'Paid' 
  },
  { 
    id: 'INV-2023-002', clientId: '2', clientName: 'Edith Crawley', date: '2023-10-05', dueDate: '2023-10-19', 
    items: [{ description: 'Personal Care', quantity: 24, unitPrice: 28.00, total: 672 }], 
    totalAmount: 672, status: 'Overdue' 
  },
  { 
    id: 'INV-2023-003', clientId: '3', clientName: 'Robert Grantham', date: '2023-10-15', dueDate: '2023-10-29', 
    items: [{ description: 'Domestic Support', quantity: 10, unitPrice: 20.00, total: 200 }], 
    totalAmount: 200, status: 'Sent' 
  },
];

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'invoices'>('payroll');
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>(MOCK_PAYROLL);
  const [invoiceData, setInvoiceData] = useState<Invoice[]>(MOCK_INVOICES);

  // Handlers
  const handleApprovePayroll = (id: string) => {
    setPayrollData(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
  };

  const handleMarkPaidPayroll = (id: string) => {
    setPayrollData(prev => prev.map(p => p.id === id ? { ...p, status: 'Paid' } : p));
  };

  const handleSendInvoice = (id: string) => {
    setInvoiceData(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'Sent' } : inv));
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
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Wallet size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500">Pending Approval</p>
                 <h3 className="text-2xl font-bold text-slate-800 mt-1">{payrollData.filter(p => p.status === 'Draft').length} Staff</h3>
              </div>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><AlertCircle size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500">Next Pay Run</p>
                 <h3 className="text-2xl font-bold text-slate-800 mt-1">31 Oct</h3>
              </div>
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20}/></div>
           </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h2 className="font-bold text-slate-800">October 2023 Payroll</h2>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                 <Download size={16}/> Export CSV
              </button>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm flex items-center gap-2">
                 <CheckCircle2 size={16}/> Run Payroll
              </button>
           </div>
        </div>
        <div className="overflow-x-auto">
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
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><DollarSign size={20}/></div>
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
              <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500">Draft Invoices</p>
                 <h3 className="text-2xl font-bold text-slate-800 mt-1">0</h3>
              </div>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><FileText size={20}/></div>
           </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-4">
        {invoiceData.map((inv) => (
          <div key={inv.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                  <FileText size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-800">{inv.clientName}</h3>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                     <span>#{inv.id}</span>
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
                  <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Download PDF"><Download size={20}/></button>
                  {inv.status === 'Draft' && (
                     <button onClick={() => handleSendInvoice(inv.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Send Invoice"><Send size={20}/></button>
                  )}
                  {inv.status === 'Overdue' && (
                     <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Send Reminder"><Send size={20}/></button>
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
    </div>
  );
};

export default Finance;
