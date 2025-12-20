
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import {
    DollarSign, Calendar, Download, Users, FileText,
    TrendingUp, ArrowRight, Loader2, Briefcase, Zap, Target, History, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

interface PayrollItem {
    staff_id: string;
    first_name: string;
    last_name: string;
    total_visits: number;
    total_hours: number;
    total_pay: number;
}

interface InvoiceItem {
    client_id: string;
    first_name: string;
    last_name: string;
    total_visits: number;
    total_hours: number;
    total_charge: number;
}

export default function FinanceDashboard() {
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'payroll' | 'invoices'>('payroll');
    const [loading, setLoading] = useState(false);

    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
    const [invoiceData, setInvoiceData] = useState<InvoiceItem[]>([]);

    useEffect(() => {
        if (currentTenant) {
            fetchData();
        }
    }, [currentTenant, activeTab, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        const fetchToast = toast.loading(`Initiating Fiscal Spectrum Retrieval: ${activeTab.toUpperCase()}`);
        try {
            if (activeTab === 'payroll') {
                const { data, error } = await supabase.rpc('get_payroll_report', {
                    p_tenant_id: currentTenant!.id,
                    p_start_date: startDate,
                    p_end_date: endDate
                });
                if (error) throw error;
                setPayrollData(data || []);
                toast.success('Payroll Ledger Synchronized', { id: fetchToast });
            } else {
                const { data, error } = await supabase.rpc('get_invoice_report', {
                    p_tenant_id: currentTenant!.id,
                    p_start_date: startDate,
                    p_end_date: endDate
                });
                if (error) throw error;
                setInvoiceData(data || []);
                toast.success('Invoice Ledger Synchronized', { id: fetchToast });
            }
        } catch (error) {
            toast.error('Fiscal Data Retrieval Failure', { id: fetchToast });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportToast = toast.loading('Synthesizing Fiscal Export Manifest...');
        try {
            const data = activeTab === 'payroll' ? payrollData : invoiceData;
            if (!data.length) {
                toast.error('Null Ledger detected. Export aborted.');
                return;
            }

            const headers = activeTab === 'payroll'
                ? ['Staff Name', 'Visits', 'Hours', 'Total Pay (£)']
                : ['Client Name', 'Visits', 'Hours', 'Total Charge (£)'];

            const rows = data.map((item: any) => [
                `"${item.first_name} ${item.last_name}"`,
                item.total_visits,
                item.total_hours,
                activeTab === 'payroll' ? item.total_pay : item.total_charge
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeTab.toUpperCase()}_LEDGER_${startDate}_TO_${endDate}.csv`;
            a.click();
            toast.success('Export Manifest Ready', { id: exportToast });
        } catch (err) {
            toast.error('Export Synthesis Failure', { id: exportToast });
        }
    };

    const totalAmount = (activeTab === 'payroll' ? payrollData : invoiceData)
        .reduce((sum, item: any) => sum + (activeTab === 'payroll' ? item.total_pay : item.total_charge), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="space-y-4">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Fiscal <span className="text-emerald-600">Ledger</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                        Payroll Projections • Revenue Analytics • Financial Intelligence Hub
                    </p>
                </div>

                <div className="flex items-center gap-6 bg-white p-3 rounded-[2.5rem] border-4 border-slate-50 shadow-2xl transition-all hover:border-emerald-500/20">
                    <div className="flex items-center gap-4 px-6">
                        <Calendar size={18} className="text-slate-300" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                toast.info('Updating Temporal Start Node');
                            }}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widestAlpha focus:ring-0 text-slate-900 appearance-none outline-none"
                        />
                    </div>
                    <ArrowRight size={20} className="text-slate-200" />
                    <div className="flex items-center gap-4 px-6">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                toast.info('Updating Temporal End Node');
                            }}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widestAlpha focus:ring-0 text-slate-900 appearance-none outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-slate-900 p-12 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className={`p-6 rounded-[2rem] shadow-2xl transition-transform group-hover:rotate-6 ${activeTab === 'payroll' ? 'bg-blue-900 text-blue-400 border border-blue-500/30' : 'bg-emerald-900 text-emerald-400 border border-emerald-500/30'}`}>
                            <TrendingUp size={36} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 leading-none">
                                Total {activeTab === 'payroll' ? 'Payroll Flux' : 'Revenue Flux'}
                            </p>
                            <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
                                £{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-8">
                        <Zap className="text-white/5" size={120} />
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end items-center gap-6">
                    <button
                        onClick={handleExport}
                        disabled={loading || (activeTab === 'payroll' ? !payrollData.length : !invoiceData.length)}
                        className="px-12 py-6 bg-white border-4 border-slate-50 text-slate-400 hover:text-slate-900 hover:border-slate-200 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-xl transition-all active:scale-95 flex items-center gap-6 disabled:opacity-20"
                    >
                        <Download size={20} className="text-primary-500" /> Export Manifest
                    </button>
                    <button
                        onClick={() => toast.success('Global Financial Report Authorized')}
                        className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-6 border-b-8 border-emerald-600"
                    >
                        Authorize Report
                    </button>
                </div>
            </div>

            <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
                <button
                    onClick={() => {
                        setActiveTab('payroll');
                        toast.info('Retrieving Staff Payroll Spectrum');
                    }}
                    className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'payroll' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05] border-b-4 border-blue-500' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <Users size={20} /> Staff Payroll
                </button>
                <button
                    onClick={() => {
                        setActiveTab('invoices');
                        toast.info('Retrieving Client Invoice Spectrum');
                    }}
                    className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'invoices' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05] border-b-4 border-emerald-500' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <FileText size={20} /> Client Invoices
                </button>
            </div>

            <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-1000 min-h-[550px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-10 grayscale opacity-10 p-40">
                        <Cpu size={120} className="animate-spin" />
                        <p className="font-black uppercase tracking-[0.8em] text-[18px]">Computing Financials...</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-50">
                                    <tr>
                                        <th className="px-12 py-10">{activeTab === 'payroll' ? 'Unit Operator Entity' : 'Service Recipient Entity'}</th>
                                        <th className="px-10 py-10 text-right">Archived Visits</th>
                                        <th className="px-10 py-10 text-right">Total Epochs</th>
                                        <th className="px-12 py-10 text-right">
                                            {activeTab === 'payroll' ? 'Est. Pay Flux (£)' : 'Est. Charge Flux (£)'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(activeTab === 'payroll' ? payrollData : invoiceData).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-40 text-center text-slate-900 grayscale opacity-10 flex flex-col items-center gap-10">
                                                <History size={120} />
                                                <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Fiscal Matrix found for this interval</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        (activeTab === 'payroll' ? payrollData : invoiceData).map((item: any, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-12 py-10">
                                                    <div className="font-black text-xl text-slate-900 uppercase tracking-tighter leading-none group-hover:text-primary-600 transition-colors">
                                                        {item.first_name} {item.last_name}
                                                    </div>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widestAlpha mt-2">Authenticated Entity Node</p>
                                                </td>
                                                <td className="px-10 py-10 text-right">
                                                    <span className="text-[11px] font-black text-slate-400 tabular-nums bg-slate-100 px-6 py-2 rounded-xl shadow-inner border border-slate-200">{item.total_visits}</span>
                                                </td>
                                                <td className="px-10 py-10 text-right">
                                                    <span className="text-[11px] font-black text-slate-900 tabular-nums">{item.total_hours} Epochs</span>
                                                </td>
                                                <td className="px-12 py-10 text-right">
                                                    <div className={`text-2xl font-black tabular-nums tracking-tighter ${activeTab === 'payroll' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                        £{(activeTab === 'payroll' ? item.total_pay : item.total_charge).toFixed(2)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {(activeTab === 'payroll' ? payrollData : invoiceData).length > 0 && (
                            <div className="bg-slate-900 p-12 mt-auto border-t border-white/5 relative overflow-hidden group/total">
                                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                                <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white shadow-2xl transition-transform group-hover/total:rotate-6">
                                            <Target size={24} />
                                        </div>
                                        <h4 className="font-black text-white text-2xl uppercase tracking-tighter leading-none">Global Aggregate</h4>
                                    </div>
                                    <div className="flex gap-16">
                                        <div className="text-right space-y-2">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha">Missions</p>
                                            <p className="text-xl font-black text-white tabular-nums leading-none">
                                                {(activeTab === 'payroll' ? payrollData : invoiceData).reduce((sum, i: any) => sum + parseInt(i.total_visits), 0)}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha">Epochs</p>
                                            <p className="text-xl font-black text-white tabular-nums leading-none">
                                                {(activeTab === 'payroll' ? payrollData : invoiceData).reduce((sum, i: any) => sum + parseFloat(i.total_hours), 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[9px] font-black text-primary-500 uppercase tracking-widestAlpha">Aggregate Flux</p>
                                            <p className="text-3xl font-black text-white tabular-nums leading-none tracking-tighter">
                                                £{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-emerald-900/5 p-12 rounded-[4rem] border border-emerald-500/10 flex items-start gap-10 shadow-inner group">
                <div className="p-6 bg-white rounded-[2rem] text-emerald-600 shadow-2xl transition-transform group-hover:rotate-12">
                    <History size={32} />
                </div>
                <div className="space-y-4">
                    <h4 className="font-black text-2xl text-slate-900 uppercase tracking-tighter leading-none">Fiscal Continuity Matrix</h4>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed max-w-4xl opacity-80">
                        Projections are synthesized using real-time clinical telemetry and unit operational logs. Ensure all mission completion timestamps are synchronized for mission-critical invoicing and payroll accuracy.
                    </p>
                </div>
            </div>
        </div>
    );
}
