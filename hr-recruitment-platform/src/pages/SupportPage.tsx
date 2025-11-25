import React from 'react';
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SupportPage() {
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">App Support</h1>
                        <p className="text-gray-600 mb-8">Need help? Our support team is here to assist you.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>

                                <div className="flex items-start gap-4">
                                    <div className="bg-cyan-100 p-2 rounded-lg">
                                        <Mail className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Email Us</h3>
                                        <p className="text-sm text-gray-500 mb-1">For general inquiries and technical support</p>
                                        <a href="mailto:info@novumsolvo.co.uk" className="text-cyan-600 hover:underline font-medium">
                                            info@novumsolvo.co.uk
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-cyan-100 p-2 rounded-lg">
                                        <Phone className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Call Us</h3>
                                        <p className="text-sm text-gray-500 mb-1">Mon-Fri from 9am to 5pm</p>
                                        <a href="tel:+441234567890" className="text-cyan-600 hover:underline font-medium">
                                            +44 (0) 123 456 7890
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-cyan-100 p-2 rounded-lg">
                                        <MapPin className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Office</h3>
                                        <p className="text-gray-600">
                                            NovumSolvo Ltd<br />
                                            123 Business Park<br />
                                            London, UK
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Topics</h2>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <span className="text-gray-600">Account access issues</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <span className="text-gray-600">Application status updates</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <span className="text-gray-600">Document upload help</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <span className="text-gray-600">Updating personal details</span>
                                    </li>
                                </ul>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">
                                        For urgent matters regarding ongoing shifts or care, please contact your manager directly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
