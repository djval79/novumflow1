/**
 * Compliance Document Taxonomy
 * 
 * Separates Home Office, CQC, and shared compliance requirements
 * Tracks documents from application through employment lifecycle
 */

// ============================================
// COMPLIANCE CATEGORIES
// ============================================

export type ComplianceAuthority = 'HOME_OFFICE' | 'CQC' | 'BOTH' | 'INTERNAL';

export type ComplianceStage = 
  | 'APPLICATION'      // When applying for a position
  | 'PRE_EMPLOYMENT'   // After offer, before start
  | 'ONBOARDING'       // First days/weeks
  | 'ONGOING'          // Throughout employment
  | 'OFFBOARDING';     // When leaving

export type DocumentStatus = 
  | 'PENDING'          // Awaiting upload
  | 'UPLOADED'         // Uploaded, needs verification
  | 'UNDER_REVIEW'     // Being reviewed
  | 'VERIFIED'         // Verified and approved
  | 'REJECTED'         // Rejected, needs resubmission
  | 'EXPIRED'          // Past expiry date
  | 'EXPIRING_SOON'    // Within 30 days of expiry
  | 'NOT_APPLICABLE';  // N/A for this person

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// ============================================
// HOME OFFICE COMPLIANCE DOCUMENTS
// ============================================

