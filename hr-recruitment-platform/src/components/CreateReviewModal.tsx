import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

interface CreateReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}

export default function CreateReviewModal({ isOpen, onClose, onSuccess, onError }: CreateReviewModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [reviewTypes, setReviewTypes] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        employee_id: '',
        review_type_id: '',
        review_period_start: '',
        review_period_end: '',
        review_due_date: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    async function loadData() {
        try {
            const { data: empData } = await supabase
                .from('employees')
                .select('id, first_name, last_name')
                .eq('status', 'active')
                .order('first_name');
            setEmployees(empData || []);

            const { data: typeData } = await supabase
                .from('performance_review_types')
                .select('id, name')
                .eq('is_active', true)
                .order('name');
            setReviewTypes(typeData || []);
        } catch (error) {
            log.error('Error loading review context data', error, { component: 'CreateReviewModal', action: 'loadData' });
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    ...formData,
                    status: 'pending',
                    created_by: user?.id
                });

            if (error) throw error;

            onSuccess();
            onClose();
            setFormData({
                employee_id: '',
                review_type_id: '',
                review_period_start: '',
                review_period_end: '',
                review_due_date: '',
            });
        } catch (error: any) {
            log.error('Error creating performance review', error, { component: 'CreateReviewModal', action: 'handleSubmit', metadata: formData });
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Performance Review">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                    <select
                        required
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.first_name} {emp.last_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Type *</label>
                    <select
                        required
                        value={formData.review_type_id}
                        onChange={(e) => setFormData({ ...formData, review_type_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                        <option value="">Select Review Type</option>
                        {reviewTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
                        <input
                            type="date"
                            required
                            value={formData.review_period_start}
                            onChange={(e) => setFormData({ ...formData, review_period_start: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
                        <input
                            type="date"
                            required
                            value={formData.review_period_end}
                            onChange={(e) => setFormData({ ...formData, review_period_end: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                        type="date"
                        required
                        value={formData.review_due_date}
                        onChange={(e) => setFormData({ ...formData, review_due_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Review'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
