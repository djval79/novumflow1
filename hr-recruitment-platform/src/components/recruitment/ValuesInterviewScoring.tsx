import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';
import {
    Heart,
    Star,
    CheckCircle,
    AlertTriangle,
    Loader2,
    User,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Award,
    Target,
    Users,
    Shield
} from 'lucide-react';

// ==========================================
// CQC Values-Based Recruitment
// ==========================================
// This component implements values-based interview scoring
// to assess candidates against care sector values:
// - Compassion
// - Dignity & Respect
// - Commitment to Quality
// - Person-Centred Care
// - Integrity
// - Teamwork
// ==========================================

interface ValueScore {
    value: string;
    score: number; // 1-5
    evidence: string;
    flags: string[];
}

interface InterviewScoreData {
    candidate_name: string;
    position: string;
    interviewer_name: string;
    interview_date: string;
    interview_type: 'phone' | 'video' | 'in-person' | 'panel';

    value_scores: ValueScore[];

    // Overall Assessment
    overall_impression: string;
    strengths: string[];
    development_areas: string[];

    // Recommendation
    recommendation: 'strongly_recommend' | 'recommend' | 'consider' | 'do_not_recommend';
    recommendation_notes: string;

    // Red Flags
    red_flags: string[];
    safeguarding_concerns: boolean;
    safeguarding_notes?: string;
}

