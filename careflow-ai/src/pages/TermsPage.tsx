import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link to="/login" className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
                    <div className="px-6 py-8 sm:p-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Terms of Service</h1>

                        <div className="prose prose-indigo max-w-none text-slate-600 space-y-6">
                            <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">1. Agreement to Terms</h2>
                                <p>
                                    By accessing or using the CareFlow AI platform ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Platform.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of Service</h2>
                                <p>
                                    CareFlow AI provides care management, rostering, eMAR, and compliance tools for social care providers. We grant you a limited, non-exclusive, non-transferable license to use the Platform for your internal business purposes.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Responsibilities</h2>
                                <p>You are responsible for:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>maintaining the confidentiality of your account credentials</li>
                                    <li>all activities that occur under your account</li>
                                    <li>ensuring the accuracy of care records, medication logs, and visit data</li>
                                    <li>compliance with CQC regulations regarding digital record keeping</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">4. Clinical & Compliance Disclaimer</h2>
                                <p>
                                    <strong>CareFlow AI is a tool, not a clinical decision maker.</strong> You generally remain responsible for all care decisions. Our "AI Rostering" and "Compliance Shield" features are designed to assist, but not replace, professional judgment. We are not liable for adverse care outcomes or regulatory actions.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Protection</h2>
                                <p>
                                    We process data in accordance with our Privacy Policy. By using the Service, you warrant that you have lawful grounds for processing the sensitive personal data (including health data) you upload, in accordance with UK GDPR.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">6. Payment Terms</h2>
                                <p>
                                    Subscription fees are billed in advance. Failure to pay may result in suspension of access to critical care tools. Refunds are at our sole discretion.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">7. Termination</h2>
                                <p>
                                    We may terminate or suspend your account immediately for breach of these Terms. Upon termination, your right to use the Platform will immediately cease.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">8. Contact Us</h2>
                                <p>
                                    For any questions regarding these Terms, please contact us at <a href="mailto:legal@novumsolvo.co.uk" className="text-indigo-600 hover:underline">legal@novumsolvo.co.uk</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
