import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';

interface AddCriteriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
    reviewType: any;
}

export default function AddCriteriaModal({ isOpen, onClose, onSuccess, onError, reviewType }: AddCriteriaModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        name: '',
        description: '',
        weight: 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('review_criteria')
                .insert({
                    review_type_id: reviewType.id,
                    ...formData,
                    is_active: true
                });

            if (error) throw error;

            onSuccess();
            onClose();
            setFormData({
                category: '',
                name: '',
                description: '',
                weight: 0,
            });
        } catch (error: any) {
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Add Criteria to ${reviewType?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Core Competencies, Technical Skills"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Criteria Name *</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
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
                        {loading ? 'Adding...' : 'Add Criteria'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
