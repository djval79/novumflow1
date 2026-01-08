import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

                        <div className="prose prose-cyan max-w-none text-gray-600 space-y-6">
                            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                                <p>
                                    Welcome to NovumFlow ("we," "our," or "us"), a product of NovumSolvo Ltd. We are committed to protecting your personal information and your right to privacy.
                                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                                <p>We collect information that you provide directly to us when you:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Register for an account</li>
                                    <li>Fill out application forms</li>
                                    <li>Upload documents (CVs, certificates, etc.)</li>
                                    <li>Contact our support team</li>
                                </ul>
                                <p className="mt-2">This information may include:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Name and contact details (email, phone number)</li>
                                    <li>Employment history and qualifications</li>
                                    <li>Identification documents for background checks</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                                <p>We use the information we collect to:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Process your job applications</li>
                                    <li>Manage your employment records</li>
                                    <li>Ensure compliance with regulatory requirements</li>
                                    <li>Communicate with you regarding your account or applications</li>
                                    <li>Improve our services and application functionality</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
                                <p>
                                    We implement appropriate technical and organizational security measures to protect your personal information.
                                    However, please note that no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Contact Us</h2>
                                <p>
                                    If you have questions or comments about this policy, you may email us at <a href="mailto:info@novumsolvo.co.uk" className="text-cyan-600 hover:underline">info@novumsolvo.co.uk</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
