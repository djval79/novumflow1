import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link to="/login" className="flex items-center text-cyan-600 hover:text-cyan-700 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-8 sm:p-10">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>

                        <div className="prose prose-cyan max-w-none text-gray-600 space-y-6">
                            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
                                <p>
                                    By accessing or using the NovumFlow platform ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Platform.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                                <p>
                                    NovumFlow provides HR recruitment, compliance management, and staff operational tools for regulated industries. We grant you a limited, non-exclusive, non-transferable license to use the Platform for your internal business purposes.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
                                <p>You are responsible for:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>maintaining the confidentiality of your account credentials</li>
                                    <li>all activities that occur under your account</li>
                                    <li>ensuring the accuracy of data you input, including compliance documents</li>
                                    <li>obtaining necessary consents from your staff/candidates for data processing</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compliance & Liability</h2>
                                <p>
                                    While NovumFlow provides tools to assist with regulatory compliance (e.g., CQC, Home Office), <strong>you remain solely responsible for your organization's compliance</strong>.
                                    NovumFlow does not provide legal advice, and our "Compliance Shield" features are aids, not guarantees. We are not liable for any regulatory fines, penalties, or operational losses incurred.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Protection</h2>
                                <p>
                                    We process data in accordance with our Privacy Policy. By using the Service, you warrant that you have lawful grounds for processing personal data you upload to the Platform, in accordance with UK GDPR.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Payment Terms</h2>
                                <p>
                                    Subscription fees are billed in advance. Failure to pay may result in suspension of access. Refunds are provided at our sole discretion or as required by law.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Termination</h2>
                                <p>
                                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Us</h2>
                                <p>
                                    For any questions regarding these Terms, please contact us at <a href="mailto:legal@novumsolvo.co.uk" className="text-cyan-600 hover:underline">legal@novumsolvo.co.uk</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
