import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { complianceService, DBSCheck } from '@/lib/services/ComplianceService';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, Upload, Save, AlertCircle } from 'lucide-react';
import { log } from '@/lib/logger';

interface DBSCheckFormProps {
    userId?: string;
    applicantName?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function DBSCheckForm({ userId, applicantName, onSuccess, onCancel }: DBSCheckFormProps) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Partial<DBSCheck>>({
        defaultValues: {
            applicant_name: applicantName || '',
            check_type: 'enhanced_barred',
            check_level: 'adult',
            status: 'pending',
            renewal_period_months: 36,
            update_service_subscribed: false
        }
    });

    const issueDate = watch('issue_date');

    // Auto-calculate expiry date when issue date changes
    React.useEffect(() => {
        if (issueDate) {
            const date = new Date(issueDate);
            date.setFullYear(date.getFullYear() + 3); // Default 3 years
            setValue('expiry_date', date.toISOString().split('T')[0]);
        }
    }, [issueDate, setValue]);

    const onSubmit = async (data: Partial<DBSCheck>) => {
        if (!currentTenant) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const dbsData = {
                ...data,
                tenant_id: currentTenant.id,
                user_id: userId || null,
                verified_by: user?.id,
                verified_at: new Date().toISOString()
            };

            const result = await complianceService.addDBSCheck(dbsData);

            if (result) {
                onSuccess();
            } else {
                setError('Failed to save DBS check. Please try again.');
            }
        } catch (err) {
            log.error('Error saving DBS check', err, { component: 'DBSCheckForm', action: 'handleSubmit' });
            setError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Add DBS Check Record</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Applicant Details */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Applicant Name *
                            </label>
                            <input
                                {...register('applicant_name', { required: 'Applicant name is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Full Name"
                            />
                            {errors.applicant_name && (
                                <p className="text-red-500 text-xs mt-1">{errors.applicant_name.message}</p>
                            )}
                        </div>

                        {/* Check Details */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Check Type *
                            </label>
                            <select
                                {...register('check_type')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="enhanced_barred">Enhanced with Barred List</option>
                                <option value="enhanced">Enhanced</option>
                                <option value="standard">Standard</option>
                                <option value="basic">Basic</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Check Level
                            </label>
                            <select
                                {...register('check_level')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="adult">Adult Workforce</option>
                                <option value="child">Child Workforce</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certificate Number
                            </label>
                            <input
                                {...register('certificate_number')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="001234567890"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                {...register('status')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="clear">Clear</option>
                                <option value="disclosed">Disclosed (See Notes)</option>
                                <option value="renewal_due">Renewal Due</option>
                            </select>
                        </div>

                        {/* Dates */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Date *
                            </label>
                            <input
                                type="date"
                                {...register('issue_date', { required: 'Issue date is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.issue_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.issue_date.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date (Auto-calculated)
                            </label>
                            <input
                                type="date"
                                {...register('expiry_date')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                readOnly
                            />
                        </div>

                        {/* Update Service */}
                        <div className="col-span-2">
                            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('update_service_subscribed')}
                                    className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Subscribed to DBS Update Service
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-1">
                                Allows instant online status checks without new certificates
                            </p>
                        </div>

                        {/* File Upload */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Certificate Scan
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-cyan-50 file:text-cyan-700
                                    hover:file:bg-cyan-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes / Disclosures
                            </label>
                            <textarea
                                {...register('notes')}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Any additional details..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
