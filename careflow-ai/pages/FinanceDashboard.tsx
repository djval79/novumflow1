
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import {
    DollarSign, Calendar, Download, Users, FileText,
    TrendingUp, ArrowRight, Loader2, Briefcase
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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

    // Date Range State
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    // Data State
    const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
    const [invoiceData, setInvoiceData] = useState<InvoiceItem[]>([]);

    useEffect(() => {
        if (currentTenant) {
            fetchData();
        }
    }, [currentTenant, activeTab, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'payroll') {
                const { data, error } = await supabase.rpc('get_payroll_report', {
                    p_tenant_id: currentTenant!.id,
                    p_start_date: startDate,
                    p_end_date: endDate
                });
                if (error) throw error;
                setPayrollData(data || []);
            } else {
                const { data, error } = await supabase.rpc('get_invoice_report', {
                    p_tenant_id: currentTenant!.id,
                    p_start_date: startDate,
                    p_end_date: endDate
                });
                if (error) throw error;
                setInvoiceData(data || []);
            }
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const data = activeTab === 'payroll' ? payrollData : invoiceData;
        if (!data.length) return;

        const headers = activeTab === 'payroll'
            ? ['Staff Name', 'Visits', 'Hours', 'Total Pay (£)']
            : ['Client Name', 'Visits', 'Hours', 'Total Charge (£)'];

        const rows = data.map((item: any) => [
            `${item.first_name} ${item.last_name}`,
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
        a.download = `${activeTab}_report_${startDate}_to_${endDate}.csv`;
        a.click();
    };

    const totalAmount = (activeTab === 'payroll' ? payrollData : invoiceData)
        .reduce((sum, item: any) => sum + (activeTab === 'payroll' ? item.total_pay : item.total_charge), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <DollarSign className="text-emerald-600" />
                        Finance & Reporting
                    </h1>
                    <p className="text-slate-500">Track estimated payroll and generate client invoices.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-none text-sm focus:ring-0 text-slate-600 font-medium"
                    />
                    <ArrowRight size={16} className="text-slate-400" />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-none text-sm focus:ring-0 text-slate-600 font-medium"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${activeTab === 'payroll' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">
                                Total {activeTab === 'payroll' ? 'Payroll' : 'Revenue'}
                            </p>
                            <h3 className="text-2xl font-bold text-slate-900">
                                £{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="md:col-span-2 flex justify-end items-center gap-4">
                    <button
                        onClick={handleExport}
                        disabled={loading || (activeTab === 'payroll' ? !payrollData.length : !invoiceData.length)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'payroll'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Users size={18} /> Staff Payroll
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'invoices'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <FileText size={18} /> Client Invoices
                    </button>
                </nav>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>Calculating financials...</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">{activeTab === 'payroll' ? 'Staff Member' : 'Client Name'}</th>
                                <th className="px-6 py-4 font-medium text-right">Completed Visits</th>
                                <th className="px-6 py-4 font-medium text-right">Total Hours</th>
                                <th className="px-6 py-4 font-medium text-right">
                                    {activeTab === 'payroll' ? 'Est. Pay (£)' : 'Est. Charge (£)'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(activeTab === 'payroll' ? payrollData : invoiceData).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        No completed visits found for this period.
                                    </td>
                                </tr>
                            ) : (
                                (activeTab === 'payroll' ? payrollData : invoiceData).map((item: any, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {item.first_name} {item.last_name}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {item.total_visits}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {item.total_hours} hrs
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${activeTab === 'payroll' ? 'text-blue-600' : 'text-emerald-600'
                                            }`}>
                                            £{(activeTab === 'payroll' ? item.total_pay : item.total_charge).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* Footer Totals */}
                        {(activeTab === 'payroll' ? payrollData : invoiceData).length > 0 && (
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                                <tr>
                                    <td className="px-6 py-4">Total</td>
                                    <td className="px-6 py-4 text-right">
                                        {(activeTab === 'payroll' ? payrollData : invoiceData).reduce((sum, i: any) => sum + parseInt(i.total_visits), 0)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(activeTab === 'payroll' ? payrollData : invoiceData).reduce((sum, i: any) => sum + parseFloat(i.total_hours), 0).toFixed(2)} hrs
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        £{totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                )}
            </div>
        </div>
    );
}
