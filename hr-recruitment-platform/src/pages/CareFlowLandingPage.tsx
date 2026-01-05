import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Smartphone,
    CalendarCheck,
    HeartPulse,
    MapPin,
    ShieldCheck,
    Menu,
    X,
    ArrowRight,
    Star,
    LayoutDashboard,
    Clock,
    UserCheck,
    Pill,
    Activity,
    Users,
    Zap,
    Lock,
    CheckCircle
} from 'lucide-react';

export default function CareFlowLandingPage() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [visitsLogged, setVisitsLogged] = useState(142);
    useEffect(() => {
        const interval = setInterval(() => {
            setVisitsLogged(prev => prev + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const [activeTab, setActiveTab] = useState<'rostering' | 'emar' | 'live'>('live');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-purple-200 selection:text-purple-900">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/60 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 leading-tight">
                                    CareFlow
                                </span>
                                <span className="text-[10px] font-bold text-purple-600 tracking-wider uppercase">
                                    by NovumFlow
                                </span>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors">NovumFlow (HR)</Link>
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Features</a>
                            <a href="#demo" className="text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">Live Operations</a>
                            <Link
                                to="/login"
                                className="px-6 py-2.5 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                            <Link to="/" className="block px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Switch to NovumFlow (HR)</Link>
                            <a href="#features" className="block px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Features</a>
                            <Link to="/login" className="block w-full text-center mt-4 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg" onClick={() => setMobileMenuOpen(false)}>
                                Login
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
                    <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100/50 text-purple-700 font-semibold text-xs uppercase tracking-wide mb-8 animate-fade-in-up backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Next-Gen Care Management
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                        Delivery of Care, <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                            Perfectly Orchestrated.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600 mb-12 leading-relaxed">
                        The all-in-one app for Rostering, eMAR, and Visit Verification. Empower your carers to spend more time caring and less time on paperwork.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button className="px-8 py-4 rounded-full bg-purple-600 text-white font-bold text-lg shadow-xl hover:bg-purple-700 hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            Get Started <ArrowRight className="w-5 h-5" />
                        </button>
                        <a href="#demo" className="px-8 py-4 rounded-full bg-white text-slate-900 border border-slate-200 font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-gray-400" />
                            See It In Action
                        </a>
                    </div>

                    {/* Interactive Operations Center Preview */}
                    <div id="demo" className="mt-20 relative mx-auto max-w-6xl group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

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
                                    https://app.careflow.ai/ops-center
                                </div>
                            </div>

                            {/* Dashboard Content Area */}
                            <div className="bg-slate-900 rounded-b-xl overflow-hidden aspect-[16/9] md:aspect-[21/9] relative grid grid-cols-12 text-slate-300">
                                {/* Sidebar */}
                                <div className="col-span-2 bg-slate-950 border-r border-slate-800 p-4 hidden md:flex flex-col gap-2">
                                    <div className="h-8 w-8 bg-purple-600 rounded-lg mb-6 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-white" />
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'live' ? 'bg-purple-900/30 text-purple-400' : 'hover:bg-slate-900'}`} onClick={() => setActiveTab('live')}>
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Live Map</span>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'rostering' ? 'bg-purple-900/30 text-purple-400' : 'hover:bg-slate-900'}`} onClick={() => setActiveTab('rostering')}>
                                        <CalendarCheck className="w-4 h-4" />
                                        <span className="text-sm font-medium">Rostering</span>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'emar' ? 'bg-purple-900/30 text-purple-400' : 'hover:bg-slate-900'}`} onClick={() => setActiveTab('emar')}>
                                        <Pill className="w-4 h-4" />
                                        <span className="text-sm font-medium">eMAR</span>
                                    </div>
                                </div>

                                {/* Main Panel */}
                                <div className="col-span-12 md:col-span-10 bg-slate-900 p-6 md:p-8 overflow-y-auto">
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">
                                                {activeTab === 'live' && 'Operations Command Center'}
                                                {activeTab === 'rostering' && 'Intelligent Roster'}
                                                {activeTab === 'emar' && 'Medication Safety Dashboard'}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                                Live Updates Active
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-xs font-mono">
                                            <div className="bg-slate-800 px-3 py-2 rounded-md border border-slate-700">
                                                <span className="text-slate-400">Visits Today: </span>
                                                <span className="text-white font-bold">{visitsLogged} / 150</span>
                                            </div>
                                            <div className="bg-slate-800 px-3 py-2 rounded-md border border-slate-700">
                                                <span className="text-slate-400">Late Alerts: </span>
                                                <span className="text-red-400 font-bold">0</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tab: Live Map */}
                                    {activeTab === 'live' && (
                                        <div className="grid grid-cols-3 gap-6 animate-fade-in-up">
                                            <div className="col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 relative overflow-hidden h-[300px]">
                                                {/* Simulated Map */}
                                                <div className="absolute inset-0 bg-slate-900 opacity-50">
                                                    <div className="grid grid-cols-6 grid-rows-4 h-full w-full opacity-20">
                                                        {[...Array(24)].map((_, i) => <div key={i} className="border border-slate-700"></div>)}
                                                    </div>
                                                </div>
                                                {/* Pins */}
                                                <div className="absolute top-1/3 left-1/4">
                                                    <div className="relative">
                                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-ping absolute"></div>
                                                        <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-white relative z-10"></div>
                                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] px-2 py-1 rounded text-white whitespace-nowrap border border-slate-700">Sarah (On Visit)</div>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-1/3 right-1/3">
                                                    <div className="relative">
                                                        <div className="h-3 w-3 bg-purple-500 rounded-full border-2 border-white relative z-10"></div>
                                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] px-2 py-1 rounded text-white whitespace-nowrap border border-slate-700">James (Travelling)</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-1 space-y-4">
                                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Recent Check-ins</h4>
                                                    <div className="space-y-3">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">Img</div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-200">Visit Completed</div>
                                                                    <div className="text-[10px] text-green-400">Verified via GPS • 2m ago</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab: Rostering */}
                                    {activeTab === 'rostering' && (
                                        <div className="grid grid-cols-1 animate-fade-in-up">
                                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                        <div key={day} className="flex-1 min-w-[80px] text-center p-2 rounded bg-slate-900 border border-slate-700">
                                                            <div className="text-xs text-slate-500 mb-1">{day}</div>
                                                            <div className="h-20 w-full bg-purple-900/20 rounded border border-purple-500/20 dashed relative group hover:bg-purple-900/30 transition-colors">
                                                                <div className="absolute inset-2 flex items-center justify-center text-xs text-purple-400 opacity-0 group-hover:opacity-100">+ Add Shift</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                                                        <Zap className="w-4 h-4" />
                                                        AI Insight: 3 unassigned shifts on weekend.
                                                    </div>
                                                    <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded">Auto-Assign</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab: eMAR */}
                                    {activeTab === 'emar' && (
                                        <div className="grid grid-cols-2 gap-6 animate-fade-in-up">
                                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                                                <h4 className="text-sm font-bold text-white mb-4">Medication Rounds</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-red-900/30 rounded flex items-center justify-center"><Pill className="w-4 h-4 text-red-500" /></div>
                                                            <div>
                                                                <div className="text-sm font-bold text-red-200">Missed: 08:00 AM</div>
                                                                <div className="text-xs text-red-400">Client: Mrs. Smith</div>
                                                            </div>
                                                        </div>
                                                        <button className="text-xs bg-red-600 text-white px-2 py-1 rounded">Investigate</button>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-green-900/30 rounded flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-500" /></div>
                                                            <div>
                                                                <div className="text-sm font-bold text-green-200">Taken: 08:30 AM</div>
                                                                <div className="text-xs text-green-400">Client: Mr. Jones</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
                                                <div className="w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center mb-4 relative">
                                                    <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent rotation-animation"></div>
                                                    <span className="text-2xl font-bold text-white">99.8%</span>
                                                </div>
                                                <div className="text-sm text-slate-400">Medication Adherence Rate</div>
                                                <div className="text-xs text-green-500 mt-1">Top 5% of Agencies</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Banner */}
            <section className="py-16 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="group">
                            <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">500+</div>
                            <div className="text-purple-300 text-sm font-medium">Care Agencies</div>
                        </div>
                        <div className="group">
                            <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">2M+</div>
                            <div className="text-purple-300 text-sm font-medium">Visits Logged Monthly</div>
                        </div>
                        <div className="group">
                            <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">99.9%</div>
                            <div className="text-purple-300 text-sm font-medium">Uptime SLA</div>
                        </div>
                        <div className="group">
                            <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">4.9★</div>
                            <div className="text-purple-300 text-sm font-medium">App Store Rating</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-bold text-purple-600 tracking-wide uppercase">Complete Care Platform</h2>
                        <h3 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Everything You Need, In One App
                        </h3>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
                            From rostering to compliance, CareFlow handles every aspect of domiciliary care management.
                        </p>
                    </div>

                    {/* Main Features Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 hover:shadow-2xl hover:shadow-purple-500/10 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl group-hover:bg-purple-300/40 transition-colors"></div>
                            <div className="relative">
                                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                                    <Zap className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">AI Smart Rostering</h3>
                                <p className="text-gray-600 mb-4">
                                    Fill shifts in seconds. Our AI matches carers based on skills, location, client preferences, and continuity of care.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Drag-and-drop scheduling</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Auto-fill vacant shifts</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Conflict detection</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-8 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-2xl hover:shadow-green-500/10 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-2xl group-hover:bg-green-300/40 transition-colors"></div>
                            <div className="relative">
                                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                                    <Pill className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">eMAR &amp; Medication Safety</h3>
                                <p className="text-gray-600 mb-4">
                                    CQC-compliant medication management with real-time alerts and full audit trails.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Barcode scanning</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> PRN &amp; controlled drugs</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Missed dose alerts</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl group-hover:bg-blue-300/40 transition-colors"></div>
                            <div className="relative">
                                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                    <MapPin className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">GPS Visit Verification</h3>
                                <p className="text-gray-600 mb-4">
                                    Prove every visit with GPS check-in/out, NFC tags, and timestamped care notes.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Geofence verification</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> NFC tag support</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Offline mode</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Features */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-center group">
                            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-gray-900 mb-1">Time &amp; Attendance</h4>
                            <p className="text-xs text-gray-500">Accurate payroll exports</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-center group">
                            <ShieldCheck className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-gray-900 mb-1">CQC Compliance</h4>
                            <p className="text-xs text-gray-500">Audit-ready reports</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-center group">
                            <Users className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-gray-900 mb-1">Family Portal</h4>
                            <p className="text-xs text-gray-500">Real-time updates for loved ones</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-center group">
                            <Activity className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-gray-900 mb-1">Live Analytics</h4>
                            <p className="text-xs text-gray-500">KPIs at a glance</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonial Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">JH</div>
                            </div>
                            <div>
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                                </div>
                                <p className="text-xl text-gray-700 italic mb-4">
                                    "CareFlow transformed our agency. We went from paper chaos to digital excellence in weeks. Our carers love the app, and our CQC rating improved to Outstanding."
                                </p>
                                <div>
                                    <div className="font-bold text-gray-900">Jane Harrison</div>
                                    <div className="text-sm text-gray-500">Registered Manager, Sunrise Home Care</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-20 bg-purple-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Digitize Your Care Operations Today</h2>
                    <p className="text-purple-200 text-lg mb-10 max-w-2xl mx-auto">
                        Join the 500+ agencies using CareFlow to deliver millions of hours of outstanding care.
                    </p>
                    <button className="px-10 py-5 rounded-full bg-white text-purple-900 font-bold text-lg shadow-xl hover:bg-gray-100 transition-all hover:scale-105">
                        Start Free Trial
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 text-slate-500 py-12 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                        <span className="text-lg font-bold text-slate-900">CareFlow</span>
                    </div>
                    <div className="text-sm">
                        Part of the NovumFlow Suite &bull; &copy; {new Date().getFullYear()}
                    </div>
                    <div className="flex gap-6 text-sm">
                        <Link to="/privacy" className="hover:text-purple-600">Privacy</Link>
                        <Link to="/" className="hover:text-purple-600">NovumFlow HR</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
