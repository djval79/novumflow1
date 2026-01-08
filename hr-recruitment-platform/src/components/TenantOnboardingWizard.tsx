import React, { useState, useEffect } from 'react';
import { Check, ChevronRight, Loader2, X } from 'lucide-react';
import { onboardingService, OnboardingStep, TenantOnboarding } from '@/lib/services/OnboardingService';

interface TenantOnboardingWizardProps {
    tenantId: string;
    tenantName: string;
    onClose?: () => void;
    onComplete?: () => void;
}

export default function TenantOnboardingWizard({ tenantId, tenantName, onClose, onComplete }: TenantOnboardingWizardProps) {
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [onboardingStatus, setOnboardingStatus] = useState<TenantOnboarding | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadOnboardingData();
    }, [tenantId]);

    async function loadOnboardingData() {
        setLoading(true);
        const [stepsData, statusData] = await Promise.all([
            onboardingService.getOnboardingSteps(tenantId),
            onboardingService.getOnboardingStatus(tenantId)
        ]);
        setSteps(stepsData);
        setOnboardingStatus(statusData);
        setLoading(false);
    }

    async function toggleStep(stepId: string, currentStatus: boolean) {
        setUpdating(true);
        const stepMapping: Record<string, keyof Omit<TenantOnboarding, 'id' | 'tenant_id' | 'onboarding_status' | 'completion_percentage' | 'started_at' | 'completed_at'>> = {
            'basic_info': 'basic_info_completed',
            'admin_user': 'admin_user_created',
            'features': 'features_configured',
            'branding': 'branding_setup',
            'integrations': 'integrations_configured',
            'first_employee': 'first_employee_added',
            'welcome_email': 'welcome_email_sent'
        };

        const dbField = stepMapping[stepId];
        if (dbField) {
            const success = await onboardingService.updateOnboardingStep(tenantId, dbField, !currentStatus);
            if (success) {
                await loadOnboardingData();
            }
        }
        setUpdating(false);
    }

    async function handleCompleteOnboarding() {
        setUpdating(true);
        const success = await onboardingService.completeOnboarding(tenantId);
        if (success) {
            await loadOnboardingData();
            onComplete?.();
        }
        setUpdating(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    const completedSteps = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;
    const percentage = onboardingStatus?.completion_percentage || 0;
    const allRequiredComplete = steps.filter(s => s.required).every(s => s.completed);

    return (
        <div className="bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Welcome to NovumFlow!</h2>
                        <p className="text-sm text-gray-600 mt-1">Let's get {tenantName} set up</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                            {completedSteps} of {totalSteps} steps completed
                        </span>
                        <span className="font-bold text-cyan-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Steps List */}
            <div className="p-6 space-y-3">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`border rounded-lg p-4 transition-all ${step.completed
                            ? 'border-cyan-200 bg-cyan-50'
                            : 'border-gray-200 bg-white hover:border-cyan-300'
                            }`}
                    >
                        <div className="flex items-start">
                            <button
                                onClick={() => toggleStep(step.id, step.completed)}
                                disabled={updating}
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${step.completed
                                    ? 'bg-cyan-600 border-cyan-600'
                                    : 'border-gray-300 hover:border-cyan-500'
                                    } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {step.completed && <Check className="w-4 h-4 text-white" />}
                            </button>

                            <div className="ml-4 flex-1">
                                <div className="flex items-center">
                                    <h3 className={`text-sm font-medium ${step.completed ? 'text-gray-900' : 'text-gray-700'
                                        }`}>
                                        {step.title}
                                        {step.required && (
                                            <span className="ml-2 text-xs text-red-600 font-normal">*Required</span>
                                        )}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                            </div>

                            {!step.completed && (
                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {allRequiredComplete ? (
                            <span className="text-green-600 font-medium">✓ All required steps completed!</span>
                        ) : (
                            <span>Complete all required steps to finish onboarding</span>
                        )}
                    </div>
                    <button
                        onClick={handleCompleteOnboarding}
                        disabled={!allRequiredComplete || updating || onboardingStatus?.onboarding_status === 'completed'}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {updating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                                Completing...
                            </>
                        ) : onboardingStatus?.onboarding_status === 'completed' ? (
                            'Onboarding Complete'
                        ) : (
                            'Complete Onboarding'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
