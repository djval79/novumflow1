import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';

interface RateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
    review: any;
}

export default function RateModal({ isOpen, onClose, onSuccess, onError, review }: RateModalProps) {
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    overall_rating: rating,
                    manager_comments: comments, // Assuming manager is rating. In real app, logic would differ based on role.
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', review.id);

            if (error) throw error;

            onSuccess();
            onClose();
            setRating(0);
            setComments('');
        } catch (error: any) {
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Rate Review for ${review?.employee?.first_name} ${review?.employee?.last_name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overall Rating (1-5)</label>
                    <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`focus:outline-none transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                <Star className="w-8 h-8 fill-current" />
                            </button>
                        ))}
                    </div>
                    <input type="hidden" required value={rating || ''} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                    <textarea
                        required
                        rows={4}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        placeholder="Enter your feedback and comments..."
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
                        disabled={loading || rating === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
