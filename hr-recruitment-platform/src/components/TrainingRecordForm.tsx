import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { complianceService, TrainingRecord } from '@/lib/services/ComplianceService';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, Upload, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

interface TrainingRecordFormProps {
    userId?: string;
    staffName?: string;
    initialData?: TrainingRecord;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function TrainingRecordForm({ userId, staffName, initialData, onSuccess, onCancel }: TrainingRecordFormProps) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Partial<TrainingRecord>>({
        defaultValues: initialData ? {
            ...initialData,
            completion_date: initialData.completion_date ? initialData.completion_date.split('T')[0] : '',
            expiry_date: initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '',
        } : {
            user_id: userId || '',
            staff_name: staffName || '',
            training_category: 'mandatory',
            is_mandatory: true,
            assessment_passed: true
        }
    });

    const trainingTypes = [
        { value: 'health_safety', label: 'Health & Safety' },
        { value: 'fire_safety', label: 'Fire Safety' },
        { value: 'safeguarding', label: 'Safeguarding' },
        { value: 'infection_control', label: 'Infection Control' },
        { value: 'manual_handling', label: 'Manual Handling' },
        { value: 'medication', label: 'Medication Administration' },
        { value: 'mental_capacity_dols', label: 'Mental Capacity & DoLS' },
        { value: 'first_aid', label: 'First Aid' },
        { value: 'food_hygiene', label: 'Food Hygiene' },
        { value: 'equality_diversity', label: 'Equality & Diversity' },
        { value: 'record_keeping', label: 'Record Keeping' },
        { value: 'care_certificate', label: 'Care Certificate' },
        { value: 'dementia_care', label: 'Dementia Care' },
        { value: 'end_of_life', label: 'End of Life Care' },
        { value: 'other', label: 'Other' }
    ];

    const onSubmit = async (data: Partial<TrainingRecord>) => {
        if (!currentTenant) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const trainingData = {
                ...data,
                tenant_id: currentTenant.id,
                user_id: userId || initialData?.user_id || null,
                training_name: trainingTypes.find(t => t.value === data.training_type)?.label || 'Other Training',
            };

            let result;
            if (initialData?.id) {
                result = await complianceService.updateTrainingRecord(initialData.id, trainingData);
            } else {
                result = await complianceService.addTrainingRecord(trainingData);
            }

            if (result) {
                onSuccess();
            } else {
                setError('Failed to save training record. Please try again.');
            }
        } catch (err) {
            log.error('Error saving training record', err, { component: 'TrainingRecordForm', action: 'onSubmit' });
            setError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Add Training Record</h2>
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
                        {/* Staff Details */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Staff Name *
                            </label>
                            <input
                                {...register('staff_name', { required: 'Staff name is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Full Name"
                            />
                            {errors.staff_name && (
                                <p className="text-red-500 text-xs mt-1">{errors.staff_name.message}</p>
                            )}
                        </div>

                        {/* Training Details */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Training Type *
                            </label>
                            <select
                                {...register('training_type', { required: 'Training type is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Select Type...</option>
                                {trainingTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                            {errors.training_type && (
                                <p className="text-red-500 text-xs mt-1">{errors.training_type.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                {...register('training_category')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="mandatory">Mandatory</option>
                                <option value="role_specific">Role Specific</option>
                                <option value="cpd">CPD</option>
                                <option value="induction">Induction</option>
                            </select>
                        </div>

                        {/* Dates */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Completion Date *
                            </label>
                            <input
                                type="date"
                                {...register('completion_date', { required: 'Completion date is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                            {errors.completion_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.completion_date.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                {...register('expiry_date')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Training Provider
                            </label>
                            <input
                                {...register('training_provider')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="e.g. External Provider, Internal"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Certificate Number
                            </label>
                            <input
                                {...register('certificate_number')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* File Upload */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Certificate
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
                                Notes
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
