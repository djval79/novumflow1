/**
 * Competency Assessment Component
 * 
 * Provides a structured interface for:
 * - Viewing employee competency progress
 * - Recording competency evidence
 * - Supervisor sign-off workflow
 * 
 * CQC Regulation 18 & 19 compliant
 */

import React, { useState, useEffect } from 'react';
import {
    Award,
    CheckCircle,
    Clock,
    AlertTriangle,
    BookOpen,
    Eye,
    UserCheck,
    FileCheck,
    ChevronRight,
    X,
    Loader2,
    ClipboardCheck,
    Star,
    Calendar,
    Upload,
    MessageSquare
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import {
    COMPETENCY_CATEGORIES,
    CompetencyRecord,
    CompetencyStatus,
    EvidenceType,
    getRequiredCompetenciesForRole,
    calculateCompetencyCompletion
} from '@/lib/competencies/competencyTypes';

interface CompetencyAssessmentProps {
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    onClose: () => void;
}

const statusConfig: Record<CompetencyStatus, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    'not_started': { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Not Started', icon: <Clock className="w-4 h-4" /> },
    'in_progress': { color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Progress', icon: <BookOpen className="w-4 h-4" /> },
    'pending_signoff': { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending Sign-off', icon: <Eye className="w-4 h-4" /> },
    'competent': { color: 'text-green-600', bg: 'bg-green-100', label: 'Competent', icon: <CheckCircle className="w-4 h-4" /> },
    'expired': { color: 'text-red-600', bg: 'bg-red-100', label: 'Expired', icon: <AlertTriangle className="w-4 h-4" /> },
    'not_applicable': { color: 'text-gray-400', bg: 'bg-gray-50', label: 'N/A', icon: <X className="w-4 h-4" /> }
};

const evidenceTypes: { value: EvidenceType; label: string; description: string }[] = [
    { value: 'observation', label: 'Direct Observation', description: 'Supervisor observed competency in practice' },
    { value: 'practical_assessment', label: 'Practical Assessment', description: 'Formal practical skills test' },
    { value: 'written_test', label: 'Written Test/Quiz', description: 'Knowledge assessment completed' },
    { value: 'certificate', label: 'External Certificate', description: 'Certificate from training provider' },
    { value: 'training_completion', label: 'Training Completion', description: 'Completed e-learning or course' },
    { value: 'self_declaration', label: 'Self-Declaration', description: 'Employee self-assessment (provisional)' }
];

export default function CompetencyAssessment({
    employeeId,
    employeeName,
    employeeRole,
    onClose
}: CompetencyAssessmentProps) {
    const { currentTenant } = useTenant();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<CompetencyRecord[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [signoffModal, setSignoffModal] = useState<{
        record: CompetencyRecord | null;
        categoryName: string;
    } | null>(null);
    const [signoffData, setSignoffData] = useState({
        evidenceType: 'observation' as EvidenceType,
        evidenceNotes: '',
        outcome: 'competent' as 'competent' | 'not_yet_competent' | 'needs_development',
        developmentNotes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Get required competencies for this role
    const requiredCompetencies = getRequiredCompetenciesForRole(employeeRole);

    useEffect(() => {
        loadCompetencyRecords();
    }, [employeeId]);

    const loadCompetencyRecords = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('competency_records')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .eq('employee_id', employeeId);

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            log.error('Error loading competency records', error, { component: 'CompetencyAssessment', action: 'loadCompetencyRecords', metadata: { employeeId } });
            // Initialize with empty records for demonstration
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const getRecordForStandard = (categoryId: string, standardId: string): CompetencyRecord | undefined => {
        return records.find(r => r.category_id === categoryId && r.standard_id === standardId);
    };

    const getStatusForStandard = (categoryId: string, standardId: string): CompetencyStatus => {
        const record = getRecordForStandard(categoryId, standardId);
        return record?.status || 'not_started';
    };

    const calculateCategoryCompletion = (categoryId: string): { completed: number; total: number; percentage: number } => {
        const category = Object.values(COMPETENCY_CATEGORIES).find(c => c.id === categoryId);
        if (!category) return { completed: 0, total: 0, percentage: 0 };

        const total = category.standards.length;
        const completed = category.standards.filter(s =>
            getStatusForStandard(categoryId, s.id) === 'competent'
        ).length;

        return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

    const handleSignoff = async () => {
        if (!signoffModal?.record && !activeCategory) return;
        if (!currentTenant || !user) return;

        setSubmitting(true);
        try {
            // Create or update competency record
            const recordData = {
                tenant_id: currentTenant.id,
                employee_id: employeeId,
                category_id: signoffModal?.record?.category_id || activeCategory,
                standard_id: signoffModal?.record?.standard_id,
                standard_name: signoffModal?.record?.standard_name,
                status: signoffData.outcome === 'competent' ? 'competent' :
                    signoffData.outcome === 'needs_development' ? 'in_progress' : 'not_started',
                evidence_type: signoffData.evidenceType,
                evidence_notes: signoffData.evidenceNotes,
                assessed_by: user.id,
                assessed_at: new Date().toISOString(),
                assessor_role: profile?.role,
                signed_off_by: signoffData.outcome === 'competent' ? user.id : null,
                signed_off_at: signoffData.outcome === 'competent' ? new Date().toISOString() : null,
                signoff_notes: signoffData.developmentNotes,
                requires_renewal: false,
                updated_at: new Date().toISOString()
            };

            const { error } = signoffModal?.record?.id
                ? await supabase
                    .from('competency_records')
                    .update(recordData)
                    .eq('id', signoffModal.record.id)
                : await supabase
                    .from('competency_records')
                    .insert(recordData);

            if (error) throw error;

            // Reload records
            await loadCompetencyRecords();
            setSignoffModal(null);
            setSignoffData({
                evidenceType: 'observation',
                evidenceNotes: '',
                outcome: 'competent',
                developmentNotes: ''
            });

            alert('Competency assessment saved successfully!');
        } catch (error) {
            log.error('Error saving competency', error, { component: 'CompetencyAssessment', action: 'handleSignoff', metadata: { employeeId } });
            alert('Failed to save assessment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const overallCompletion = calculateCompetencyCompletion(records, requiredCompetencies);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Award className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Competency Assessment</h2>
                                <p className="text-purple-100">{employeeName} • {employeeRole}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-purple-100">Overall Completion</p>
                                <p className="text-2xl font-bold text-white">{overallCompletion}%</p>
                            </div>
                            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">
                                &times;
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Category Sidebar */}
                    <div className="w-72 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Competency Areas
                            </h3>
                            {Object.values(COMPETENCY_CATEGORIES).map(category => {
                                const { completed, total, percentage } = calculateCategoryCompletion(category.id);
                                const isActive = activeCategory === category.id;
                                const isRequired = category.requiredFor.includes(employeeRole as any);

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setActiveCategory(isActive ? null : category.id)}
                                        className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${isActive
                                            ? 'bg-purple-100 border-purple-300 border'
                                            : 'bg-white border border-gray-200 hover:border-purple-200'
                                            } ${!isRequired ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`font-medium ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                                                {category.name}
                                            </span>
                                            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90 text-purple-600' : 'text-gray-400'}`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">{completed}/{total}</span>
                                        </div>
                                        {!isRequired && (
                                            <p className="text-xs text-gray-400 mt-1">Not required for this role</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                            </div>
                        ) : activeCategory ? (
                            <div>
                                {Object.values(COMPETENCY_CATEGORIES)
                                    .filter(c => c.id === activeCategory)
                                    .map(category => (
                                        <div key={category.id}>
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                                                <p className="text-gray-600 mt-1">{category.description}</p>
                                            </div>

                                            <div className="space-y-3">
                                                {category.standards.map(standard => {
                                                    const status = getStatusForStandard(category.id, standard.id);
                                                    const record = getRecordForStandard(category.id, standard.id);
                                                    const config = statusConfig[status];

                                                    return (
                                                        <div
                                                            key={standard.id}
                                                            className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-medium text-gray-900">{standard.name}</span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.bg} ${config.color}`}>
                                                                            {config.icon}
                                                                            {config.label}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600">{standard.description}</p>

                                                                    {record?.signed_off_at && (
                                                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                                            <UserCheck className="w-3 h-3" />
                                                                            Signed off: {new Date(record.signed_off_at).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={() => setSignoffModal({
                                                                        record: record || {
                                                                            id: '',
                                                                            tenant_id: currentTenant?.id || '',
                                                                            employee_id: employeeId,
                                                                            category_id: category.id,
                                                                            standard_id: standard.id,
                                                                            standard_name: standard.name,
                                                                            status: 'not_started',
                                                                            requires_renewal: false,
                                                                            created_at: new Date().toISOString(),
                                                                            updated_at: new Date().toISOString()
                                                                        } as CompetencyRecord,
                                                                        categoryName: category.name
                                                                    })}
                                                                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-1"
                                                                >
                                                                    <ClipboardCheck className="w-4 h-4" />
                                                                    {status === 'competent' ? 'Update' : 'Assess'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Award className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700">Select a Competency Area</h3>
                                <p className="text-gray-500 mt-1 max-w-md">
                                    Choose a category from the sidebar to view and assess individual competencies
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sign-off Modal */}
            {signoffModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileCheck className="w-6 h-6 text-white" />
                                    <div>
                                        <h3 className="font-bold text-white">Competency Sign-Off</h3>
                                        <p className="text-green-100 text-sm">{signoffModal.record?.standard_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSignoffModal(null)} className="text-white/80 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Assessment Outcome */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Outcome *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'competent', label: 'Competent', color: 'green', icon: <CheckCircle className="w-4 h-4" /> },
                                        { value: 'needs_development', label: 'Needs Development', color: 'amber', icon: <BookOpen className="w-4 h-4" /> },
                                        { value: 'not_yet_competent', label: 'Not Yet Competent', color: 'red', icon: <AlertTriangle className="w-4 h-4" /> }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSignoffData(prev => ({ ...prev, outcome: option.value as any }))}
                                            className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center gap-1 transition-all ${signoffData.outcome === option.value
                                                ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                }`}
                                        >
                                            {option.icon}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Evidence Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Type *</label>
                                <select
                                    value={signoffData.evidenceType}
                                    onChange={(e) => setSignoffData(prev => ({ ...prev, evidenceType: e.target.value as EvidenceType }))}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                >
                                    {evidenceTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {evidenceTypes.find(t => t.value === signoffData.evidenceType)?.description}
                                </p>
                            </div>

                            {/* Evidence Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MessageSquare className="w-4 h-4 inline-block mr-1" />
                                    Evidence Notes *
                                </label>
                                <textarea
                                    value={signoffData.evidenceNotes}
                                    onChange={(e) => setSignoffData(prev => ({ ...prev, evidenceNotes: e.target.value }))}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                    placeholder="Describe the evidence observed or reviewed..."
                                />
                            </div>

                            {/* Development Notes (if not competent) */}
                            {signoffData.outcome !== 'competent' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Development Actions Required</label>
                                    <textarea
                                        value={signoffData.developmentNotes}
                                        onChange={(e) => setSignoffData(prev => ({ ...prev, developmentNotes: e.target.value }))}
                                        rows={2}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="Describe what training or support is needed..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setSignoffModal(null)}
                                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSignoff}
                                disabled={submitting || !signoffData.evidenceNotes}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                <UserCheck className="w-4 h-4" />
                                Confirm Sign-Off
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
