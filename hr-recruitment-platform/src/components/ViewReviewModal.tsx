import React from 'react';
import Modal from './Modal';
import { format } from 'date-fns';
import { Star } from 'lucide-react';

interface ViewReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    review: any;
}

export default function ViewReviewModal({ isOpen, onClose, review }: ViewReviewModalProps) {
    if (!review) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Review Details" maxWidth="max-w-3xl">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Employee</h3>
                        <p className="mt-1 text-lg font-medium text-gray-900">
                            {review.employee?.first_name} {review.employee?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{review.employee?.department}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Review Type</h3>
                        <p className="mt-1 text-lg font-medium text-gray-900">{review.review_type?.name}</p>
                        <p className="text-sm text-gray-500">{review.review_type?.frequency}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase">Period Start</h3>
                        <p className="mt-1 text-sm text-gray-900">{format(new Date(review.review_period_start), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase">Period End</h3>
                        <p className="mt-1 text-sm text-gray-900">{format(new Date(review.review_period_end), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase">Due Date</h3>
                        <p className="mt-1 text-sm text-gray-900">{format(new Date(review.review_due_date), 'MMM d, yyyy')}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Rating</h3>
                    <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-6 h-6 ${review.overall_rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                            />
                        ))}
                        <span className="ml-2 text-lg font-bold text-gray-900">
                            {review.overall_rating ? review.overall_rating.toFixed(1) : 'N/A'}
                        </span>
                    </div>
                </div>

                {review.manager_comments && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Manager Comments</h3>
                        <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                            {review.manager_comments}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
