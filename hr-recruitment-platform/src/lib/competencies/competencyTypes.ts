/**
 * Competency Framework Types & Data
 * 
 * CQC Regulation 18 & 19 Compliance
 * Tracks staff competencies required for safe care delivery
 */

// Core Competency Categories aligned with Care Certificate and CQC requirements
export const COMPETENCY_CATEGORIES = {
    CARE_CERTIFICATE: {
        id: 'care_certificate',
        name: 'Care Certificate Standards',
        description: 'The 15 Care Certificate standards that new care workers must achieve',
        requiredFor: ['carer', 'senior_carer', 'support_worker'],
        standards: [
            { id: 'cc1', name: 'Understand Your Role', description: 'Understanding the scope of your role and responsibilities' },
            { id: 'cc2', name: 'Personal Development', description: 'Understanding the importance of personal development' },
            { id: 'cc3', name: 'Duty of Care', description: 'Understanding duty of care and how to manage dilemmas' },
            { id: 'cc4', name: 'Equality & Diversity', description: 'Equality and diversity in care settings' },
            { id: 'cc5', name: 'Work Person-Centred', description: 'Working in a person-centred way' },
            { id: 'cc6', name: 'Communication', description: 'Effective communication in care' },
            { id: 'cc7', name: 'Privacy & Dignity', description: 'Ensuring privacy and dignity' },
            { id: 'cc8', name: 'Fluids & Nutrition', description: 'Understanding fluids and nutrition' },
            { id: 'cc9', name: 'Mental Health, Dementia & Learning Disabilities', description: 'Awareness of conditions' },
            { id: 'cc10', name: 'Safeguarding Adults', description: 'Safeguarding adults from abuse' },
            { id: 'cc11', name: 'Safeguarding Children', description: 'Safeguarding children from abuse' },
            { id: 'cc12', name: 'Basic Life Support', description: 'Basic life support and first aid' },
            { id: 'cc13', name: 'Health & Safety', description: 'Health and safety in care' },
            { id: 'cc14', name: 'Handling Information', description: 'Handling information securely' },
            { id: 'cc15', name: 'Infection Prevention', description: 'Infection prevention and control' }
        ]
    },
    CLINICAL_SKILLS: {
        id: 'clinical_skills',
        name: 'Clinical Competencies',
        description: 'Clinical skills required for care delivery',
        requiredFor: ['nurse', 'senior_carer', 'clinical_lead'],
        standards: [
            { id: 'cs1', name: 'Medication Administration', description: 'Safe medication management' },
            { id: 'cs2', name: 'Wound Care', description: 'Basic wound assessment and dressing' },
            { id: 'cs3', name: 'Vital Signs Monitoring', description: 'Accurate vital signs measurement' },
            { id: 'cs4', name: 'PEG Feeding', description: 'Percutaneous endoscopic gastrostomy care' },
            { id: 'cs5', name: 'Catheter Care', description: 'Urinary catheter management' },
            { id: 'cs6', name: 'Stoma Care', description: 'Stoma management and care' },
            { id: 'cs7', name: 'Insulin Administration', description: 'Safe insulin administration' },
            { id: 'cs8', name: 'Oxygen Therapy', description: 'Oxygen equipment and monitoring' }
        ]
    },
    MANUAL_HANDLING: {
        id: 'manual_handling',
        name: 'Moving & Handling',
        description: 'Safe moving and handling of people',
        requiredFor: ['carer', 'senior_carer', 'nurse', 'support_worker'],
        standards: [
            { id: 'mh1', name: 'Risk Assessment', description: 'Assessing moving and handling risks' },
            { id: 'mh2', name: 'Hoist Operation', description: 'Safe use of hoisting equipment' },
            { id: 'mh3', name: 'Slide Sheet Use', description: 'Using slide sheets and transfer boards' },
            { id: 'mh4', name: 'Stand Aid Use', description: 'Operating standing aids safely' },
            { id: 'mh5', name: 'Bed Repositioning', description: 'Repositioning people in bed' }
        ]
    },
    SPECIALIST_CARE: {
        id: 'specialist_care',
        name: 'Specialist Care Areas',
        description: 'Competencies for specialist care delivery',
        requiredFor: ['senior_carer', 'nurse', 'specialist'],
        standards: [
            { id: 'sc1', name: 'Dementia Care', description: 'Supporting people living with dementia' },
            { id: 'sc2', name: 'End of Life Care', description: 'Palliative and end of life support' },
            { id: 'sc3', name: 'Mental Health Awareness', description: 'Mental health conditions and support' },
            { id: 'sc4', name: 'Learning Disabilities', description: 'Supporting people with learning disabilities' },
            { id: 'sc5', name: 'Challenging Behaviour', description: 'Positive behaviour support' },
            { id: 'sc6', name: 'Autism Awareness', description: 'Supporting autistic individuals' }
        ]
    }
} as const;

