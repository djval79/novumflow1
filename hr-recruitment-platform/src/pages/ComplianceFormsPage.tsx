/**
 * Compliance Forms Page
 * 
 * Entry point for all compliance-related forms:
 * - Right to Work Check (eVisa compliant)
 * - Character Declaration (CQC Regulation 19)
 * - Values-Based Interview Scoring
 * - Competency Assessment (CQC Regulation 18)
 */

import React, { useState } from 'react';
import {
    Shield,
    FileCheck,
    Heart,
    Users,
    AlertTriangle,
    Clock,
    CheckCircle,
    Award
} from 'lucide-react';
import RightToWorkForm from '@/components/RightToWorkForm';
import CharacterDeclarationForm from '@/components/CharacterDeclarationForm';
import CompetencyAssessment from '@/components/CompetencyAssessment';
import { ValuesInterviewScoring } from '@/components/recruitment';

type FormType = 'rtw' | 'character' | 'values' | 'competency' | null;

export default function ComplianceFormsPage() {
    const [activeForm, setActiveForm] = useState<FormType>(null);
    const [employeeId] = useState<string | undefined>(undefined);
    const [employeeName] = useState<string>('');

    const forms = [
        {
            id: 'rtw' as FormType,
            title: 'Right to Work Check',
            description: 'eVisa compliant verification with Home Office online check support',
            icon: FileCheck,
            color: 'cyan',
            badge: '2024-2025 Updated',
            badgeColor: 'bg-red-100 text-red-700',
            features: [
                'Online share code verification',
                'eVisa mandatory compliance',
                'BRP rejection enforcement',
                '90-day vignette follow-up tracking'
            ]
        },
        {
            id: 'character' as FormType,
            title: 'Character Declaration',
            description: 'CQC Regulation 19 compliant disclosure form for pre-employment',
            icon: Shield,
            color: 'purple',
            badge: 'CQC Required',
            badgeColor: 'bg-purple-100 text-purple-700',
            features: [
                'Criminal conviction disclosures',
                'Disciplinary history',
                'Professional sanctions',
                'Values-based statements'
            ]
        },
        {
            id: 'values' as FormType,
            title: 'Values-Based Interview',
            description: 'Assess candidates against 6 core care values for hiring decisions',
            icon: Heart,
            color: 'pink',
            badge: 'Best Practice',
            badgeColor: 'bg-green-100 text-green-700',
            features: [
                'Compassion & dignity scoring',
                'Person-centred care assessment',
                'Integrity & teamwork evaluation',
                'Safeguarding concerns flagging'
            ]
        },
        {
            id: 'competency' as FormType,
            title: 'Competency Assessment',
            description: 'Track staff competencies with sign-off workflow (Care Certificate, Clinical Skills)',
            icon: Award,
            color: 'indigo',
            badge: 'CQC Regulation 18',
            badgeColor: 'bg-indigo-100 text-indigo-700',
            features: [
                '15 Care Certificate standards',
                'Clinical skills assessments',
                'Moving & handling sign-off',
                'Supervisor sign-off workflow'
            ]
        }
    ];

    const handleFormSuccess = () => {
        setActiveForm(null);
        // Could show a success toast here
    };

    const renderForm = () => {
        switch (activeForm) {
            case 'rtw':
                return (
                    <RightToWorkForm
                        employeeId={employeeId}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setActiveForm(null)}
                    />
                );
            case 'character':
                return (
                    <CharacterDeclarationForm
                        employeeId={employeeId}
                        employeeName={employeeName}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setActiveForm(null)}
                    />
                );
            case 'values':
                return (
                    <ValuesInterviewScoring
                        onSuccess={handleFormSuccess}
                        onCancel={() => setActiveForm(null)}
                    />
                );
            case 'competency':
                return (
                    <CompetencyAssessment
                        employeeId={employeeId || 'demo-employee'}
                        employeeName={employeeName || 'Demo Employee'}
                        employeeRole="carer"
                        onClose={() => setActiveForm(null)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Compliance Forms</h1>
                            <p className="text-gray-600">CQC Regulation 19 & Home Office compliant documentation</p>
                        </div>
                    </div>

                    {/* Critical Alert Banner */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mt-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-red-800">2024-2025 Compliance Updates Active</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    eVisas are now mandatory (Jan 2025). BRPs are no longer valid documents.
                                    All RTW checks must use the Home Office online checking service for non-UK/Irish nationals.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {forms.map((form) => {
                        const Icon = form.icon;
                        return (
                            <div
                                key={form.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                                onClick={() => setActiveForm(form.id)}
                            >
                                <div className={`h-2 bg-${form.color}-500`} />
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 bg-${form.color}-100 rounded-xl`}>
                                            <Icon className={`w-6 h-6 text-${form.color}-600`} />
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${form.badgeColor}`}>
                                            {form.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{form.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{form.description}</p>

                                    <div className="space-y-2">
                                        {form.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    <button className={`mt-6 w-full py-2.5 bg-${form.color}-600 text-white rounded-lg font-medium hover:bg-${form.color}-700 transition-colors`}>
                                        Open Form
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                                <p className="text-xs text-gray-500">Pending RTW Checks</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <div>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                                <p className="text-xs text-gray-500">Invalid BRP Checks</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-purple-500" />
                            <div>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                                <p className="text-xs text-gray-500">Pending Declarations</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold text-gray-900">100%</p>
                                <p className="text-xs text-gray-500">Compliance Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Active Form Modal */}
            {activeForm && renderForm()}
        </div>
    );
}
