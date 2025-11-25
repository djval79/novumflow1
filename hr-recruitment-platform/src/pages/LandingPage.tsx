import React, { useState } from 'react';
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
    Star,
    Lock,
    Zap
} from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Shield className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                NovumFlow
                            </span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-cyan-600 font-medium transition-colors">Features</a>
                            <a href="#suite" className="text-gray-600 hover:text-cyan-600 font-medium transition-colors">The Suite</a>
                            <a href="#testimonials" className="text-gray-600 hover:text-cyan-600 font-medium transition-colors">Testimonials</a>
                            <Link
                                to="/login"
                                className="px-6 py-2.5 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Login
                            </Link>
                        </div>

                        <div className="md:hidden">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600">
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 absolute w-full">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Features</a>
                            <a href="#suite" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">The Suite</a>
                            <Link to="/login" className="block w-full text-center mt-4 px-6 py-3 rounded-lg bg-cyan-600 text-white font-bold">
                                Login to Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 font-semibold text-sm mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        New: CQC Inspector Mode & Digital Passports
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight">
                        The Fortress of <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600">
                            Compliance
                        </span>
                    </h1>

                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-10">
                        The only care management suite that locks non-compliant staff out of your roster.
                        Protect your agency, pass inspections, and sleep better at night.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button className="px-8 py-4 rounded-full bg-cyan-600 text-white font-bold text-lg shadow-lg hover:bg-cyan-700 hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            Book a Demo <ArrowRight className="w-5 h-5" />
                        </button>
                        <Link to="/login" className="px-8 py-4 rounded-full bg-white text-gray-900 border border-gray-200 font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                            Login
                        </Link>
                    </div>

                    {/* Hero Image Mockup */}
                    <div className="mt-20 relative mx-auto max-w-5xl">
                        <div className="rounded-2xl bg-gray-900 p-2 shadow-2xl ring-1 ring-gray-900/10">
                            <div className="rounded-xl overflow-hidden bg-gray-800 aspect-[16/9] relative flex items-center justify-center">
                                {/* Placeholder for Dashboard Screenshot */}
                                <div className="text-center">
                                    <LayoutDashboard className="w-24 h-24 text-gray-700 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Dashboard Preview</p>
                                </div>
                                {/* Floating Elements */}
                                <div className="absolute -right-12 top-12 bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-64 animate-float">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Inspector Mode</p>
                                            <p className="text-xs text-green-600 font-medium">Active & Verified</p>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-green-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Suite Section */}
            <section id="suite" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-semibold text-cyan-600 tracking-wide uppercase">The Novum Suite</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Two Apps. One Unbeatable System.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* NovumFlow */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden group hover:border-cyan-200 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield className="w-48 h-48 text-cyan-600" />
                            </div>
                            <div className="relative z-10">
                                <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
                                    <Shield className="w-6 h-6 text-cyan-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">NovumFlow</h3>
                                <p className="text-cyan-600 font-medium mb-6">The Back Office Shield</p>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Automated Recruitment Pipelines</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> CQC Compliance Dashboard</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Digital Staff Passports</li>
                                </ul>
                            </div>
                        </div>

                        {/* Care Flow */}
                        <div className="bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-800 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Smartphone className="w-48 h-48 text-purple-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                                    <Smartphone className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Care Flow</h3>
                                <p className="text-purple-400 font-medium mb-6">The Front Line Engine</p>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-500" /> Smart Rostering (AI Powered)</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-500" /> Mobile Visit Verification</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-500" /> Real-time eMAR & Notes</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Killer Features */}
            <section id="features" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Why Agencies Switch to Novum
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Lock className="w-6 h-6 text-red-500" />}
                            title="Compliance Lock"
                            desc="If a DBS expires, the staff member is instantly locked out of the roster. No manual checks, no accidental fines."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-yellow-500" />}
                            title="Inspector Mode"
                            desc="One click transforms your dashboard into a read-only evidence vault for CQC inspectors. Hide the mess, show the proof."
                        />
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-blue-500" />}
                            title="Digital Passports"
                            desc="Every carer gets a QR-coded digital ID card. Prove Right to Work and Training status instantly on the floor."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-cyan-600">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to upgrade your agency?</h2>
                    <p className="text-cyan-100 text-xl mb-10">Join the agencies that have moved from "Chaos" to "Compliance".</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button className="px-8 py-4 rounded-full bg-white text-cyan-600 font-bold text-lg shadow-lg hover:bg-cyan-50 transition-all">
                            Book a Free Demo
                        </button>
                        <Link to="/login" className="px-8 py-4 rounded-full bg-cyan-700 text-white border border-cyan-500 font-bold text-lg hover:bg-cyan-800 transition-all">
                            Login to Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="h-6 w-6 text-cyan-500" />
                            <span className="text-xl font-bold text-white">NovumFlow</span>
                        </div>
                        <p className="text-sm max-w-xs">
                            The complete operating system for modern care agencies. Built for compliance, designed for people.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">NovumFlow (HR)</a></li>
                            <li><a href="#" className="hover:text-white">Care Flow (Rostering)</a></li>
                            <li><a href="#" className="hover:text-white">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">About Us</a></li>
                            <li><a href="#" className="hover:text-white">Contact</a></li>
                            <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-sm text-center">
                    &copy; {new Date().getFullYear()} NovumSolvo. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">
                {desc}
            </p>
        </div>
    );
}
