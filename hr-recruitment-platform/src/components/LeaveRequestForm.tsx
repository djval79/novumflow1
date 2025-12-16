import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Calendar, Clock, FileText, Send, X, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays, differenceInBusinessDays, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';

interface LeaveRequestFormProps {
    onClose: () => void;
    onSubmit?: (request: LeaveRequest) => void;
}

interface LeaveRequest {
    type: 'annual' | 'sick' | 'compassionate' | 'maternity' | 'paternity' | 'unpaid' | 'other';
    start_date: string;
    end_date: string;
    reason: string;
    half_day?: 'morning' | 'afternoon' | null;
    contact_number?: string;
    documents?: File[];
}

const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', color: 'bg-blue-100 text-blue-700', balance: 25 },
    { value: 'sick', label: 'Sick Leave', color: 'bg-red-100 text-red-700', balance: 10 },
    { value: 'compassionate', label: 'Compassionate Leave', color: 'bg-purple-100 text-purple-700', balance: 5 },
    { value: 'maternity', label: 'Maternity Leave', color: 'bg-pink-100 text-pink-700', balance: 52 },
    { value: 'paternity', label: 'Paternity Leave', color: 'bg-cyan-100 text-cyan-700', balance: 2 },
    { value: 'unpaid', label: 'Unpaid Leave', color: 'bg-gray-100 text-gray-700', balance: null },
    { value: 'other', label: 'Other', color: 'bg-orange-100 text-orange-700', balance: null },
];

export default function LeaveRequestForm({ onClose, onSubmit }: LeaveRequestFormProps) {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    const [formData, setFormData] = useState<LeaveRequest>({
        type: 'annual',
        start_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        reason: '',
        half_day: null,
        contact_number: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function calculateDays(): number {
        if (!formData.start_date || !formData.end_date) return 0;

        const start = parseISO(formData.start_date);
        const end = parseISO(formData.end_date);

        if (formData.half_day) return 0.5;

        // Count business days
        const days = eachDayOfInterval({ start, end });
        const businessDays = days.filter(day => !isWeekend(day)).length;

        return businessDays;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validation
            if (!formData.reason.trim()) {
                throw new Error('Please provide a reason for your leave request');
            }

            const startDate = parseISO(formData.start_date);
            const endDate = parseISO(formData.end_date);

            if (endDate < startDate) {
                throw new Error('End date must be after start date');
            }

            const days = calculateDays();
            const selectedType = leaveTypes.find(t => t.value === formData.type);

            if (selectedType?.balance && days > selectedType.balance) {
                throw new Error(`Insufficient ${selectedType.label} balance. You have ${selectedType.balance} days available.`);
            }

            // Submit to database
            const { data, error: submitError } = await supabase
                .from('leave_requests')
                .insert({
                    employee_id: user?.id,
                    tenant_id: currentTenant?.id,
                    leave_type: formData.type,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    total_days: days,
                    reason: formData.reason,
                    half_day: formData.half_day,
                    contact_number: formData.contact_number,
                    status: 'pending',
                })
                .select()
                .single();

            if (submitError) throw submitError;

            setSuccess(true);
            onSubmit?.(formData);

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error('Error submitting leave request:', err);
            setError(err.message || 'Failed to submit leave request');
        } finally {
            setLoading(false);
        }
    }

    const selectedLeaveType = leaveTypes.find(t => t.value === formData.type);
    const daysRequested = calculateDays();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Request Leave</h2>
                        <p className="text-sm text-gray-500">Submit a new leave request</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Success Message */}
                {success ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Request Submitted!</h3>
                        <p className="text-gray-500">Your leave request has been sent for approval.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start p-4 bg-red-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Leave Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {leaveTypes.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.value as any })}
                                            className={`p-3 rounded-lg border-2 text-left transition ${formData.type === type.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="text-sm font-medium text-gray-900">{type.label}</p>
                                            {type.balance !== null && (
                                                <p className="text-xs text-gray-500">{type.balance} days available</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            min={format(new Date(), 'yyyy-MM-dd')}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            min={formData.start_date}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Half Day Option */}
                            {formData.start_date === formData.end_date && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Half Day?</label>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, half_day: null })}
                                            className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition ${formData.half_day === null
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            Full Day
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, half_day: 'morning' })}
                                            className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition ${formData.half_day === 'morning'
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            Morning
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, half_day: 'afternoon' })}
                                            className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition ${formData.half_day === 'afternoon'
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            Afternoon
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Days Summary */}
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-indigo-700">Days Requested:</span>
                                    <span className="text-lg font-bold text-indigo-900">{daysRequested} {daysRequested === 1 ? 'day' : 'days'}</span>
                                </div>
                                {selectedLeaveType?.balance !== null && (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-indigo-600">Remaining Balance:</span>
                                        <span className="text-sm font-medium text-indigo-800">
                                            {(selectedLeaveType?.balance || 0) - daysRequested} days
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Brief description of your leave request..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    required
                                />
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Emergency Contact (Optional)
                                </label>
                                <input
                                    type="tel"
                                    value={formData.contact_number}
                                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                    placeholder="+44 7..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
