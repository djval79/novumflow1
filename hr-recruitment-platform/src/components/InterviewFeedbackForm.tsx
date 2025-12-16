import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
    Star, ThumbsUp, ThumbsDown, MessageSquare, Send,
    User, Calendar, CheckCircle, AlertCircle, X
} from 'lucide-react';
import { format } from 'date-fns';

interface InterviewFeedbackFormProps {
    interviewId?: string;
    candidateName: string;
    position: string;
    interviewDate: string;
    onClose: () => void;
    onSubmit?: (feedback: InterviewFeedback) => void;
}

interface InterviewFeedback {
    overall_rating: number;
    technical_skills: number;
    communication: number;
    cultural_fit: number;
    leadership_potential: number;
    strengths: string;
    areas_for_improvement: string;
    notes: string;
    recommendation: 'strongly_hire' | 'hire' | 'maybe' | 'no_hire' | 'strongly_no_hire';
}

const ratingLabels = {
    1: 'Poor',
    2: 'Below Average',
    3: 'Average',
    4: 'Good',
    5: 'Excellent'
};

const recommendationOptions = [
    { value: 'strongly_hire', label: 'Strongly Hire', color: 'bg-green-600', icon: <ThumbsUp className="w-4 h-4" /> },
    { value: 'hire', label: 'Hire', color: 'bg-green-500', icon: <ThumbsUp className="w-4 h-4" /> },
    { value: 'maybe', label: 'Maybe', color: 'bg-yellow-500', icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'no_hire', label: 'No Hire', color: 'bg-red-500', icon: <ThumbsDown className="w-4 h-4" /> },
    { value: 'strongly_no_hire', label: 'Strongly No Hire', color: 'bg-red-600', icon: <ThumbsDown className="w-4 h-4" /> },
];

export default function InterviewFeedbackForm({
    interviewId,
    candidateName,
    position,
    interviewDate,
    onClose,
    onSubmit
}: InterviewFeedbackFormProps) {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<InterviewFeedback>({
        overall_rating: 0,
        technical_skills: 0,
        communication: 0,
        cultural_fit: 0,
        leadership_potential: 0,
        strengths: '',
        areas_for_improvement: '',
        notes: '',
        recommendation: 'maybe',
    });

    function StarRating({
        value,
        onChange,
        label
    }: {
        value: number;
        onChange: (v: number) => void;
        label: string;
    }) {
        return (
            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {value > 0 && (
                        <span className="text-xs text-gray-500">{ratingLabels[value as keyof typeof ratingLabels]}</span>
                    )}
                </div>
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onChange(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-8 h-8 ${star <= value
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300 hover:text-yellow-300'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validation
            if (feedback.overall_rating === 0) {
                throw new Error('Please provide an overall rating');
            }

            if (!feedback.recommendation) {
                throw new Error('Please select a recommendation');
            }

            const { error: submitError } = await supabase
                .from('interview_feedback')
                .insert({
                    interview_id: interviewId,
                    interviewer_id: user?.id,
                    tenant_id: currentTenant?.id,
                    ...feedback,
                    submitted_at: new Date().toISOString(),
                });

            if (submitError) throw submitError;

            setSuccess(true);
            onSubmit?.(feedback);

            setTimeout(() => onClose(), 2000);
        } catch (err: any) {
            console.error('Error submitting feedback:', err);
            setError(err.message || 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Interview Feedback</h2>
                            <p className="text-sm text-indigo-200">Submit your evaluation</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Candidate Info */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {candidateName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{candidateName}</h3>
                            <p className="text-sm text-gray-500">{position}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-sm text-gray-600 flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {format(new Date(interviewDate), 'PPP')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Feedback Submitted!</h3>
                        <p className="text-gray-500">Thank you for your evaluation.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-6">
                            {/* Error */}
                            {error && (
                                <div className="flex items-start p-4 bg-red-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Ratings Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ratings</h4>

                                <div className="bg-indigo-50 p-4 rounded-xl">
                                    <StarRating
                                        value={feedback.overall_rating}
                                        onChange={(v) => setFeedback({ ...feedback, overall_rating: v })}
                                        label="Overall Rating *"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <StarRating
                                        value={feedback.technical_skills}
                                        onChange={(v) => setFeedback({ ...feedback, technical_skills: v })}
                                        label="Technical Skills"
                                    />
                                    <StarRating
                                        value={feedback.communication}
                                        onChange={(v) => setFeedback({ ...feedback, communication: v })}
                                        label="Communication"
                                    />
                                    <StarRating
                                        value={feedback.cultural_fit}
                                        onChange={(v) => setFeedback({ ...feedback, cultural_fit: v })}
                                        label="Cultural Fit"
                                    />
                                    <StarRating
                                        value={feedback.leadership_potential}
                                        onChange={(v) => setFeedback({ ...feedback, leadership_potential: v })}
                                        label="Leadership Potential"
                                    />
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                    Recommendation *
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {recommendationOptions.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFeedback({ ...feedback, recommendation: option.value as any })}
                                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${feedback.recommendation === option.value
                                                    ? `${option.color} text-white`
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.icon}
                                            <span className="ml-2">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Feedback */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Key Strengths
                                    </label>
                                    <textarea
                                        value={feedback.strengths}
                                        onChange={(e) => setFeedback({ ...feedback, strengths: e.target.value })}
                                        placeholder="What impressed you about this candidate?"
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Areas for Improvement
                                    </label>
                                    <textarea
                                        value={feedback.areas_for_improvement}
                                        onChange={(e) => setFeedback({ ...feedback, areas_for_improvement: e.target.value })}
                                        placeholder="What could this candidate improve on?"
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        value={feedback.notes}
                                        onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                                        placeholder="Any other observations or comments..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-2xl">
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
                                        Submit Feedback
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
