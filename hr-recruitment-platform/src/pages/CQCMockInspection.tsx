import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    CheckCircle2,
    AlertTriangle,
    ChevronRight,
    ChevronLeft,
    Save,
    FileText,
    Activity,
    Star,
    Info,
    LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const KLOES = [
    { id: 'safe', name: 'Safe', description: 'Are people protected from abuse and avoidable harm?', color: 'text-rose-600', bgColor: 'bg-rose-50' },
    { id: 'effective', name: 'Effective', description: 'Does people\'s care, treatment and support achieve good outcomes?', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'caring', name: 'Caring', description: 'Do staff treat people with kindness, compasssion, dignity and respect?', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'responsive', name: 'Responsive', description: 'Are services organised so that they meet people\'s needs?', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'well_led', name: 'Well-led', description: 'Does the leadership, management and culture of the organisation promote delivery of high-quality person-centred care?', color: 'text-purple-600', bgColor: 'bg-purple-50' }
];

const RATINGS = [
    { value: 1, label: 'Outstanding', color: 'bg-indigo-600' },
    { value: 2, label: 'Good', color: 'bg-emerald-600' },
    { value: 3, label: 'Requires Improvement', color: 'bg-amber-500' },
    { value: 4, label: 'Inadequate', color: 'bg-rose-600' }
];

const CQCMockInspection: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [findings, setFindings] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const currentKloe = KLOES[step];

    const handleScoreSelect = (value: number) => {
        setScores(prev => ({ ...prev, [currentKloe.id]: value }));
    };

    const handleSave = async (isFinal = false) => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const payload = {
                status: isFinal ? 'completed' : 'draft',
                safe_score: scores.safe,
                effective_score: scores.effective,
                caring_score: scores.caring,
                responsive_score: scores.responsive,
                well_led_score: scores.well_led,
                findings,
                completed_at: isFinal ? new Date().toISOString() : null
            };

            const { error } = await supabase
                .from('cqc_mock_inspections')
                .upsert([payload]);

            if (error) throw error;

            toast.success(isFinal ? 'Inspection submitted successfully!' : 'Progress saved.');
            if (isFinal) navigate('/compliance-hub');
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error('Failed to save inspection.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">CQC Mock Inspection</h1>
                    <p className="text-slate-500 mt-1">Simulate an official inspection to identify areas for improvement.</p>
                </div>
                <button
                    onClick={() => navigate('/compliance-hub')}
                    className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900"
                >
                    <LayoutDashboard className="w-4 h-4" /> Exit
                </button>
            </div>

            {/* Stepper */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                <div className="relative z-10 flex justify-between">
                    {KLOES.map((k, i) => (
                        <div
                            key={k.id}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${i <= step ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'
                                }`}
                        >
                            {i < step ? <CheckCircle2 className="w-5 h-5" /> : <span>{i + 1}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className={`${currentKloe.bgColor} p-8 border-b border-slate-100`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className={`w-6 h-6 ${currentKloe.color}`} />
                        <span className={`text-sm font-black uppercase tracking-widest ${currentKloe.color}`}>Key Line of Enquiry {step + 1}</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900">{currentKloe.name}</h2>
                    <p className="text-slate-600 mt-2 text-lg">{currentKloe.description}</p>
                </div>

                <div className="p-8 space-y-10">
                    {/* Rating Selection */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block">Self-Assessment Rating</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {RATINGS.map((rating) => (
                                <button
                                    key={rating.value}
                                    onClick={() => handleScoreSelect(rating.value)}
                                    className={`p-4 rounded-2xl border-2 text-center transition-all ${scores[currentKloe.id] === rating.value
                                            ? `${rating.color} border-transparent text-white shadow-lg scale-105`
                                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                                        }`}
                                >
                                    <span className="font-bold text-sm block">{rating.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Findings Textarea */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block">Key Findings & Evidence</label>
                        <textarea
                            value={findings[currentKloe.id] || ''}
                            onChange={(e) => setFindings(prev => ({ ...prev, [currentKloe.id]: e.target.value }))}
                            placeholder={`Provide evidence for the ${currentKloe.name} rating...`}
                            className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900"
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <button
                        onClick={() => setStep(prev => Math.max(0, prev - 1))}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-6 py-3 text-slate-600 font-bold disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" /> Back
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="px-6 py-3 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>

                        {step < KLOES.length - 1 ? (
                            <button
                                onClick={() => setStep(prev => prev + 1)}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                            >
                                Next <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                            >
                                <Star className="w-5 h-5" /> Finish Inspection
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                <Info className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                    <h4 className="font-bold text-amber-900">Why do this?</h4>
                    <p className="text-amber-800 text-sm mt-1">
                        Conducting regular self-assessments helps your service stay CQC-ready. Our AI will analyze your findings and suggest a remedial action plan once submitted.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CQCMockInspection;
