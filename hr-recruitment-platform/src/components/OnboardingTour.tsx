import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Shield, Sparkles } from 'lucide-react';

interface OnboardingStep {
    title: string;
    content: string;
    target?: string;
    icon: React.ReactNode;
}

export const OnboardingTour: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const steps: OnboardingStep[] = [
        {
            title: "Welcome to NovumFlow Suite",
            content: "The first integrated operating system for regulated care. Let's take a quick 1-minute tour of your new mission control.",
            icon: <Zap className="text-cyan-500" size={32} />
        },
        {
            title: "NovumFlow HR",
            content: "Automate your recruitment, RTW checks, and DBS renewals. Your staff data syncs instantly to the clinical teams.",
            icon: <Shield className="text-blue-500" size={32} />
        },
        {
            title: "CareFlow AI",
            content: "Where the magic happens. AI-powered care plans, smart rostering, and real-time eMAR. Compliance is enforced at every visit.",
            icon: <Sparkles className="text-green-500" size={32} />
        },
        {
            title: "ComplyFlow",
            content: "Audit-ready, always. Use the AI Gap Analyzer to check your policies and see your SECRO dashboard score.",
            icon: <Shield className="text-purple-500" size={32} />
        }
    ];

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            finish();
        }
    };

    const prev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const finish = () => {
        setIsVisible(false);
        onComplete();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        {steps[currentStep].icon}
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Step {currentStep + 1} of {steps.length}</div>
                    </div>
                    <button onClick={finish} className="text-slate-300 hover:text-slate-900 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        {steps[currentStep].title}
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        {steps[currentStep].content}
                    </p>
                </div>

                <div className="p-8 bg-slate-50 flex justify-between items-center">
                    <button
                        onClick={prev}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all font-mono"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-8 bg-cyan-600' : 'w-1.5 bg-slate-200'}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={next}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all font-mono"
                    >
                        {currentStep === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
