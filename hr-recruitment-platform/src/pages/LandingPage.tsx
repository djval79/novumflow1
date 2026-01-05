import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    CheckCircle,
    Users,
    Smartphone,
    LayoutDashboard,
    ArrowRight,
    Menu,
    X,
    Clock,
    FileText,
    BrainCircuit,
    AlertTriangle,
    Star,
    Activity,
    Lock,
    Stethoscope,
    Briefcase,
    CalendarCheck,
    PoundSterling,
    ClipboardCheck
} from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Simple state to simulate "live" dashboard updates
    const [liveCount, setLiveCount] = useState(98);
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveCount(prev => prev === 98 ? 99 : 98);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const [activeTab, setActiveTab] = useState<'compliance' | 'recruitment' | 'operations'>('compliance');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-cyan-200 selection:text-cyan-900">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/60 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="h-10 w-10 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
                                <Shield className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                NovumFlow
                            </span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#problems" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors">Why Us</a>
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors">Features</a>
                            <a href="#demo" className="text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors">Live Preview</a>
                            <Link
                                to="/login"
                                className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-slate-700"
                            >
                                Login
                            </Link>
                        </div>

                        <div className="md:hidden">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-2xl animate-accordion-down">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#problems" className="block px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Why NovumFlow</a>
                            <a href="#features" className="block px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Features</a>
                            <Link to="/login" className="block w-full text-center mt-4 px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold shadow-lg" onClick={() => setMobileMenuOpen(false)}>
                                Login to Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
                    <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100/50 text-cyan-700 font-semibold text-xs uppercase tracking-wide mb-8 animate-fade-in-up backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Operational • v2.4 Live
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                        The Operating System for <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-700">
                            Regulated Workforces
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600 mb-12 leading-relaxed">
                        Automate your CQC compliance, streamline recruitment, and manage rosters in one unified platform. Built for Healthcare, Security, and Education.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button className="px-8 py-4 rounded-full bg-cyan-600 text-white font-bold text-lg shadow-xl hover:bg-cyan-700 hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            Book a Demo <ArrowRight className="w-5 h-5" />
                        </button>
                        <a href="#demo" className="px-8 py-4 rounded-full bg-white text-slate-900 border border-slate-200 font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-gray-400" />
                            View Live Dashboard
                        </a>
                    </div>

                    {/* Interactive Dashboard Preview */}
                    <div id="demo" className="mt-20 relative mx-auto max-w-6xl group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                        <div className="relative rounded-2xl bg-slate-900 p-1 shadow-2xl ring-1 ring-slate-900/10">
                            {/* Browser Header */}
                            <div className="bg-slate-800 rounded-t-xl px-4 py-3 flex items-center gap-4 border-b border-slate-700">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="flex-1 bg-slate-900/50 rounded-md h-8 flex items-center px-4 text-xs text-slate-500 font-mono">
                                    <Lock className="w-3 h-3 mr-2 text-green-500" />
                                    https://app.novumflow.com/dashboard/compliance
                                </div>
                            </div>

                            {/* Dashboard Content Area */}
                            <div className="bg-slate-900 rounded-b-xl overflow-hidden aspect-[16/9] md:aspect-[21/9] relative grid grid-cols-12 text-slate-300">
                                {/* Sidebar */}
                                <div className="col-span-2 bg-slate-950 border-r border-slate-800 p-4 hidden md:flex flex-col gap-2">
                                    <div className="h-8 w-8 bg-cyan-600 rounded-lg mb-6 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'compliance' ? 'bg-cyan-900/30 text-cyan-400' : 'hover:bg-slate-900'}`} onClick={() => setActiveTab('compliance')}>
                                        <Shield className="w-4 h-4" />
                                        <span className="text-sm font-medium">Compliance</span>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'recruitment' ? 'bg-cyan-900/30 text-cyan-400' : 'hover:bg-slate-900'}`} onClick={() => setActiveTab('recruitment')}>
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-medium">Recruitment</span>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'operations' ? 'bg-cyan-900/30 text-cyan-400' : 'hover:bg-slate-900'}`} onClick={() => setActiveTab('operations')}>
                                        <Activity className="w-4 h-4" />
                                        <span className="text-sm font-medium">Operations</span>
                                    </div>
                                </div>

                                {/* Main Panel */}
                                <div className="col-span-12 md:col-span-10 bg-slate-900 p-6 md:p-8 overflow-y-auto">
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">
                                                {activeTab === 'compliance' && 'Compliance Overview'}
                                                {activeTab === 'recruitment' && 'Recruitment Pipeline'}
                                                {activeTab === 'operations' && 'Live Operations Center'}
                                            </h3>
                                            <p className="text-sm text-slate-500">Last updated: Just now</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                System Healthy
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tab Content: Compliance */}
                                    {activeTab === 'compliance' && (
                                        <div className="grid grid-cols-3 gap-6 animate-fade-in-up">
                                            <div className="col-span-3 md:col-span-2 grid grid-cols-2 gap-4">
                                                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                                                    <div className="text-slate-400 text-sm font-medium mb-2">Overall Compliance</div>
                                                    <div className="text-4xl font-bold text-white flex items-end gap-2">
                                                        {liveCount}% <span className="text-sm text-green-500 font-medium mb-1 flex items-center">
                                                            <ArrowRight className="w-3 h-3 rotate-[-45deg]" /> +2.4%
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-cyan-500 to-green-500 w-[98%] transition-all duration-1000"></div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-24 h-24 text-red-500" /></div>
                                                    <div className="text-slate-400 text-sm font-medium mb-2">Critical Actions</div>
                                                    <div className="text-4xl font-bold text-white">0</div>
                                                    <p className="text-xs text-slate-500 mt-2">No expired documents found.</p>
                                                </div>
                                            </div>
                                            <div className="col-span-3 md:col-span-1 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-500" /> Expiring Soon (30 Days)</h4>
                                                <div className="space-y-4">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">JD</div>
                                                            <div className="flex-1">
                                                                <div className="text-xs font-bold text-slate-200">John Doe</div>
                                                                <div className="text-[10px] text-yellow-500">DBS Check - {i * 5} days</div>
                                                            </div>
                                                            <button className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600">Renew</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab Content: Recruitment */}
                                    {activeTab === 'recruitment' && (
                                        <div className="grid grid-cols-2 gap-6 animate-fade-in-up">
                                            <div className="col-span-2 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                                                <div className="flex justify-between mb-4">
                                                    <h4 className="text-sm font-bold text-white">Live Candidate Pipeline</h4>
                                                    <div className="text-xs text-cyan-400">AI Scoring Active</div>
                                                </div>
                                                <div className="space-y-3">
                                                    {[
                                                        { name: "Sarah Miller", role: "Senior Nurse", score: 98, status: "Interview Ready" },
                                                        { name: "James Wilson", role: "Care Assistant", score: 92, status: "Screening" },
                                                        { name: "Emily Davis", role: "Support Worker", score: 85, status: "Review" }
                                                    ].map((c, i) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-900 to-blue-900 flex items-center justify-center text-xs text-cyan-200 font-bold border border-cyan-800">
                                                                    {c.score}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">{c.name}</div>
                                                                    <div className="text-xs text-slate-400">{c.role}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">{c.status}</span>
                                                                <button className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors">View Profile</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab Content: Operations */}
                                    {activeTab === 'operations' && (
                                        <div className="grid grid-cols-2 gap-6 animate-fade-in-up">
                                            <div className="col-span-1 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                                                <h4 className="text-sm font-bold text-white mb-2">Live Staff Map (Simulated)</h4>
                                                <div className="h-48 bg-slate-900/80 rounded-lg border border-slate-700/50 flex items-center justify-center relative">
                                                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                                                    <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs text-slate-500">Geolocation Tracking Active</span>
                                                </div>
                                            </div>
                                            <div className="col-span-1 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                                                <h4 className="text-sm font-bold text-white mb-4">Shift Coverage</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-slate-300">Morning Shift</span>
                                                            <span className="text-green-400">100% Covered</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="w-full h-full bg-green-500"></div></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-slate-300">Afternoon Shift</span>
                                                            <span className="text-yellow-400">85% Covered</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="w-[85%] h-full bg-yellow-500"></div></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-slate-300">Night Shift</span>
                                                            <span className="text-red-400">Needs Attention</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="w-[45%] h-full bg-red-500"></div></div>
                                                    </div>
                                                </div>
                                                <button className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded-lg transition-colors">
                                                    Find Cover
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section (Enhanced) */}
            <section id="problems" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-bold text-red-600 tracking-wide uppercase">The Cost of Manual HR</h2>
                        <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Why Regulated Industries Are Failing at Compliance
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100 hover:shadow-lg transition-all">
                            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Inspection Failure</h3>
                            <p className="text-sm text-gray-600">
                                One missing document during a CQC/Ofsted audit can downgrade your rating overnight.
                            </p>
                        </div>
                        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 hover:shadow-lg transition-all">
                            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                <Briefcase className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Ghost Shifts</h3>
                            <p className="text-sm text-gray-600">
                                Paying for shifts that never happened because your paper timesheets are unverified?
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Admin Overload</h3>
                            <p className="text-sm text-gray-600">
                                Recruiters spending 15+ hours/week chasing references and expiration dates manually.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                            <div className="h-10 w-10 bg-slate-200 rounded-lg flex items-center justify-center mb-4">
                                <PoundSterling className="w-6 h-6 text-slate-700" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Legal Risk</h3>
                            <p className="text-sm text-gray-600">
                                Employing staff without valid Right to Work (RTW) checks can lead to £45k+ fines.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid (Expanded) */}
            <section id="features" className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-base font-semibold text-cyan-400 tracking-wide uppercase">Core Features</h2>
                        <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                            More Than Just a Database
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="text-cyan-400" />}
                            title="Automated Compliance"
                            desc="Daily background scans for expired visas, DBS checks, and training certificates. Alerts managers instantly."
                        />
                        <FeatureCard
                            icon={<BrainCircuit className="text-purple-400" />}
                            title="AI Recruitment Pipeline"
                            desc="Smart algorithms rank candidates by relevance. Auto-disqualifies applicants without key certifications."
                        />
                        <FeatureCard
                            icon={<Smartphone className="text-green-400" />}
                            title="Staff Mobile App (PWA)"
                            desc="Employees verify visits via GPS, request leave, and upload docs directly from their phone."
                        />
                        <FeatureCard
                            icon={<CalendarCheck className="text-orange-400" />}
                            title="Smart Rostering"
                            desc="Drag-and-drop shift planning with conflict detection. Prevents booking non-compliant staff."
                        />
                        <FeatureCard
                            icon={<ClipboardCheck className="text-blue-400" />}
                            title="CQC Inspection Vault"
                            desc="One-click 'Inspector Mode' generates a read-only, organized view of all compliance evidence."
                        />
                        <FeatureCard
                            icon={<Stethoscope className="text-red-400" />}
                            title="Care Management (eMAR)"
                            desc="Digital medication records and care notes. Real-time updates from the field to the office."
                        />
                    </div>
                </div>
            </section>

            {/* Testimonial Section */}
            <section className="py-24 bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex justify-center gap-1 mb-8">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <blockquote className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-10">
                        "We used to dread CQC inspections. With NovumFlow, our last audit took 20 minutes because everything was already there."
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">SJ</div>
                        <div className="text-left">
                            <div className="font-bold text-slate-900">Sarah Jenkins</div>
                            <div className="text-slate-500 text-sm">Director, CareFirst Solutions</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-24 relative overflow-hidden bg-slate-50">
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Stop Risking Your License.</h2>
                    <p className="text-slate-600 text-xl mb-12 max-w-2xl mx-auto">
                        Get the peace of mind that comes with 100% automated compliance.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button className="px-10 py-5 rounded-full bg-cyan-600 text-white font-bold text-lg shadow-xl hover:bg-cyan-500 transition-all hover:scale-105">
                            Start Free Trial
                        </button>
                    </div>
                    <p className="mt-8 text-sm text-slate-500">
                        Full access for 14 days • No credit card required • Cancel anytime
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white text-slate-500 py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-cyan-600" />
                        <span className="text-lg font-bold text-slate-900">NovumFlow</span>
                    </div>
                    <div className="text-sm">
                        &copy; {new Date().getFullYear()} NovumSolvo Ltd. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-sm">
                        <Link to="/privacy" className="hover:text-cyan-600">Privacy</Link>
                        <Link to="/terms" className="hover:text-cyan-600">Terms</Link>
                        <Link to="/support" className="hover:text-cyan-600">Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all group">
            <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6 border border-slate-700 group-hover:scale-110 transition-transform">
                {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${(icon as React.ReactElement).props.className}` })}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">
                {desc}
            </p>
        </div>
    );
}
