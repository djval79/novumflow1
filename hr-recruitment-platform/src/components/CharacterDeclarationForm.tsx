import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';
import {
    Shield,
    CheckCircle,
    AlertTriangle,
    Loader2,
    FileText,
    User,
    Scale,
    Heart,
    Info
} from 'lucide-react';

// ==========================================
// CQC Regulation 19 Compliance
// ==========================================
// This form satisfies the "good character" assessment 
// requirement under CQC Regulation 19 (Fit and Proper Persons Employed)
// ==========================================

interface CharacterDeclarationData {
    // Personal Details
    full_name: string;
    date_of_birth: string;
    current_address: string;

    // Declaration Questions
    criminal_convictions: boolean;
    criminal_convictions_details?: string;
    pending_charges: boolean;
    pending_charges_details?: string;
    disciplinary_proceedings: boolean;
    disciplinary_proceedings_details?: string;
    professional_sanctions: boolean;
    professional_sanctions_details?: string;
    safeguarding_concerns: boolean;
    safeguarding_concerns_details?: string;
    barred_lists: boolean;
    barred_lists_details?: string;
    health_conditions: boolean;
    health_conditions_details?: string;

    // Values-Based Declarations
    compassion_statement: string;
    respect_statement: string;
    integrity_statement: string;

    // Consent
    consent_background_check: boolean;
    consent_reference_check: boolean;
    consent_data_processing: boolean;
    declaration_truthful: boolean;

    // Signature
    signature_name: string;
    signature_date: string;
}

