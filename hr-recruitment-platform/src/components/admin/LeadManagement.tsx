import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { Mail, Building, Clock, CheckCircle, Trash2, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';

interface DemoRequest {
    id: string;
    created_at: string;
    email: string;
    full_name: string;
    company_name: string;
    product_interest: string;
    status: string;
    metadata: any;
}

export default function LeadManagement() {
    const [leads, setLeads] = useState<DemoRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('demo_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (err) {
            log.error('Error fetching leads', err, { component: 'LeadManagement' });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('demo_requests')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Status updated to ${newStatus}`);
            fetchLeads();
        } catch (err) {
            log.error('Error updating lead status', err, { component: 'LeadManagement' });
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading leads...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-cyan-50 border border-cyan-100 p-6 rounded-2xl">
                    <p className="text-cyan-600 text-sm font-bold uppercase tracking-widest mb-1">Total Leads</p>
                    <p className="text-3xl font-black text-cyan-900">{leads.length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                    <p className="text-emerald-600 text-sm font-bold uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-3xl font-black text-emerald-900">{leads.filter(l => l.status === 'pending').length}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                    <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest mb-1">Conversion Rate</p>
                    <p className="text-3xl font-black text-indigo-900">
                        {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'closed').length / leads.length) * 100) : 0}%
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{lead.full_name}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {lead.email}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Building className="w-3 h-3" /> {lead.company_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-tighter 
                                        ${lead.product_interest === 'careflow' ? 'bg-indigo-100 text-indigo-700' :
                                            lead.product_interest === 'novumflow' ? 'bg-cyan-100 text-cyan-700' :
                                                'bg-purple-100 text-purple-700'}`}>
                                        {lead.product_interest}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                                        {lead.metadata?.source || 'unknown'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={lead.status}
                                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                                        className="text-xs font-bold border-none bg-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 py-1 px-2"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="demo_scheduled">Demo Set</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateStatus(lead.id, 'closed')}
                                            className="p-2 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition-colors"
                                            title="Mark as Converted"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && (
                    <div className="p-12 text-center text-gray-500 italic">No demo requests yet.</div>
                )}
            </div>
        </div>
    );
}
