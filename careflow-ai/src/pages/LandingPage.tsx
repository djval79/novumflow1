import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    Zap,
    ClipboardCheck,
    Smartphone,
    Clock,
    BarChart3,
    ArrowRight,
    LayoutDashboard,
    UserCheck,
    Stethoscope,
    FileText,
    Star,
    CheckCircle
} from 'lucide-react';
import DemoRequestModal from '../components/DemoRequestModal';

const LandingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'rostering' | 'emar' | 'compliance'>('rostering');
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            {/* Header / Nav */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Zap className="text-white w-6 h-6 fill-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">CareFlow <span className="text-indigo-400">AI</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
                        <a href="#demo" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Live Demo</a>
                        <Link to="/login" className="px-6 py-2 rounded-full bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition-all shadow-xl">
                            Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] z-0 pointer-events-none">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10 pt-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-8">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        2026 AI ROSTERING ENGINE ACTIVE
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                        The Brain Behind <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Modern Care Delivery
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Intelligent rostering, real-time eMAR, and GPS-verified visits.
                        Reduce overtime by 22% and eliminate compliance gaps automatically.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => setIsDemoModalOpen(true)}
                            className="px-10 py-5 rounded-full bg-indigo-600 text-white font-extra-bold text-lg shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 transition-all transform flex items-center justify-center gap-3"
                        >
                            Book a Demo <ArrowRight className="w-6 h-6" />
                        </button>
                        <Link to="/login" className="px-10 py-5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-3">
                            <LayoutDashboard className="w-6 h-6 text-indigo-400" /> View Live Dashboard
                        </Link>
                    </div>

                    <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-60">
                        <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> CQC Audit Ready</div>
                        <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> SEIS/EIS Approved</div>
                        <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> UK Data Ethics Certified</div>
                    </div>
                </div>
            </section>

            {/* Live Dashboard Preview */}
            <section id="demo" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 perspective-1000 group">
                        {/* Browser Header */}
                        <div className="bg-slate-800 px-6 py-4 flex items-center gap-4 border-b border-white/5">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                            </div>
                            <div className="flex-1 bg-slate-950/50 rounded-lg h-10 flex items-center px-4 text-xs font-mono text-slate-500">
                                <Shield className="w-3 h-3 text-indigo-500 mr-2" /> https://careflow.ai/dashboard/mission-control
                            </div>
                        </div>

                        {/* Dashboard Mockup Content */}
                        <div className="grid grid-cols-12 min-h-[500px]">
                            {/* Sidebar Mockup */}
                            <div className="col-span-2 bg-slate-950 border-r border-white/5 p-6 hidden md:block">
                                <div className="space-y-6">
                                    <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>
                                    <div className="space-y-3">
                                        <div className={`h-10 w-full rounded-xl flex items-center gap-3 px-3 cursor-pointer transition-all ${activeTab === 'rostering' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'}`} onClick={() => setActiveTab('rostering')}>
                                            <Clock className={`w-4 h-4 ${activeTab === 'rostering' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                        </div>
                                        <div className={`h-10 w-full rounded-xl flex items-center gap-3 px-3 cursor-pointer transition-all ${activeTab === 'emar' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'}`} onClick={() => setActiveTab('emar')}>
                                            <Stethoscope className={`w-4 h-4 ${activeTab === 'emar' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                        </div>
                                        <div className={`h-10 w-full rounded-xl flex items-center gap-3 px-3 cursor-pointer transition-all ${activeTab === 'compliance' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'}`} onClick={() => setActiveTab('compliance')}>
                                            <Shield className={`w-4 h-4 ${activeTab === 'compliance' ? 'text-indigo-400' : 'text-slate-500'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Mockup */}
                            <div className="col-span-12 md:col-span-10 p-8 space-y-8 bg-slate-900/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold">
                                            {activeTab === 'rostering' && 'Smart Rostering Hub'}
                                            {activeTab === 'emar' && 'Live eMAR Monitor'}
                                            {activeTab === 'compliance' && 'Compliance Shield™'}
                                        </h3>
                                        <p className="text-sm text-slate-500">Real-time data from 42 field staff</p>
                                    </div>
                                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-2">
                                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span> Live
                                    </div>
                                </div>

                                {activeTab === 'rostering' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-white/5 shadow-inner">
                                            <div className="text-slate-400 text-sm mb-2">Coverage</div>
                                            <div className="text-4xl font-black">98.4%</div>
                                            <div className="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-[98%]"></div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-white/5">
                                            <div className="text-slate-400 text-sm mb-2">Overtime Saved</div>
                                            <div className="text-4xl font-black text-emerald-400">£1,420</div>
                                            <div className="text-xs text-slate-500 mt-2">Previous 7 days</div>
                                        </div>
                                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-white/5 overflow-hidden relative">
                                            <BarChart3 className="absolute bottom-0 right-0 w-24 h-24 text-indigo-500/10 -mb-4 -mr-4" />
                                            <div className="text-slate-400 text-sm mb-2">Shift Market</div>
                                            <div className="text-4xl font-black">12</div>
                                            <div className="text-xs text-indigo-400 mt-2 font-bold cursor-pointer">View Open Shifts →</div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'emar' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        {[
                                            { patient: "Mrs. Thompson", time: "09:00", med: "Aspirin 75mg", status: "Administered", tech: "GPS Verified" },
                                            { patient: "Mr. Roberts", time: "09:15", med: "Warfarin 3mg", status: "Administered", tech: "QR Verified" },
                                            { patient: "Mrs. Smith", time: "09:30", med: "Lisinopril 10mg", status: "Due", tech: "Pending" }
                                        ].map((item, i) => (
                                            <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-slate-800 transition-all">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-10 w-10 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-lg font-bold">
                                                        {item.time}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{item.patient}</div>
                                                        <div className="text-xs text-slate-500">{item.med}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className={`text-xs px-3 py-1 rounded-full border ${item.status === 'Administered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                        {item.status}
                                                    </div>
                                                    <div className="text-[10px] text-slate-600 font-mono hidden md:block">{item.tech}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'compliance' && (
                                    <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-indigo-500/5 p-8 rounded-3xl border border-indigo-500/10 text-center">
                                            <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                                            <h4 className="text-xl font-bold mb-2">Automated Block</h4>
                                            <p className="text-sm text-slate-500">Non-compliant staff are automatically blocked from starting shifts.</p>
                                        </div>
                                        <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/10 text-center">
                                            <UserCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                            <h4 className="text-xl font-bold mb-2">Digital Piling</h4>
                                            <p className="text-sm text-slate-500">One-click export for CQC/Local Authority auditors.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Points / Market Context */}
            <section className="py-24 px-6 bg-slate-900 border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-4">The Market Problem</h2>
                        <h2 className="text-3xl md:text-5xl font-bold">Legacy Systems are Failing Care</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <Clock className="w-10 h-10 text-rose-500" />
                            <h3 className="text-xl font-bold">Fragmented Shifts</h3>
                            <p className="text-slate-400">Managers spend 70% of their time on phone calls and spreadsheets trying to fill gaps.</p>
                        </div>
                        <div className="space-y-4">
                            <FileText className="w-10 h-10 text-rose-500" />
                            <h3 className="text-xl font-bold">Paper Fatigue</h3>
                            <p className="text-slate-400">Missing medication notes and unverified visits lead to 'Inadequate' CQC ratings.</p>
                        </div>
                        <div className="space-y-4">
                            <Zap className="w-10 h-20 text-rose-500 rotate-180 opacity-20 absolute -z-10" />
                            <Smartphone className="w-10 h-10 text-rose-500" />
                            <h3 className="text-xl font-bold">Disconnected Staff</h3>
                            <p className="text-slate-400">Field staff lack real-time access to care plans and risk assessments.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Detail */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 hover:border-indigo-500/50 transition-all group">
                        <Zap className="w-8 h-8 text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
                        <h4 className="text-2xl font-bold mb-4">AI Rostering</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">Our engine predicts staffing needs and auto-matches staff based on compliance, skills, and proximity.</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 hover:border-purple-500/50 transition-all group">
                        <Stethoscope className="w-8 h-8 text-purple-400 mb-6 group-hover:scale-110 transition-transform" />
                        <h4 className="text-2xl font-bold mb-4">eMAR Suite</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">Full electronic medication records with barcode verification and refusal tracking for zero-error delivery.</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 hover:border-pink-500/50 transition-all group">
                        <Smartphone className="w-8 h-8 text-pink-400 mb-6 group-hover:scale-110 transition-transform" />
                        <h4 className="text-2xl font-bold mb-4">Visit Verification</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">GPS check-ins and check-outs provide irrefutable proof of care, cutting claim disputes by 30%.</p>
                    </div>
                </div>
            </section>

            {/* Testimonial & Social Proof */}
            <section className="py-24 px-6 bg-slate-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="grid grid-cols-12 gap-4 h-full"> {[...Array(12)].map((_, i) => <div key={i} className="border-r border-white/5" />)} </div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="flex justify-center gap-1 mb-10">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-8 h-8 fill-indigo-400 text-indigo-400" />)}
                    </div>
                    <blockquote className="text-3xl md:text-5xl font-bold leading-tight mb-12">
                        "CareFlow AI transformed our Agency. We went from manual rosters to a fully automated mission control in just 48 hours."
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xl">LM</div>
                        <div className="text-left">
                            <div className="font-bold text-xl leading-none">Liam Murray</div>
                            <div className="text-slate-500 text-sm">Managing Director, Murray Care Group</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA / Downloads */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-12 text-center shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-8 italic">Ready to Lead?</h2>
                        <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto">
                            Join the elite care providers who are using AI to protect their patients and their profits.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button
                                onClick={() => setIsDemoModalOpen(true)}
                                className="px-10 py-5 bg-white text-indigo-600 font-extra-bold text-lg rounded-full hover:bg-slate-100 transition-all shadow-xl"
                            >
                                Request Enterprise Demo
                            </button>
                            <a
                                href="/marketing/compliance-checklist.html"
                                target="_blank"
                                className="px-10 py-5 bg-indigo-500 text-white border border-white/20 font-bold text-lg rounded-full hover:bg-indigo-400 transition-all flex items-center justify-center gap-3"
                            >
                                <FileText className="w-6 h-6" /> Download Compliance Checklist
                            </a>
                        </div>
                        <div className="mt-8">
                            <a
                                href="/marketing/one-pager.html"
                                target="_blank"
                                className="text-sm font-bold text-white/60 hover:text-white transition-all underline decoration-white/20 underline-offset-4"
                            >
                                View Product One-Pager (PDF Brief)
                            </a>
                        </div>
                    </div>
                    {/* Decorative Blurs */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32 filter blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full -mr-32 -mb-32 filter blur-3xl"></div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 opacity-40 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                        <span className="font-bold">CareFlow AI Suite</span>
                    </div>
                    <div>&copy; 2026 NovumSolvo Ltd. All rights reserved.</div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Legal</a>
                    </div>
                </div>
            </footer>

            <DemoRequestModal
                isOpen={isDemoModalOpen}
                onClose={() => setIsDemoModalOpen(false)}
                productInterest="careflow"
            />
        </div>
    );
};

export default LandingPage;