interface CharacterDeclarationFormProps {
    employeeId?: string;
    employeeName?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const declarationQuestions = [
    {
        key: 'criminal_convictions',
        label: 'Criminal Convictions',
        question: 'Do you have any unspent criminal convictions, cautions, reprimands, or final warnings under the Rehabilitation of Offenders Act 1974?',
        detailsLabel: 'Please provide full details of convictions, dates, and sentences:',
        icon: Scale
    },
    {
        key: 'pending_charges',
        label: 'Pending Charges',
        question: 'Are you currently subject to any pending criminal charges, investigations, or court proceedings?',
        detailsLabel: 'Please provide details:',
        icon: AlertTriangle
    },
    {
        key: 'disciplinary_proceedings',
        label: 'Disciplinary History',
        question: 'Have you ever been subject to disciplinary proceedings, dismissed, or asked to resign from any employment?',
        detailsLabel: 'Please provide details including employer, dates, and circumstances:',
        icon: FileText
    },
    {
        key: 'professional_sanctions',
        label: 'Professional Sanctions',
        question: 'Have you ever been subject to sanctions, conditions, or removal from any professional register?',
        detailsLabel: 'Please provide details of the professional body and sanctions:',
        icon: Shield
    },
    {
        key: 'safeguarding_concerns',
        label: 'Safeguarding Concerns',
        question: 'Have you ever been the subject of any safeguarding investigation or allegation (substantiated or not)?',
        detailsLabel: 'Please provide details:',
        icon: Heart
    },
    {
        key: 'barred_lists',
        label: 'Barred Lists',
        question: 'Are you, or have you ever been, included on the DBS Barred Lists (Adults or Children) or POVA/POCA lists?',
        detailsLabel: 'Please provide details:',
        icon: Shield
    },
    {
        key: 'health_conditions',
        label: 'Health Declaration',
        question: 'Do you have any physical or mental health conditions that may affect your ability to perform the duties of this role safely?',
        detailsLabel: 'Please provide details (we will discuss reasonable adjustments):',
        icon: Heart
    }
];

const valuesQuestions = [
    {
        key: 'compassion_statement',
        label: 'Compassion',
        prompt: 'Describe a time when you showed compassion to someone in need. How did you support them?',
        placeholder: 'In my previous role, I noticed an elderly resident was feeling isolated...',
        minLength: 100
    },
    {
        key: 'respect_statement',
        label: 'Respect & Dignity',
        prompt: 'Give an example of how you have maintained someone\'s dignity and respect in a care setting.',
        placeholder: 'I always ensure that I knock and wait before entering a resident\'s room...',
        minLength: 100
    },
    {
        key: 'integrity_statement',
        label: 'Integrity & Honesty',
        prompt: 'Describe a situation where you had to make an ethical decision. What did you do and why?',
        placeholder: 'When I witnessed a colleague speaking inappropriately to a service user...',
        minLength: 100
    }
];

export default function CharacterDeclarationForm({
    employeeId,
    employeeName,
    onSuccess,
    onCancel
}: CharacterDeclarationFormProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const { register, handleSubmit, watch, control, formState: { errors } } = useForm<CharacterDeclarationData>({
        defaultValues: {
            full_name: employeeName || '',
            signature_date: new Date().toISOString().split('T')[0],
            criminal_convictions: false,
            pending_charges: false,
            disciplinary_proceedings: false,
            professional_sanctions: false,
            safeguarding_concerns: false,
            barred_lists: false,
            health_conditions: false,
            consent_background_check: false,
            consent_reference_check: false,
            consent_data_processing: false,
            declaration_truthful: false
        }
    });

    const watchAllFields = watch();

    const onSubmit = async (data: CharacterDeclarationData) => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            // Calculate risk score based on disclosures
            const disclosures = [
                data.criminal_convictions,
                data.pending_charges,
                data.disciplinary_proceedings,
                data.professional_sanctions,
                data.safeguarding_concerns,
                data.barred_lists
            ].filter(Boolean).length;

            const riskLevel = disclosures === 0 ? 'low' : disclosures <= 2 ? 'medium' : 'high';

            // Save to database
            const { error } = await supabase
                .from('character_declarations')
                .insert({
                    tenant_id: currentTenant.id,
                    employee_id: employeeId,
                    full_name: data.full_name,
                    date_of_birth: data.date_of_birth,
                    current_address: data.current_address,

                    // Disclosures
                    criminal_convictions: data.criminal_convictions,
                    criminal_convictions_details: data.criminal_convictions_details,
                    pending_charges: data.pending_charges,
                    pending_charges_details: data.pending_charges_details,
                    disciplinary_proceedings: data.disciplinary_proceedings,
                    disciplinary_proceedings_details: data.disciplinary_proceedings_details,
                    professional_sanctions: data.professional_sanctions,
                    professional_sanctions_details: data.professional_sanctions_details,
                    safeguarding_concerns: data.safeguarding_concerns,
                    safeguarding_concerns_details: data.safeguarding_concerns_details,
                    barred_lists: data.barred_lists,
                    barred_lists_details: data.barred_lists_details,
                    health_conditions: data.health_conditions,
                    health_conditions_details: data.health_conditions_details,

                    // Values statements
                    compassion_statement: data.compassion_statement,
                    respect_statement: data.respect_statement,
                    integrity_statement: data.integrity_statement,

                    // Consents
                    consent_background_check: data.consent_background_check,
                    consent_reference_check: data.consent_reference_check,
                    consent_data_processing: data.consent_data_processing,
                    declaration_truthful: data.declaration_truthful,

                    // Signature
                    signature_name: data.signature_name,
                    signature_date: data.signature_date,

                    // Metadata
                    risk_level: riskLevel,
                    disclosure_count: disclosures,
                    status: disclosures > 0 ? 'requires_review' : 'approved',
                    submitted_at: new Date().toISOString()
                });

            if (error) throw error;

            onSuccess();
        } catch (error) {
            console.error('Error submitting character declaration:', error);
            alert('Failed to submit declaration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-6">
            {[1, 2, 3, 4].map((s) => (
                <React.Fragment key={s}>
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${s === step
                                ? 'bg-cyan-600 text-white shadow-lg'
                                : s < step
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                            }`}
                    >
                        {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    {s < 4 && (
                        <div className={`w-16 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const stepTitles = [
        'Personal Details',
        'Character Disclosures',
        'Values Assessment',
        'Consent & Signature'
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-600 to-blue-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-white" />
                            <div>
                                <h2 className="text-xl font-bold text-white">Character Declaration Form</h2>
                                <p className="text-cyan-100 text-sm">CQC Regulation 19 Compliance</p>
                            </div>
                        </div>
                        <button onClick={onCancel} className="text-white/80 hover:text-white text-2xl">
                            &times;
                        </button>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-6">
                    {renderStepIndicator()}
                    <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                        Step {step}: {stepTitles[step - 1]}
                    </h3>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Step 1: Personal Details */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold">Why we need this information</p>
                                            <p className="mt-1">Under CQC Regulation 19, employers must ensure all staff are of good character before working with vulnerable people. This declaration helps us meet our legal obligations.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name *</label>
                                        <input
                                            type="text"
                                            {...register('full_name', { required: 'Full name is required' })}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                        />
                                        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                        <input
                                            type="date"
                                            {...register('date_of_birth', { required: 'Date of birth is required' })}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                        />
                                        {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Address *</label>
                                        <textarea
                                            {...register('current_address', { required: 'Address is required' })}
                                            rows={3}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                            placeholder="House number, Street, Town/City, Postcode"
                                        />
                                        {errors.current_address && <p className="text-red-500 text-xs mt-1">{errors.current_address.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Character Disclosures */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-semibold">Honest Disclosure Required</p>
                                            <p className="mt-1">Please answer all questions truthfully. Having a conviction or disclosure does not automatically prevent employment – each case is assessed individually. Failure to disclose may result in dismissal.</p>
                                        </div>
                                    </div>
                                </div>

                                {declarationQuestions.map((q) => {
                                    const Icon = q.icon;
                                    const fieldValue = watchAllFields[q.key as keyof CharacterDeclarationData] as boolean;

                                    return (
                                        <div key={q.key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <Icon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                value="false"
                                                                {...register(q.key as any)}
                                                                className="w-4 h-4 text-cyan-600"
                                                            />
                                                            <span className="text-sm">No</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                value="true"
                                                                {...register(q.key as any)}
                                                                className="w-4 h-4 text-cyan-600"
                                                            />
                                                            <span className="text-sm">Yes</span>
                                                        </label>
                                                    </div>
                                                    {fieldValue && (
                                                        <div className="mt-3">
                                                            <label className="block text-sm text-gray-600 mb-1">{q.detailsLabel}</label>
                                                            <textarea
                                                                {...register(`${q.key}_details` as any)}
                                                                rows={3}
                                                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Step 3: Values Assessment */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Heart className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-purple-800">
                                            <p className="font-semibold">Values-Based Assessment</p>
                                            <p className="mt-1">Working in care requires specific values and behaviours. Please provide genuine examples from your experience. Minimum 100 characters per response.</p>
                                        </div>
                                    </div>
                                </div>

                                {valuesQuestions.map((q) => (
                                    <div key={q.key} className="border border-gray-200 rounded-lg p-4">
                                        <label className="block font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <Heart className="w-4 h-4 text-purple-500" />
                                            {q.label}
                                        </label>
                                        <p className="text-sm text-gray-600 mb-3">{q.prompt}</p>
                                        <textarea
                                            {...register(q.key as any, {
                                                required: `${q.label} response is required`,
                                                minLength: {
                                                    value: q.minLength,
                                                    message: `Please provide at least ${q.minLength} characters`
                                                }
                                            })}
                                            rows={4}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                            placeholder={q.placeholder}
                                        />
                                        <div className="flex justify-between mt-1">
                                            {errors[q.key as keyof CharacterDeclarationData] && (
                                                <p className="text-red-500 text-xs">{(errors[q.key as keyof CharacterDeclarationData] as any)?.message}</p>
                                            )}
                                            <p className="text-xs text-gray-400 ml-auto">
                                                {(watchAllFields[q.key as keyof CharacterDeclarationData] as string || '').length} / {q.minLength} min
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Step 4: Consent & Signature */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-green-800">
                                            <p className="font-semibold">Final Step: Consent & Declaration</p>
                                            <p className="mt-1">Please read each statement carefully and tick to confirm your consent.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register('consent_background_check', { required: 'This consent is required' })}
                                            className="w-5 h-5 text-cyan-600 rounded mt-0.5"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">DBS Check Consent *</span>
                                            <p className="text-sm text-gray-600 mt-1">I consent to an Enhanced DBS check including a check of the Adults and Children's Barred Lists where applicable to the role.</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register('consent_reference_check', { required: 'This consent is required' })}
                                            className="w-5 h-5 text-cyan-600 rounded mt-0.5"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">Reference Check Consent *</span>
                                            <p className="text-sm text-gray-600 mt-1">I consent to the organisation contacting my previous employers and referees to obtain references.</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register('consent_data_processing', { required: 'This consent is required' })}
                                            className="w-5 h-5 text-cyan-600 rounded mt-0.5"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">Data Processing Consent *</span>
                                            <p className="text-sm text-gray-600 mt-1">I consent to my personal data being processed in accordance with GDPR for the purposes of assessing my suitability for employment.</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer bg-amber-50">
                                        <input
                                            type="checkbox"
                                            {...register('declaration_truthful', { required: 'You must confirm this declaration' })}
                                            className="w-5 h-5 text-amber-600 rounded mt-0.5"
                                        />
                                        <div>
                                            <span className="font-medium text-amber-900">Declaration of Truth *</span>
                                            <p className="text-sm text-amber-800 mt-1">I declare that all information provided in this form is true, complete, and accurate. I understand that providing false or misleading information may result in the withdrawal of any offer of employment, or dismissal if already employed.</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Signature */}
                                <div className="border-t border-gray-200 pt-6 mt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Electronic Signature
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type Your Full Name *</label>
                                            <input
                                                type="text"
                                                {...register('signature_name', { required: 'Signature is required' })}
                                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 font-serif text-lg"
                                                placeholder="Your full name as signature"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                            <input
                                                type="date"
                                                {...register('signature_date', { required: 'Date is required' })}
                                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Navigation */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
                        <button
                            type="button"
                            onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
                            className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            {step === 1 ? 'Cancel' : 'Previous'}
                        </button>

                        {step < totalSteps ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium flex items-center gap-2"
                            >
                                Next Step
                                <CheckCircle className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <Shield className="w-4 h-4" />
                                Submit Declaration
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