interface ValuesInterviewScoringProps {
    applicationId?: string;
    candidateName?: string;
    positionTitle?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

// CQC-aligned care values with interview questions
const careValues = [
    {
        id: 'compassion',
        name: 'Compassion',
        description: 'Shows genuine concern for others\' wellbeing and suffering',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        questions: [
            "Tell me about a time when you went above and beyond to help someone in need.",
            "How do you respond when someone is distressed or upset?",
            "Describe a situation where you had to show patience with someone who was struggling."
        ],
        lookFor: [
            "Genuine empathy in responses",
            "Puts others' needs first",
            "Shows emotional intelligence",
            "Can describe specific caring actions"
        ],
        redFlags: [
            "Dismissive of others' feelings",
            "Task-focused over person-focused",
            "Lacks emotional awareness",
            "Unable to give concrete examples"
        ]
    },
    {
        id: 'dignity_respect',
        name: 'Dignity & Respect',
        description: 'Treats everyone with dignity regardless of circumstances',
        icon: Shield,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        questions: [
            "How do you ensure you respect someone's privacy and dignity?",
            "Tell me about a time you advocated for someone's choices even if you disagreed.",
            "How would you handle a situation where a colleague was being disrespectful to a service user?"
        ],
        lookFor: [
            "Respects autonomy and choice",
            "Understands consent",
            "Maintains confidentiality",
            "Challenges discrimination"
        ],
        redFlags: [
            "Patronising language",
            "Makes assumptions about people",
            "Overrides preferences 'for their own good'",
            "Dismisses cultural differences"
        ]
    },
    {
        id: 'person_centred',
        name: 'Person-Centred Care',
        description: 'Puts the individual at the heart of care decisions',
        icon: User,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        questions: [
            "How do you find out what matters most to someone you're caring for?",
            "Describe how you would adapt your care approach for different individuals.",
            "What does 'person-centred care' mean to you?"
        ],
        lookFor: [
            "Asks about preferences",
            "Flexible approach",
            "Involves person in decisions",
            "Recognises individuality"
        ],
        redFlags: [
            "One-size-fits-all approach",
            "Focus on tasks over relationships",
            "Doesn't mention asking the person",
            "Organisational needs over individual needs"
        ]
    },
    {
        id: 'integrity',
        name: 'Integrity & Honesty',
        description: 'Demonstrates honesty, accountability and ethical behaviour',
        icon: Award,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        questions: [
            "Tell me about a time you made a mistake at work. How did you handle it?",
            "What would you do if you saw a colleague doing something you thought was wrong?",
            "How do you handle confidential or sensitive information?"
        ],
        lookFor: [
            "Admits to mistakes",
            "Would report concerns",
            "Understands boundaries",
            "Takes responsibility"
        ],
        redFlags: [
            "Blames others",
            "Would cover up issues",
            "Boundary violations",
            "Evasive answers"
        ]
    },
    {
        id: 'commitment_quality',
        name: 'Commitment to Quality',
        description: 'Strives for high standards and continuous improvement',
        icon: Target,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        questions: [
            "How do you ensure you deliver high-quality care?",
            "Tell me about a time you identified a way to improve something.",
            "How do you keep your knowledge and skills up to date?"
        ],
        lookFor: [
            "Proactive about standards",
            "Seeks feedback",
            "Commits to learning",
            "Takes pride in work"
        ],
        redFlags: [
            "'Good enough' mentality",
            "Resistant to change",
            "Defensive about feedback",
            "No interest in development"
        ]
    },
    {
        id: 'teamwork',
        name: 'Teamwork & Communication',
        description: 'Works collaboratively and communicates effectively',
        icon: Users,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        questions: [
            "Describe a time you had to work with someone difficult.",
            "How do you ensure important information is communicated effectively?",
            "What does being a good team member mean to you?"
        ],
        lookFor: [
            "Collaborative mindset",
            "Good communication",
            "Supports colleagues",
            "Handles conflict constructively"
        ],
        redFlags: [
            "Prefers to work alone",
            "Poor communication examples",
            "Blames team members",
            "Conflict-avoidant or aggressive"
        ]
    }
];

const recommendationOptions = [
    { value: 'strongly_recommend', label: 'Strongly Recommend', color: 'bg-green-600', icon: ThumbsUp },
    { value: 'recommend', label: 'Recommend', color: 'bg-blue-600', icon: CheckCircle },
    { value: 'consider', label: 'Consider with Reservations', color: 'bg-amber-600', icon: AlertTriangle },
    { value: 'do_not_recommend', label: 'Do Not Recommend', color: 'bg-red-600', icon: ThumbsDown }
];

export default function ValuesInterviewScoring({
    applicationId,
    candidateName = '',
    positionTitle = '',
    onSuccess,
    onCancel
}: ValuesInterviewScoringProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [activeValue, setActiveValue] = useState(0);

    const [formData, setFormData] = useState<InterviewScoreData>({
        candidate_name: candidateName,
        position: positionTitle,
        interviewer_name: '',
        interview_date: new Date().toISOString().split('T')[0],
        interview_type: 'in-person',
        value_scores: careValues.map(v => ({
            value: v.id,
            score: 0,
            evidence: '',
            flags: []
        })),
        overall_impression: '',
        strengths: [],
        development_areas: [],
        recommendation: 'consider',
        recommendation_notes: '',
        red_flags: [],
        safeguarding_concerns: false,
        safeguarding_notes: ''
    });

    const [newStrength, setNewStrength] = useState('');
    const [newDevelopmentArea, setNewDevelopmentArea] = useState('');
    const [newRedFlag, setNewRedFlag] = useState('');

    const updateValueScore = (valueId: string, field: 'score' | 'evidence', value: any) => {
        setFormData(prev => ({
            ...prev,
            value_scores: prev.value_scores.map(vs =>
                vs.value === valueId ? { ...vs, [field]: value } : vs
            )
        }));
    };

    const toggleValueFlag = (valueId: string, flag: string) => {
        setFormData(prev => ({
            ...prev,
            value_scores: prev.value_scores.map(vs => {
                if (vs.value !== valueId) return vs;
                const flags = vs.flags.includes(flag)
                    ? vs.flags.filter(f => f !== flag)
                    : [...vs.flags, flag];
                return { ...vs, flags };
            })
        }));
    };

    const addItem = (field: 'strengths' | 'development_areas' | 'red_flags', value: string, setValue: (v: string) => void) => {
        if (!value.trim()) return;
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], value.trim()]
        }));
        setValue('');
    };

    const removeItem = (field: 'strengths' | 'development_areas' | 'red_flags', index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const calculateOverallScore = () => {
        const scoredValues = formData.value_scores.filter(vs => vs.score > 0);
        if (scoredValues.length === 0) return 0;
        const total = scoredValues.reduce((sum, vs) => sum + vs.score, 0);
        return Math.round((total / (scoredValues.length * 5)) * 100);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-red-600';
    };

    const handleSubmit = async () => {
        if (!currentTenant) return;

        // Validation
        const unscoredValues = formData.value_scores.filter(vs => vs.score === 0);
        if (unscoredValues.length > 0) {
            alert(`Please score all values before submitting. Missing: ${unscoredValues.map(vs =>
                careValues.find(cv => cv.id === vs.value)?.name
            ).join(', ')}`);
            return;
        }

        setLoading(true);
        try {
            const overallScore = calculateOverallScore();

            const { error } = await supabase
                .from('interview_evaluations')
                .insert({
                    tenant_id: currentTenant.id,
                    application_id: applicationId,
                    candidate_name: formData.candidate_name,
                    position: formData.position,
                    interviewer_name: formData.interviewer_name,
                    interview_date: formData.interview_date,
                    interview_type: formData.interview_type,
                    evaluation_type: 'values_based',

                    // Scores
                    value_scores: formData.value_scores,
                    overall_score: overallScore,

                    // Assessment
                    overall_impression: formData.overall_impression,
                    strengths: formData.strengths,
                    development_areas: formData.development_areas,

                    // Recommendation
                    recommendation: formData.recommendation,
                    recommendation_notes: formData.recommendation_notes,

                    // Flags
                    red_flags: formData.red_flags,
                    safeguarding_concerns: formData.safeguarding_concerns,
                    safeguarding_notes: formData.safeguarding_notes,

                    // Metadata
                    submitted_at: new Date().toISOString()
                });

            if (error) throw error;

            onSuccess();
        } catch (error) {
            console.error('Error submitting evaluation:', error);
            alert('Failed to submit evaluation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const currentValue = careValues[activeValue];
    const currentScore = formData.value_scores.find(vs => vs.value === currentValue.id);
    const overallScore = calculateOverallScore();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Heart className="w-8 h-8 text-white" />
                            <div>
                                <h2 className="text-xl font-bold text-white">Values-Based Interview Scoring</h2>
                                <p className="text-purple-100 text-sm">CQC Aligned Assessment</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-white/70 text-xs">Overall Score</div>
                                <div className={`text-2xl font-bold text-white`}>
                                    {overallScore}%
                                </div>
                            </div>
                            <button onClick={onCancel} className="text-white/80 hover:text-white text-2xl">
                                &times;
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar - Value Navigation */}
                    <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto hidden md:block">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Values Assessment</h3>
                        </div>
                        <nav className="p-2">
                            {careValues.map((value, index) => {
                                const Icon = value.icon;
                                const score = formData.value_scores.find(vs => vs.value === value.id)?.score || 0;

                                return (
                                    <button
                                        key={value.id}
                                        onClick={() => setActiveValue(index)}
                                        className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-3 transition-all ${activeValue === index
                                                ? 'bg-white shadow-md border border-gray-200'
                                                : 'hover:bg-white/50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${value.bgColor}`}>
                                            <Icon className={`w-4 h-4 ${value.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{value.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {score > 0 ? (
                                                    <span className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3 h-3 ${i < score ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                                                            />
                                                        ))}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600">Not scored</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Summary Button */}
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={() => setActiveValue(-1)}
                                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${activeValue === -1
                                        ? 'bg-purple-100 border border-purple-300'
                                        : 'bg-white border border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                <Award className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-gray-900">Summary & Submit</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Interview Details - always visible at top when scoring values */}
                        {activeValue >= 0 && activeValue === 0 && (
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
                                        <input
                                            type="text"
                                            value={formData.candidate_name}
                                            onChange={e => setFormData(prev => ({ ...prev, candidate_name: e.target.value }))}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                        <input
                                            type="text"
                                            value={formData.position}
                                            onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
                                        <input
                                            type="text"
                                            value={formData.interviewer_name}
                                            onChange={e => setFormData(prev => ({ ...prev, interviewer_name: e.target.value }))}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
                                        <input
                                            type="date"
                                            value={formData.interview_date}
                                            onChange={e => setFormData(prev => ({ ...prev, interview_date: e.target.value }))}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Value Scoring View */}
                        {activeValue >= 0 && (
                            <div className="p-6">
                                <div className={`${currentValue.bgColor} ${currentValue.borderColor} border rounded-xl p-6 mb-6`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 ${currentValue.bgColor} rounded-xl`}>
                                            {React.createElement(currentValue.icon, { className: `w-8 h-8 ${currentValue.color}` })}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">{currentValue.name}</h3>
                                            <p className="text-gray-600 mt-1">{currentValue.description}</p>
                                        </div>
                                    </div>

                                    {/* Score Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Score this value</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(score => (
                                                <button
                                                    key={score}
                                                    onClick={() => updateValueScore(currentValue.id, 'score', score)}
                                                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${currentScore?.score === score
                                                            ? 'bg-purple-600 text-white shadow-lg'
                                                            : 'bg-white border border-gray-300 hover:border-purple-400'
                                                        }`}
                                                >
                                                    {score}
                                                    <div className="text-xs mt-1 opacity-75">
                                                        {score === 1 ? 'Poor' : score === 2 ? 'Below Exp.' : score === 3 ? 'Meets Exp.' : score === 4 ? 'Exceeds' : 'Outstanding'}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Interview Questions */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-purple-600" />
                                            Suggested Questions
                                        </h4>
                                        <div className="space-y-2">
                                            {currentValue.questions.map((q, i) => (
                                                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                                                    {q}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            What to Look For
                                        </h4>
                                        <div className="bg-white border border-green-200 rounded-lg p-3 mb-4">
                                            <div className="space-y-1">
                                                {currentValue.lookFor.map((item, i) => (
                                                    <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={currentScore?.flags.includes(`positive:${item}`)}
                                                            onChange={() => toggleValueFlag(currentValue.id, `positive:${item}`)}
                                                            className="w-4 h-4 text-green-600 rounded"
                                                        />
                                                        <span className="text-gray-700">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                            Red Flags
                                        </h4>
                                        <div className="bg-white border border-red-200 rounded-lg p-3">
                                            <div className="space-y-1">
                                                {currentValue.redFlags.map((item, i) => (
                                                    <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={currentScore?.flags.includes(`redflag:${item}`)}
                                                            onChange={() => toggleValueFlag(currentValue.id, `redflag:${item}`)}
                                                            className="w-4 h-4 text-red-600 rounded"
                                                        />
                                                        <span className="text-gray-700">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Evidence Notes */}
                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Evidence Notes
                                    </label>
                                    <textarea
                                        value={currentScore?.evidence || ''}
                                        onChange={e => updateValueScore(currentValue.id, 'evidence', e.target.value)}
                                        rows={4}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="Record specific examples and quotes from the candidate that demonstrate (or lack) this value..."
                                    />
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => activeValue > 0 ? setActiveValue(activeValue - 1) : null}
                                        disabled={activeValue === 0}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Previous Value
                                    </button>
                                    <button
                                        onClick={() => activeValue < careValues.length - 1 ? setActiveValue(activeValue + 1) : setActiveValue(-1)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        {activeValue < careValues.length - 1 ? 'Next Value' : 'Go to Summary'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Summary View */}
                        {activeValue === -1 && (
                            <div className="p-6 space-y-6">
                                {/* Score Summary */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Values Score Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        {careValues.map(value => {
                                            const score = formData.value_scores.find(vs => vs.value === value.id)?.score || 0;
                                            const Icon = value.icon;
                                            return (
                                                <div key={value.id} className="bg-white rounded-lg p-4 text-center shadow-sm">
                                                    <Icon className={`w-6 h-6 ${value.color} mx-auto mb-2`} />
                                                    <div className="text-xs text-gray-600 mb-1">{value.name}</div>
                                                    <div className={`text-2xl font-bold ${score >= 4 ? 'text-green-600' : score >= 3 ? 'text-blue-600' : score > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                                                        {score}/5
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 text-center">
                                        <div className="text-sm text-gray-600">Overall Values Alignment</div>
                                        <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                                            {overallScore}%
                                        </div>
                                    </div>
                                </div>

                                {/* Overall Impression */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Impression</label>
                                    <textarea
                                        value={formData.overall_impression}
                                        onChange={e => setFormData(prev => ({ ...prev, overall_impression: e.target.value }))}
                                        rows={4}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="Summarise your overall impression of the candidate's values alignment..."
                                    />
                                </div>

                                {/* Strengths & Development */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Key Strengths</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={newStrength}
                                                onChange={e => setNewStrength(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addItem('strengths', newStrength, setNewStrength))}
                                                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                                placeholder="Add a strength..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addItem('strengths', newStrength, setNewStrength)}
                                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {formData.strengths.map((s, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="flex-1 text-sm">{s}</span>
                                                    <button onClick={() => removeItem('strengths', i)} className="text-gray-400 hover:text-red-500">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Development Areas</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={newDevelopmentArea}
                                                onChange={e => setNewDevelopmentArea(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addItem('development_areas', newDevelopmentArea, setNewDevelopmentArea))}
                                                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                                placeholder="Add a development area..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addItem('development_areas', newDevelopmentArea, setNewDevelopmentArea)}
                                                className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {formData.development_areas.map((d, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                                                    <Target className="w-4 h-4 text-amber-600" />
                                                    <span className="flex-1 text-sm">{d}</span>
                                                    <button onClick={() => removeItem('development_areas', i)} className="text-gray-400 hover:text-red-500">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Safeguarding Concerns */}
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.safeguarding_concerns}
                                            onChange={e => setFormData(prev => ({ ...prev, safeguarding_concerns: e.target.checked }))}
                                            className="w-5 h-5 text-red-600 rounded"
                                        />
                                        <div>
                                            <span className="font-semibold text-red-800">Safeguarding Concerns Identified</span>
                                            <p className="text-sm text-red-700">Check this if any safeguarding concerns arose during the interview</p>
                                        </div>
                                    </label>
                                    {formData.safeguarding_concerns && (
                                        <textarea
                                            value={formData.safeguarding_notes}
                                            onChange={e => setFormData(prev => ({ ...prev, safeguarding_notes: e.target.value }))}
                                            rows={3}
                                            className="mt-3 block w-full rounded-lg border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                            placeholder="Describe the safeguarding concerns..."
                                        />
                                    )}
                                </div>

                                {/* Recommendation */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Recommendation</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {recommendationOptions.map(opt => {
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, recommendation: opt.value as any }))}
                                                    className={`p-4 rounded-xl border-2 transition-all ${formData.recommendation === opt.value
                                                            ? `${opt.color} text-white border-transparent shadow-lg`
                                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <Icon className="w-6 h-6 mx-auto mb-2" />
                                                    <div className="text-sm font-medium">{opt.label}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <textarea
                                        value={formData.recommendation_notes}
                                        onChange={e => setFormData(prev => ({ ...prev, recommendation_notes: e.target.value }))}
                                        rows={3}
                                        className="mt-4 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="Add any notes to support your recommendation..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Award className="w-4 h-4" />
                        Submit Evaluation
                    </button>
                </div>
            </div>
        </div>
    );
}