export const HOME_OFFICE_DOCUMENTS = {
  // Right to Work Documents
  RTW_PASSPORT: {
    id: 'rtw_passport',
    name: 'Passport',
    description: 'Valid passport showing right to work in UK',
    authority: 'HOME_OFFICE' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT'] as ComplianceStage[],
    required: true,
    hasExpiry: true,
    expiryWarningDays: 90,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  RTW_VISA: {
    id: 'rtw_visa',
    name: 'Visa / Immigration Status',
    description: 'Valid visa or immigration document',
    authority: 'HOME_OFFICE' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING'] as ComplianceStage[],
    required: false, // Only if not British/Irish citizen
    conditionalOn: 'nationality',
    hasExpiry: true,
    expiryWarningDays: 90,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  RTW_BRP: {
    id: 'rtw_brp',
    name: 'Biometric Residence Permit (BRP)',
    description: 'BRP card for non-UK nationals',
    authority: 'HOME_OFFICE' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING'] as ComplianceStage[],
    required: false,
    conditionalOn: 'visa_type',
    hasExpiry: true,
    expiryWarningDays: 90,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  RTW_SHARE_CODE: {
    id: 'rtw_share_code',
    name: 'Home Office Share Code',
    description: 'Online right to work share code verification',
    authority: 'HOME_OFFICE' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT'] as ComplianceStage[],
    required: false,
    conditionalOn: 'eVisa_holder',
    hasExpiry: true,
    expiryWarningDays: 30,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  RTW_CHECK_RESULT: {
    id: 'rtw_check_result',
    name: 'Right to Work Check Result',
    description: 'Completed RTW check screenshot/confirmation',
    authority: 'HOME_OFFICE' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: false, // System generates this
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  NATIONAL_INSURANCE: {
    id: 'national_insurance',
    name: 'National Insurance Number',
    description: 'NI number letter or proof',
    authority: 'HOME_OFFICE' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT', 'ONBOARDING'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  BIRTH_CERTIFICATE: {
    id: 'birth_certificate',
    name: 'Birth Certificate',
    description: 'UK birth certificate (full)',
    authority: 'HOME_OFFICE' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT'] as ComplianceStage[],
    required: false,
    conditionalOn: 'uk_citizen_no_passport',
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
} as const;

// ============================================
// CQC COMPLIANCE DOCUMENTS
// ============================================

export const CQC_DOCUMENTS = {
  // DBS & Safeguarding
  DBS_CERTIFICATE: {
    id: 'dbs_certificate',
    name: 'DBS Certificate (Enhanced)',
    description: 'Enhanced DBS certificate with barred list check',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT', 'ONGOING'] as ComplianceStage[],
    required: true,
    hasExpiry: true,
    expiryWarningDays: 90,
    renewalPeriodMonths: 36, // 3 years
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  DBS_UPDATE_SERVICE: {
    id: 'dbs_update_service',
    name: 'DBS Update Service Registration',
    description: 'DBS Update Service subscription confirmation',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT', 'ONGOING'] as ComplianceStage[],
    required: false,
    hasExpiry: true,
    expiryWarningDays: 30,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  
  // Qualifications & Training
  CARE_CERTIFICATE: {
    id: 'care_certificate',
    name: 'Care Certificate',
    description: 'Completed Care Certificate or commitment to complete',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT', 'ONBOARDING'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  NVQ_QUALIFICATION: {
    id: 'nvq_qualification',
    name: 'NVQ/QCF Health & Social Care',
    description: 'Level 2/3/4/5 qualification in Health & Social Care',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['APPLICATION', 'ONGOING'] as ComplianceStage[],
    required: false,
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  MANDATORY_TRAINING: {
    id: 'mandatory_training',
    name: 'Mandatory Training Certificates',
    description: 'All mandatory training certifications',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['ONBOARDING', 'ONGOING'] as ComplianceStage[],
    required: true,
    hasExpiry: true,
    expiryWarningDays: 30,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 20,
    subTypes: [
      { id: 'safeguarding_adults', name: 'Safeguarding Adults', renewalMonths: 12 },
      { id: 'safeguarding_children', name: 'Safeguarding Children', renewalMonths: 12 },
      { id: 'health_safety', name: 'Health & Safety', renewalMonths: 12 },
      { id: 'fire_safety', name: 'Fire Safety', renewalMonths: 12 },
      { id: 'first_aid', name: 'First Aid', renewalMonths: 36 },
      { id: 'manual_handling', name: 'Manual Handling', renewalMonths: 12 },
      { id: 'medication_admin', name: 'Medication Administration', renewalMonths: 12 },
      { id: 'infection_control', name: 'Infection Control', renewalMonths: 12 },
      { id: 'mental_capacity', name: 'Mental Capacity Act', renewalMonths: 12 },
      { id: 'deprivation_liberty', name: 'DoLS', renewalMonths: 12 },
      { id: 'food_hygiene', name: 'Food Hygiene', renewalMonths: 36 },
      { id: 'gdpr_data', name: 'GDPR & Data Protection', renewalMonths: 12 },
      { id: 'equality_diversity', name: 'Equality & Diversity', renewalMonths: 24 },
      { id: 'dementia_awareness', name: 'Dementia Awareness', renewalMonths: 12 },
      { id: 'end_of_life', name: 'End of Life Care', renewalMonths: 24 },
    ],
  },
  
  // Health & Fitness
  HEALTH_DECLARATION: {
    id: 'health_declaration',
    name: 'Health Declaration Form',
    description: 'Self-declaration of fitness to work',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  OCCUPATIONAL_HEALTH: {
    id: 'occupational_health',
    name: 'Occupational Health Clearance',
    description: 'OH assessment clearance for role',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT'] as ComplianceStage[],
    required: false,
    conditionalOn: 'health_declaration_flagged',
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  IMMUNIZATION_RECORDS: {
    id: 'immunization_records',
    name: 'Immunization Records',
    description: 'Hepatitis B, TB, and other vaccinations',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT', 'ONGOING'] as ComplianceStage[],
    required: true,
    hasExpiry: true,
    expiryWarningDays: 60,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  
  // Professional Registration (for nurses)
  NMC_PIN: {
    id: 'nmc_pin',
    name: 'NMC PIN Registration',
    description: 'Nursing & Midwifery Council registration',
    authority: 'CQC' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING'] as ComplianceStage[],
    required: false,
    conditionalOn: 'role_requires_nmc',
    hasExpiry: true,
    expiryWarningDays: 90,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
} as const;

// ============================================
// SHARED COMPLIANCE DOCUMENTS (Both Authorities)
// ============================================

export const SHARED_DOCUMENTS = {
  // Identity & References
  PHOTO_ID: {
    id: 'photo_id',
    name: 'Photo Identification',
    description: 'Photo ID for identity verification',
    authority: 'BOTH' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT'] as ComplianceStage[],
    required: true,
    hasExpiry: true,
    expiryWarningDays: 90,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
    homeOfficeRelevance: 'Identity verification for RTW',
    cqcRelevance: 'Fit and proper person identity check',
  },
  PROOF_OF_ADDRESS: {
    id: 'proof_of_address',
    name: 'Proof of Address',
    description: 'Utility bill or bank statement (within 3 months)',
    authority: 'BOTH' as ComplianceAuthority,
    stages: ['APPLICATION', 'PRE_EMPLOYMENT'] as ComplianceStage[],
    required: true,
    hasExpiry: true,
    expiryWarningDays: 30, // Must be recent
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
    homeOfficeRelevance: 'Address verification for records',
    cqcRelevance: 'DBS application requirement',
  },
  EMPLOYMENT_REFERENCES: {
    id: 'employment_references',
    name: 'Employment References',
    description: 'Professional references (minimum 2, covering 5 years)',
    authority: 'BOTH' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
    minimumCount: 2,
    yearsToCovers: 5,
    homeOfficeRelevance: 'Employment history verification',
    cqcRelevance: 'Fit and proper person check - character references',
  },
  CV_RESUME: {
    id: 'cv_resume',
    name: 'CV / Resume',
    description: 'Full employment history',
    authority: 'BOTH' as ComplianceAuthority,
    stages: ['APPLICATION'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSizeMB: 5,
    homeOfficeRelevance: 'Employment history for sponsor checks',
    cqcRelevance: 'Experience and qualifications review',
  },
  GAPS_EXPLANATION: {
    id: 'gaps_explanation',
    name: 'Employment Gaps Explanation',
    description: 'Written explanation for any gaps in employment',
    authority: 'BOTH' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT'] as ComplianceStage[],
    required: false,
    conditionalOn: 'has_employment_gaps',
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSizeMB: 5,
    homeOfficeRelevance: 'Required for sponsored workers',
    cqcRelevance: 'Fit and proper person - full history check',
  },
  
  // Contract & Policies
  SIGNED_CONTRACT: {
    id: 'signed_contract',
    name: 'Signed Employment Contract',
    description: 'Fully executed employment contract',
    authority: 'BOTH' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT', 'ONBOARDING'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf'],
    maxSizeMB: 10,
    homeOfficeRelevance: 'Required for sponsorship compliance',
    cqcRelevance: 'Employment terms documentation',
  },
  POLICY_ACKNOWLEDGEMENTS: {
    id: 'policy_acknowledgements',
    name: 'Policy Acknowledgement Forms',
    description: 'Signed acknowledgement of company policies',
    authority: 'BOTH' as ComplianceAuthority,
    stages: ['ONBOARDING'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
    homeOfficeRelevance: 'Compliance with sponsor duties',
    cqcRelevance: 'Staff awareness of safeguarding policies',
  },
} as const;

// ============================================
// INTERNAL DOCUMENTS (Not compliance-specific)
// ============================================

export const INTERNAL_DOCUMENTS = {
  APPLICATION_FORM: {
    id: 'application_form',
    name: 'Application Form',
    description: 'Completed job application',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['APPLICATION'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSizeMB: 5,
  },
  INTERVIEW_NOTES: {
    id: 'interview_notes',
    name: 'Interview Notes',
    description: 'Interview assessment and notes',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['APPLICATION'] as ComplianceStage[],
    required: false,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSizeMB: 5,
  },
  OFFER_LETTER: {
    id: 'offer_letter',
    name: 'Offer Letter',
    description: 'Formal offer of employment',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['PRE_EMPLOYMENT'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf'],
    maxSizeMB: 5,
  },
  PAYROLL_DETAILS: {
    id: 'payroll_details',
    name: 'Payroll & Bank Details',
    description: 'Bank details for salary payments',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['ONBOARDING'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
  },
  EMERGENCY_CONTACTS: {
    id: 'emergency_contacts',
    name: 'Emergency Contact Form',
    description: 'Emergency contact details',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['ONBOARDING'] as ComplianceStage[],
    required: true,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 2,
  },
  PERFORMANCE_REVIEWS: {
    id: 'performance_reviews',
    name: 'Performance Review Documents',
    description: 'Annual/periodic performance reviews',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['ONGOING'] as ComplianceStage[],
    required: false,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSizeMB: 10,
  },
  DISCIPLINARY_RECORDS: {
    id: 'disciplinary_records',
    name: 'Disciplinary Records',
    description: 'Any disciplinary actions or warnings',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['ONGOING'] as ComplianceStage[],
    required: false,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf'],
    maxSizeMB: 10,
  },
  RESIGNATION_LETTER: {
    id: 'resignation_letter',
    name: 'Resignation Letter',
    description: 'Employee resignation notice',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['OFFBOARDING'] as ComplianceStage[],
    required: false,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSizeMB: 5,
  },
  EXIT_INTERVIEW: {
    id: 'exit_interview',
    name: 'Exit Interview Notes',
    description: 'Exit interview documentation',
    authority: 'INTERNAL' as ComplianceAuthority,
    stages: ['OFFBOARDING'] as ComplianceStage[],
    required: false,
    hasExpiry: false,
    verificationRequired: false,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSizeMB: 5,
  },
} as const;

// ============================================
// COMBINED DOCUMENT REGISTRY
// ============================================

export const ALL_COMPLIANCE_DOCUMENTS = {
  ...HOME_OFFICE_DOCUMENTS,
  ...CQC_DOCUMENTS,
  ...SHARED_DOCUMENTS,
  ...INTERNAL_DOCUMENTS,
} as const;

export type DocumentTypeId = keyof typeof ALL_COMPLIANCE_DOCUMENTS;

// ============================================
// FOLDER STRUCTURE
// ============================================

export const COMPLIANCE_FOLDER_STRUCTURE = {
  HOME_OFFICE: {
    name: 'Home Office Compliance',
    color: '#1e40af', // Blue
    icon: 'building-2',
    subfolders: [
      { id: 'right_to_work', name: 'Right to Work', documents: ['rtw_passport', 'rtw_visa', 'rtw_brp', 'rtw_share_code', 'rtw_check_result', 'birth_certificate'] },
      { id: 'identity', name: 'Identity Documents', documents: ['national_insurance'] },
      { id: 'sponsor_compliance', name: 'Sponsor Compliance', documents: ['signed_contract', 'policy_acknowledgements'] },
    ],
  },
  CQC: {
    name: 'CQC Compliance',
    color: '#059669', // Green
    icon: 'shield-check',
    subfolders: [
      { id: 'dbs_safeguarding', name: 'DBS & Safeguarding', documents: ['dbs_certificate', 'dbs_update_service'] },
      { id: 'qualifications', name: 'Qualifications', documents: ['care_certificate', 'nvq_qualification', 'nmc_pin'] },
      { id: 'mandatory_training', name: 'Mandatory Training', documents: ['mandatory_training'] },
      { id: 'health_fitness', name: 'Health & Fitness', documents: ['health_declaration', 'occupational_health', 'immunization_records'] },
    ],
  },
  SHARED: {
    name: 'Shared Compliance',
    color: '#7c3aed', // Purple
    icon: 'folder-sync',
    subfolders: [
      { id: 'identity_verification', name: 'Identity & Verification', documents: ['photo_id', 'proof_of_address'] },
      { id: 'references', name: 'References & History', documents: ['employment_references', 'cv_resume', 'gaps_explanation'] },
      { id: 'contracts', name: 'Contracts & Policies', documents: ['signed_contract', 'policy_acknowledgements'] },
    ],
  },
  INTERNAL: {
    name: 'Internal HR Documents',
    color: '#6b7280', // Gray
    icon: 'folder',
    subfolders: [
      { id: 'recruitment', name: 'Recruitment', documents: ['application_form', 'interview_notes', 'offer_letter'] },
      { id: 'onboarding', name: 'Onboarding', documents: ['payroll_details', 'emergency_contacts'] },
      { id: 'employment', name: 'Employment Records', documents: ['performance_reviews', 'disciplinary_records'] },
      { id: 'offboarding', name: 'Offboarding', documents: ['resignation_letter', 'exit_interview'] },
    ],
  },
} as const;

// ============================================
// COMPLIANCE CHECKLIST BY STAGE
// ============================================

export const STAGE_REQUIREMENTS = {
  APPLICATION: {
    name: 'Application Stage',
    description: 'Documents required when applying',
    requiredDocs: ['cv_resume', 'photo_id', 'application_form'],
    optionalDocs: ['nvq_qualification', 'nmc_pin', 'rtw_passport', 'birth_certificate'],
    automatedChecks: ['duplicate_application_check', 'basic_eligibility_check'],
  },
  PRE_EMPLOYMENT: {
    name: 'Pre-Employment Stage',
    description: 'Documents required after offer, before start date',
    requiredDocs: [
      'rtw_passport', 'rtw_check_result', 'national_insurance',
      'dbs_certificate', 'health_declaration', 'employment_references',
      'proof_of_address', 'signed_contract', 'offer_letter'
    ],
    conditionalDocs: ['rtw_visa', 'rtw_brp', 'rtw_share_code', 'occupational_health', 'gaps_explanation', 'nmc_pin'],
    automatedChecks: ['rtw_verification', 'dbs_status_check', 'reference_chase', 'document_expiry_check'],
  },
  ONBOARDING: {
    name: 'Onboarding Stage',
    description: 'Documents required in first weeks',
    requiredDocs: [
      'care_certificate', 'mandatory_training', 'immunization_records',
      'policy_acknowledgements', 'payroll_details', 'emergency_contacts'
    ],
    optionalDocs: ['dbs_update_service'],
    automatedChecks: ['training_completion_check', 'induction_checklist'],
  },
  ONGOING: {
    name: 'Ongoing Employment',
    description: 'Documents requiring regular renewal/monitoring',
    monitoredDocs: [
      'rtw_visa', 'rtw_brp', 'dbs_certificate', 'dbs_update_service',
      'mandatory_training', 'immunization_records', 'nmc_pin'
    ],
    automatedChecks: ['expiry_monitoring', 'training_renewal_reminders', 'annual_rtw_check'],
  },
  OFFBOARDING: {
    name: 'Offboarding Stage',
    description: 'Documents for leaving employees',
    requiredDocs: ['resignation_letter'],
    optionalDocs: ['exit_interview'],
    automatedChecks: ['final_compliance_audit', 'document_archival'],
  },
} as const;

// ============================================
// AUTOMATED WORKFLOW TRIGGERS
// ============================================

export const COMPLIANCE_AUTOMATIONS = {
  // Document Expiry Alerts
  EXPIRY_ALERT_90_DAYS: {
    id: 'expiry_alert_90',
    trigger: 'document_expiry',
    daysBeforeExpiry: 90,
    action: 'send_reminder',
    recipients: ['employee', 'hr_manager'],
    urgency: 'LOW' as UrgencyLevel,
  },
  EXPIRY_ALERT_30_DAYS: {
    id: 'expiry_alert_30',
    trigger: 'document_expiry',
    daysBeforeExpiry: 30,
    action: 'send_reminder',
    recipients: ['employee', 'hr_manager', 'compliance_officer'],
    urgency: 'MEDIUM' as UrgencyLevel,
  },
  EXPIRY_ALERT_7_DAYS: {
    id: 'expiry_alert_7',
    trigger: 'document_expiry',
    daysBeforeExpiry: 7,
    action: 'send_urgent_reminder',
    recipients: ['employee', 'hr_manager', 'compliance_officer', 'operations_manager'],
    urgency: 'HIGH' as UrgencyLevel,
  },
  EXPIRY_ALERT_EXPIRED: {
    id: 'expiry_alert_expired',
    trigger: 'document_expired',
    daysBeforeExpiry: 0,
    action: 'escalate_and_restrict',
    recipients: ['employee', 'hr_manager', 'compliance_officer', 'operations_manager', 'registered_manager'],
    urgency: 'CRITICAL' as UrgencyLevel,
  },

  // Stage Progression
  AUTO_STAGE_PROGRESS: {
    id: 'auto_stage_progress',
    trigger: 'all_stage_docs_complete',
    action: 'progress_to_next_stage',
    notification: true,
  },

  // Reference Chasing
  REFERENCE_CHASE_DAY_3: {
    id: 'reference_chase_3',
    trigger: 'reference_not_received',
    daysAfterRequest: 3,
    action: 'send_chase_email',
    recipients: ['referee'],
  },
  REFERENCE_CHASE_DAY_7: {
    id: 'reference_chase_7',
    trigger: 'reference_not_received',
    daysAfterRequest: 7,
    action: 'send_chase_email',
    recipients: ['referee', 'applicant'],
  },

  // RTW Follow-up
  RTW_ANNUAL_CHECK: {
    id: 'rtw_annual_check',
    trigger: 'scheduled',
    frequency: 'annual',
    action: 'trigger_rtw_verification',
    applicableTo: 'limited_rtw_employees',
  },

  // Training Reminders
  TRAINING_RENEWAL_REMINDER: {
    id: 'training_renewal',
    trigger: 'training_expiry',
    daysBeforeExpiry: 30,
    action: 'book_training_session',
    autoAssign: true,
  },
} as const;

// ============================================
// COMPLIANCE SCORING
// ============================================

export interface ComplianceScore {
  overall: number;          // 0-100
  homeOffice: number;       // 0-100
  cqc: number;              // 0-100
  critical: number;         // Count of critical issues
  high: number;             // Count of high priority issues
  medium: number;           // Count of medium priority issues
  low: number;              // Count of low priority issues
  status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
}

export function calculateComplianceScore(
  documents: Array<{ typeId: string; status: DocumentStatus; authority: ComplianceAuthority }>
): ComplianceScore {
  const homeOfficeDocs = documents.filter(d => d.authority === 'HOME_OFFICE' || d.authority === 'BOTH');
  const cqcDocs = documents.filter(d => d.authority === 'CQC' || d.authority === 'BOTH');

  const calculateAuthorityScore = (docs: typeof documents): number => {
    if (docs.length === 0) return 100;
    const verified = docs.filter(d => d.status === 'VERIFIED').length;
    return Math.round((verified / docs.length) * 100);
  };

  const homeOfficeScore = calculateAuthorityScore(homeOfficeDocs);
  const cqcScore = calculateAuthorityScore(cqcDocs);
  const overallScore = Math.round((homeOfficeScore + cqcScore) / 2);

  const critical = documents.filter(d => d.status === 'EXPIRED' || d.status === 'REJECTED').length;
  const high = documents.filter(d => d.status === 'EXPIRING_SOON').length;
  const medium = documents.filter(d => d.status === 'PENDING' || d.status === 'UNDER_REVIEW').length;
  const low = documents.filter(d => d.status === 'UPLOADED').length;

  let status: ComplianceScore['status'] = 'COMPLIANT';
  if (critical > 0) status = 'NON_COMPLIANT';
  else if (high > 0 || medium > 2) status = 'AT_RISK';

  return {
    overall: overallScore,
    homeOffice: homeOfficeScore,
    cqc: cqcScore,
    critical,
    high,
    medium,
    low,
    status,
  };
}

export default ALL_COMPLIANCE_DOCUMENTS;
