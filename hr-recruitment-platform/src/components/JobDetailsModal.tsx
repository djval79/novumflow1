import React from 'react';
import { X, MapPin, Briefcase, Clock, DollarSign, Calendar, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface JobDetailsModalProps {
    job: any;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (job: any) => void;
    onUpdateStatus: (jobId: string, status: string) => void;
}

export default function JobDetailsModal({ job, isOpen, onClose, onEdit, onUpdateStatus }: JobDetailsModalProps) {
    if (!isOpen || !job) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-indigo-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{job.job_title}</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === 'active' ? 'bg-green-100 text-green-800' :
                                    job.status === 'closed' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                }`}>
                                {job.status.charAt(0) + job.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                                <Briefcase className="w-4 h-4 mr-1" />
                                {job.department}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                                {job.description || 'No description provided.'}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                                {job.requirements || 'No requirements listed.'}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Job Details</h4>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Location</p>
                                    <p className="text-sm text-gray-500">{job.location || 'Remote'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Employment Type</p>
                                    <p className="text-sm text-gray-500 capitalize">{job.employment_type?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Salary Range</p>
                                    <p className="text-sm text-gray-500">{job.salary_range || 'Competitive'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Posted Date</p>
                                    <p className="text-sm text-gray-500">{format(new Date(job.created_at), 'PPP')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => onEdit(job)}
                                className="w-full flex items-center justify-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
                            >
                                Edit Job Details
                            </button>

                            <select
                                value={job.status}
                                onChange={(e) => onUpdateStatus(job.id, e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            >
                                <option value="draft">Move to Draft</option>
                                <option value="active">Publish Job</option>
                                <option value="closed">Close Posting</option>
                                <option value="cancelled">Cancel Posting</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer / Application Stats */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-5 h-5 mr-2 text-indigo-500" />
                            <strong>{job.application_count || 0}</strong> Applications
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                            <strong>{job.hired_count || 0}</strong> Hired
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
