import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, Loader2 } from 'lucide-react';

export default function Onboarding() {
    const { createTenant } = useTenant();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const subdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        try {
            const tenant = await createTenant(name, subdomain);
            if (tenant) {
                // Force reload to ensure context is updated
                window.location.href = '/';
            } else {
                alert('Failed to create organization. Name might be taken.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Create your Organization</h1>
                    <p className="text-slate-500 mt-2">Let's get your CareFlow workspace set up.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Acme Care Services"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !name}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Create Organization <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