// Competency status types
export type CompetencyStatus =
    | 'not_started'
    | 'in_progress'
    | 'pending_signoff'
    | 'competent'
    | 'expired'
    | 'not_applicable';

// Evidence types for competency demonstration
export type EvidenceType =
    | 'observation'
    | 'written_test'
    | 'practical_assessment'
    | 'certificate'
    | 'supervisor_signoff'
    | 'self_declaration'
    | 'training_completion';

// Competency record interface
export interface CompetencyRecord {
    id: string;
    tenant_id: string;
    employee_id: string;
    category_id: string;
    standard_id: string;
    standard_name: string;
    status: CompetencyStatus;

    // Evidence
    evidence_type?: EvidenceType;
    evidence_notes?: string;
    evidence_document_id?: string;

    // Assessment
    assessed_by?: string;
    assessed_at?: string;
    assessor_role?: string;

    // Sign-off
    signed_off_by?: string;
    signed_off_at?: string;
    signoff_notes?: string;

    // Expiry (if applicable)
    valid_from?: string;
    valid_until?: string;
    requires_renewal: boolean;

    // Metadata
    created_at: string;
    updated_at: string;
}

// Employee competency summary
export interface EmployeeCompetencySummary {
    employee_id: string;
    employee_name: string;
    role: string;
    total_required: number;
    completed: number;
    pending_signoff: number;
    expired: number;
    completion_percentage: number;
    next_expiry?: string;
    last_assessment_date?: string;
}

// Signoff request interface
export interface CompetencySignoffRequest {
    competency_record_id: string;
    assessor_id: string;
    assessor_name: string;
    evidence_type: EvidenceType;
    evidence_notes: string;
    outcome: 'competent' | 'not_yet_competent' | 'needs_development';
    development_notes?: string;
    reassessment_date?: string;
}

// Assessment workflow steps
export const ASSESSMENT_WORKFLOW_STEPS = [
    {
        step: 1,
        name: 'Training Completion',
        description: 'Employee completes required training module',
        responsible: 'Employee'
    },
    {
        step: 2,
        name: 'Self-Declaration',
        description: 'Employee self-assesses understanding',
        responsible: 'Employee'
    },
    {
        step: 3,
        name: 'Practical Observation',
        description: 'Supervisor observes competency in practice',
        responsible: 'Supervisor'
    },
    {
        step: 4,
        name: 'Sign-Off',
        description: 'Authorized signatory confirms competency',
        responsible: 'Manager/Trainer'
    }
];

// Helper to get required competencies for a role
export function getRequiredCompetenciesForRole(role: string): string[] {
    const competencyIds: string[] = [];

    Object.values(COMPETENCY_CATEGORIES).forEach(category => {
        if (category.requiredFor.includes(role as any)) {
            category.standards.forEach(standard => {
                competencyIds.push(`${category.id}:${standard.id}`);
            });
        }
    });

    return competencyIds;
}

// Helper to calculate completion percentage
export function calculateCompetencyCompletion(
    records: CompetencyRecord[],
    requiredIds: string[]
): number {
    if (requiredIds.length === 0) return 100;

    const completedCount = records.filter(
        r => r.status === 'competent' &&
            requiredIds.includes(`${r.category_id}:${r.standard_id}`)
    ).length;

    return Math.round((completedCount / requiredIds.length) * 100);
}
