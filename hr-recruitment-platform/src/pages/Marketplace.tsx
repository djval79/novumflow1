import React, { useState } from 'react';
import {
    ShoppingBag,
    Search,
    Filter,
    Zap,
    Shield,
    Plus,
    ArrowRight,
    CheckCircle2,
    ExternalLink,
    Store
} from 'lucide-react';
import { toast } from 'sonner';

const APPS = [
    {
        id: 'careflow',
        name: 'CareFlow AI',
        description: 'Advanced clinical care management and AI documentation.',
        category: 'Clinical',
        status: 'installed',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CF&backgroundColor=4f46e5'
    },
    {
        id: 'stripe',
        name: 'Stripe',
        description: 'Handle enterprise billing, subscriptions, and payroll payments.',
        category: 'Payments',
        status: 'pending',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ST&backgroundColor=6366f1'
    },
    {
        id: 'resend',
        name: 'Resend',
        description: 'Professional email delivery for staff notifications.',
        category: 'Communication',
        status: 'installed',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RE&backgroundColor=000000'
    },
    {
        id: 'zapier',
        name: 'Zapier',
        description: 'Connect NovumFlow to 6,000+ apps and automate workflows.',
        category: 'Automation',
        status: 'available',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ZP&backgroundColor=ff4f00'
    }
];

const Marketplace: React.FC = () => {
    const [filter, setFilter] = useState('All');

    const handleInstall = (name: string) => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: `Configuring ${name} integration...`,
                success: `${name} has been connected to your tenant.`,
                error: 'Configuration failed.'
            }
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Store className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Integrations Ecosystem</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Partner Marketplace</h1>
                    <p className="text-slate-500 mt-2 text-lg">Extend NovumFlow with industry-leading tools and custom integrations.</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    {['All', 'Clinical', 'Payments', 'Automation'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Featured App */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-900 rounded-[2.5rem] p-12 relative overflow-hidden text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Featured Integration</span>
                    <h2 className="text-5xl font-black mt-4 tracking-tighter">Unified Compliance with CareFlow</h2>
                    <p className="text-indigo-100 mt-4 text-xl leading-relaxed">
                        The ultimate synergy for care providers. Seamlessly sync HR compliance records with clinical care documentation in real-time.
                    </p>
                    <div className="flex gap-4 mt-10">
                        <button className="px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl">
                            Configure Sync
                        </button>
                        <button className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20">
                            Learn More
                        </button>
                    </div>
                </div>
                {/* Visual abstract blobs */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500/10 -skew-x-12 translate-x-20"></div>
                <div className="absolute bottom-0 right-0 p-12 opacity-20">
                    <Shield className="w-64 h-64" />
                </div>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {APPS.filter(a => filter === 'All' || a.category === filter).map((app) => (
                    <div key={app.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <img src={app.logo} alt={app.name} className="w-16 h-16 rounded-2xl shadow-sm" />
                            {app.status === 'installed' ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                </div>
                            ) : app.status === 'pending' ? (
                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <Zap className="w-3.5 h-3.5" /> Pending
                                </div>
                            ) : null}
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{app.name}</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{app.category}</p>
                        <p className="text-slate-500 mt-4 text-sm leading-relaxed flex-1">
                            {app.description}
                        </p>

                        <div className="mt-8 pt-8 border-t border-slate-50">
                            {app.status === 'available' ? (
                                <button
                                    onClick={() => handleInstall(app.name)}
                                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    Connect App <Plus className="w-5 h-5" />
                                </button>
                            ) : (
                                <button className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:border-slate-200 transition-all flex items-center justify-center gap-2">
                                    Manage Integration <ExternalLink className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Developer Card */}
                <div className="bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer hover:border-indigo-400 hover:bg-white transition-all">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Build Custom</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-[200px]">
                            Connect your own internal tools using our Developer API.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/docs'}
                        className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:text-indigo-700 flex items-center gap-2"
                    >
                        View Docs <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Marketplace;
