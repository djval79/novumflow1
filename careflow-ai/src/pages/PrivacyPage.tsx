import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Privacy Policy</h1>

                        <div className="prose prose-indigo max-w-none text-slate-600 space-y-6">
                            <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
                                <p>
                                    Welcome to CareFlow AI ("we," "our," or "us"), part of the NovumFlow Suite by NovumSolvo Ltd. This policy explains how we handle your data, particularly sensitive health and care information, with the utmost security and respect.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
                                <p>We collect information necessary for care delivery and management:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Staff data: Contact details, location (GPS for visit verification), and employment records.</li>
                                    <li>Client data: Health records, medication schedules, care plans, and detailed visit logs.</li>
                                    <li>Organizational data: Rosters, financial records, and compliance documents.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
                                <p>We use this information strictly to:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Facilitate care scheduling and delivery</li>
                                    <li>Verify visit attendance (Electronic Call Monitoring)</li>
                                    <li>Ensure medication safety (eMAR)</li>
                                    <li>Generate compliance reports for regulators (CQC)</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Security & Storage</h2>
                                <p>
                                    Data Sovereignty is critical. All sensitive data is stored on secure servers located within the UK (or equivalent adequacy jurisdictions). We use encryption at rest and in transit.
                                    We do not sell your data to third parties.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Retention</h2>
                                <p>
                                    We retain care records for the periods mandated by the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, typically 3 years after the last care provision or 8 years for general health records.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">6. Contact Us</h2>
                                <p>
                                    If you have questions about our data practices, please email <a href="mailto:dpo@novumsolvo.co.uk" className="text-indigo-600 hover:underline">dpo@novumsolvo.co.uk</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
