/**
 * Comprehensive Compliance Management Service
 * 
 * Handles all compliance operations from application through employment lifecycle
 * - Document management with automatic classification
 * - Compliance tracking and scoring
 * - Automated workflows and reminders
 * - Cross-app synchronization
 */

import { supabase } from '../supabase';
import {
  ALL_COMPLIANCE_DOCUMENTS,
  COMPLIANCE_FOLDER_STRUCTURE,
  STAGE_REQUIREMENTS,
  COMPLIANCE_AUTOMATIONS,
  ComplianceAuthority,
  ComplianceStage,
  DocumentStatus,
  UrgencyLevel,
  calculateComplianceScore
} from './complianceTypes';
import { log } from '../logger';

// ===========================================
// TYPES
// ===========================================

export interface CompliancePerson {
  id: string;
  tenant_id: string;
  external_applicant_id?: string;
  external_employee_id?: string;
  person_type: 'APPLICANT' | 'CANDIDATE' | 'NEW_HIRE' | 'EMPLOYEE' | 'FORMER_EMPLOYEE';
  current_stage: ComplianceStage;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  has_indefinite_leave?: boolean;
  visa_type?: string;
  visa_expiry_date?: string;
  share_code?: string;
  brp_number?: string;
  national_insurance_number?: string;
  job_title?: string;
  department?: string;
  requires_nmc?: boolean;
  nmc_pin?: string;
  overall_compliance_score: number;
  home_office_score: number;
  cqc_score: number;
  compliance_status: string;
  application_date?: string;
  offer_date?: string;
  start_date?: string;
  end_date?: string;
  synced_to_careflow?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocument {
  id: string;
  tenant_id: string;
  person_id: string;
  document_type_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: DocumentStatus;
  authority: ComplianceAuthority;
  applicable_stages: ComplianceStage[];
  uploaded_at: string;
  issue_date?: string;
  expiry_date?: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  verification_notes?: string;
  version: number;
  is_current: boolean;
  auto_classified?: boolean;
  classification_confidence?: number;
  detected_expiry_date?: string;
  extracted_data?: Record<string, any>;
  storage_bucket?: string;
  storage_path?: string;
  compliance_document_folders?: { folder_id: string }[];
}

export interface ComplianceChecklistItem {
  id: string;
  tenant_id: string;
  person_id: string;
  document_type_id: string;
  status: DocumentStatus;
  is_required: boolean;
  is_applicable: boolean;
  stage: ComplianceStage;
  authority: ComplianceAuthority;
  document_id?: string;
  due_date?: string;
  completed_date?: string;
  notes?: string;
  waiver_reason?: string;
}

export interface ComplianceTask {
  id: string;
  tenant_id: string;
  person_id?: string;
  document_id?: string;
  task_type: string;
  title: string;
  description?: string;
  urgency: UrgencyLevel;
  status: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  is_automated: boolean;
}

export interface ComplianceFolder {
  id: string;
  tenant_id: string;
  parent_folder_id?: string;
  name: string;
  authority: ComplianceAuthority;
  color?: string;
  icon?: string;
  sort_order: number;
  auto_assign_document_types?: string[];
  is_system_folder: boolean;
  documents?: ComplianceDocument[];
  subfolders?: ComplianceFolder[];
}

// ===========================================
// COMPLIANCE SERVICE CLASS
// ===========================================

class ComplianceService {
  // =========================================
  // PERSON MANAGEMENT
  // =========================================

  /**
   * Create a compliance person record directly (standalone - no external dependencies)
   */
  async createPerson(personData: {
    tenantId: string;
    fullName: string;
    email: string;
    phone?: string;
    nationality?: string;
    jobTitle?: string;
    department?: string;
    externalApplicantId?: string;
  }): Promise<CompliancePerson | null> {
    try {
      // Create compliance person
      const { data: person, error: personError } = await supabase
        .from('compliance_persons')
        .insert({
          tenant_id: personData.tenantId,
          external_applicant_id: personData.externalApplicantId,
          person_type: 'APPLICANT',
          current_stage: 'APPLICATION',
          full_name: personData.fullName,
          email: personData.email,
          phone: personData.phone,
          nationality: personData.nationality,
          job_title: personData.jobTitle,
          department: personData.department,
          application_date: new Date().toISOString(),
          compliance_status: 'PENDING'
        })
        .select()
        .single();

      if (personError) {
        log.error('Failed to create compliance person', personError, { component: 'ComplianceService', action: 'createPerson', metadata: { personData } });
        return null;
      }

      // Initialize checklist items for APPLICATION stage
      await this.initializeChecklist(person.id, personData.tenantId, 'APPLICATION');

      // Create default folder structure
      await this.ensureFolderStructure(personData.tenantId);

      return person;
    } catch (error) {
      log.error('Error creating compliance person', error, { component: 'ComplianceService', action: 'createPerson' });
      return null;
    }
  }

  /**
   * Create a compliance person record from an existing applicant (if applicants table exists)
   * Falls back to direct creation if applicants table doesn't exist
   */
  async createFromApplicant(applicantId: string, tenantId: string): Promise<CompliancePerson | null> {
    try {
      // Try to get applicant details from applicants table
      const { data: applicant, error: applicantError } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', applicantId)
        .single();

      if (applicantError || !applicant) {
        // Applicants table might not exist - log but continue
        log.warn('Could not fetch from applicants table', { component: 'ComplianceService', action: 'createFromApplicant', metadata: { applicantId, error: applicantError?.message } });
        // Return null to indicate caller should use createPerson() directly
        return null;
      }

      // Create compliance person linked to applicant
      return this.createPerson({
        tenantId,
        fullName: applicant.full_name || `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim(),
        email: applicant.email,
        phone: applicant.phone,
        nationality: applicant.nationality,
        externalApplicantId: applicantId
      });
    } catch (error) {
      log.error('Error creating compliance person from applicant', error, { component: 'ComplianceService', action: 'createFromApplicant', metadata: { applicantId } });
      return null;
    }
  }

  /**
   * Progress a person to the next stage
   */
  async progressToNextStage(personId: string): Promise<{ success: boolean; newStage?: ComplianceStage; message: string }> {
    try {
      // Get current person
      const { data: person, error } = await supabase
        .from('compliance_persons')
        .select('*')
        .eq('id', personId)
        .single();

      if (error || !person) {
        return { success: false, message: 'Person not found' };
      }

      // Check if all required documents are verified
      const { data: pendingItems } = await supabase
        .from('compliance_checklists')
        .select('*')
        .eq('person_id', personId)
        .eq('stage', person.current_stage)
        .eq('is_required', true)
        .eq('is_applicable', true)
        .neq('status', 'VERIFIED');

      if (pendingItems && pendingItems.length > 0) {
        return {
          success: false,
          message: `Cannot progress: ${pendingItems.length} required documents still pending`
        };
      }

      // Determine next stage
      const stageOrder: ComplianceStage[] = ['APPLICATION', 'PRE_EMPLOYMENT', 'ONBOARDING', 'ONGOING'];
      const currentIndex = stageOrder.indexOf(person.current_stage);

      if (currentIndex >= stageOrder.length - 1) {
        return { success: false, message: 'Already at final stage' };
      }

      const nextStage = stageOrder[currentIndex + 1];

      // Update person stage
      const { error: updateError } = await supabase
        .from('compliance_persons')
        .update({
          current_stage: nextStage,
          person_type: this.getPersonTypeForStage(nextStage),
          updated_at: new Date().toISOString()
        })
        .eq('id', personId);

      if (updateError) {
        return { success: false, message: 'Failed to update stage' };
      }

      // Log stage transition
      await supabase.from('compliance_stage_history').insert({
        tenant_id: person.tenant_id,
        person_id: personId,
        from_stage: person.current_stage,
        to_stage: nextStage,
        auto_progressed: false,
        progress_reason: 'Manual progression - all requirements met'
      });

      // Initialize checklist for new stage
      await this.initializeChecklist(personId, person.tenant_id, nextStage);

      return { success: true, newStage: nextStage, message: `Progressed to ${nextStage}` };
    } catch (error) {
      log.error('Error progressing stage', error, { component: 'ComplianceService', action: 'progressToNextStage', metadata: { personId } });
      return { success: false, message: 'Internal error' };
    }
  }

  /**
   * Convert applicant to employee
   */
  async convertToEmployee(personId: string, employeeData: Partial<CompliancePerson>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('compliance_persons')
        .update({
          ...employeeData,
          person_type: 'EMPLOYEE',
          current_stage: 'ONGOING',
          start_date: employeeData.start_date || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', personId);

      if (error) {
        console.error('Failed to convert to employee:', error);
        return false;
      }

      // Trigger sync to CareFlow
      await this.syncToCareFlow(personId);

      return true;
    } catch (error) {
      log.error('Error converting to employee', error, { component: 'ComplianceService', action: 'convertToEmployee', metadata: { personId } });
      return false;
    }
  }

  private getPersonTypeForStage(stage: ComplianceStage): string {
    switch (stage) {
      case 'APPLICATION': return 'APPLICANT';
      case 'PRE_EMPLOYMENT': return 'CANDIDATE';
      case 'ONBOARDING': return 'NEW_HIRE';
      case 'ONGOING': return 'EMPLOYEE';
      case 'OFFBOARDING': return 'FORMER_EMPLOYEE';
      default: return 'APPLICANT';
    }
  }

  // =========================================
  // DOCUMENT MANAGEMENT
  // =========================================

  /**
   * Upload a compliance document with automatic classification
   */
  async uploadDocument(
    personId: string,
    tenantId: string,
    file: File,
    documentTypeId?: string,
    metadata?: Partial<ComplianceDocument>
  ): Promise<ComplianceDocument | null> {
    try {
      // Determine storage bucket based on document type
      const bucket = this.getStorageBucket(documentTypeId);
      const filePath = `${tenantId}/${personId}/${Date.now()}_${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload failed:', uploadError);
        return null;
      }

      // Get document type info
      const docType = documentTypeId ? ALL_COMPLIANCE_DOCUMENTS[documentTypeId as keyof typeof ALL_COMPLIANCE_DOCUMENTS] : null;

      // Create document record
      const documentData: Partial<ComplianceDocument> = {
        tenant_id: tenantId,
        person_id: personId,
        document_type_id: documentTypeId || 'unknown',
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'UPLOADED',
        authority: docType?.authority || 'INTERNAL',
        applicable_stages: docType?.stages || ['APPLICATION'],
        uploaded_at: new Date().toISOString(),
        version: 1,
        is_current: true,
        storage_bucket: bucket,
        storage_path: filePath,
        ...metadata
      };

      const { data: document, error: insertError } = await supabase
        .from('compliance_documents')
        .insert(documentData)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create document record:', insertError);
        return null;
      }

      // Auto-assign to appropriate folder
      await this.autoAssignToFolder(document);

      // Update checklist item
      await this.updateChecklistWithDocument(personId, documentTypeId, document.id);

      // If document has expiry, schedule reminders
      if (document.expiry_date) {
        await this.scheduleExpiryReminders(document);
      }

      return document;
    } catch (error) {
      log.error('Error uploading document', error, { component: 'ComplianceService', action: 'uploadDocument', metadata: { personId, documentTypeId } });
      return null;
    }
  }

  /**
   * Verify a document
   */
  async verifyDocument(
    documentId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { data: document, error: fetchError } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        return false;
      }

      const { error: updateError } = await supabase
        .from('compliance_documents')
        .update({
          status: 'VERIFIED',
          verified_at: new Date().toISOString(),
          verified_by: verifiedBy,
          verification_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        return false;
      }

      // Update corresponding checklist item
      await supabase
        .from('compliance_checklists')
        .update({
          status: 'VERIFIED',
          completed_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId);

      // Check if this enables stage progression
      await this.checkAutoProgression(document.person_id);

      // Log audit
      await this.logAudit('DOCUMENT_VERIFIED', 'compliance_documents', documentId, {
        verified_by: verifiedBy,
        notes
      });

      return true;
    } catch (error) {
      log.error('Error verifying document', error, { component: 'ComplianceService', action: 'verifyDocument', metadata: { documentId } });
      return false;
    }
  }

  /**
   * Reject a document
   */
  async rejectDocument(
    documentId: string,
    rejectedBy: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('compliance_documents')
        .update({
          status: 'REJECTED',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        return false;
      }

      // Update checklist
      await supabase
        .from('compliance_checklists')
        .update({
          status: 'REJECTED',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId);

      // Create task for re-upload
      const { data: document } = await supabase
        .from('compliance_documents')
        .select('*, compliance_persons(*)')
        .eq('id', documentId)
        .single();

      if (document) {
        await this.createTask({
          tenant_id: document.tenant_id,
          person_id: document.person_id,
          document_id: documentId,
          task_type: 'DOCUMENT_REUPLOAD',
          title: `Re-upload required: ${document.file_name}`,
          description: `Document rejected. Reason: ${reason}`,
          urgency: 'HIGH',
          is_automated: true
        });

        // Send notification
        await this.sendNotification({
          tenant_id: document.tenant_id,
          person_id: document.person_id,
          document_id: documentId,
          type: 'DOCUMENT_REJECTED',
          urgency: 'HIGH',
          title: 'Document Rejected',
          message: `Your ${document.file_name} has been rejected. Reason: ${reason}`
        });
      }

      return true;
    } catch (error) {
      log.error('Error rejecting document', error, { component: 'ComplianceService', action: 'rejectDocument', metadata: { documentId } });
      return false;
    }
  }

  /**
   * Get documents organized by authority (Home Office vs CQC)
   */
  async getDocumentsByAuthority(personId: string): Promise<{
    homeOffice: ComplianceDocument[];
    cqc: ComplianceDocument[];
    shared: ComplianceDocument[];
    internal: ComplianceDocument[];
  }> {
    try {
      const { data: documents, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('person_id', personId)
        .eq('is_current', true)
        .order('uploaded_at', { ascending: false });

      if (error || !documents) {
        return { homeOffice: [], cqc: [], shared: [], internal: [] };
      }

      return {
        homeOffice: documents.filter(d => d.authority === 'HOME_OFFICE'),
        cqc: documents.filter(d => d.authority === 'CQC'),
        shared: documents.filter(d => d.authority === 'BOTH'),
        internal: documents.filter(d => d.authority === 'INTERNAL')
      };
    } catch (error) {
      log.error('Error getting documents by authority', error, { component: 'ComplianceService', action: 'getDocumentsByAuthority', metadata: { personId } });
      return { homeOffice: [], cqc: [], shared: [], internal: [] };
    }
  }

  private getStorageBucket(documentTypeId?: string): string {
    if (!documentTypeId) return 'compliance-documents';

    const docType = ALL_COMPLIANCE_DOCUMENTS[documentTypeId as keyof typeof ALL_COMPLIANCE_DOCUMENTS];
    if (!docType) return 'compliance-documents';

    switch (docType.authority) {
      case 'HOME_OFFICE':
        return 'home-office-compliance';
      case 'CQC':
        return 'cqc-compliance';
      case 'BOTH':
        return 'shared-compliance';
      default:
        return 'hr-documents';
    }
  }

  // =========================================
  // FOLDER MANAGEMENT
  // =========================================

  /**
   * Ensure default folder structure exists for tenant
   */
  async ensureFolderStructure(tenantId: string): Promise<void> {
    try {
      // Check if folders exist
      const { data: existingFolders } = await supabase
        .from('compliance_folders')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_system_folder', true);

      if (existingFolders && existingFolders.length > 0) {
        return; // Already initialized
      }

      // Create root folders for each authority
      for (const [key, folderDef] of Object.entries(COMPLIANCE_FOLDER_STRUCTURE)) {
        const authority = key as ComplianceAuthority;

        // Create root folder
        const { data: rootFolder, error: rootError } = await supabase
          .from('compliance_folders')
          .insert({
            tenant_id: tenantId,
            name: folderDef.name,
            authority: authority,
            color: folderDef.color,
            icon: folderDef.icon,
            is_system_folder: true,
            sort_order: Object.keys(COMPLIANCE_FOLDER_STRUCTURE).indexOf(key)
          })
          .select()
          .single();

        if (rootError || !rootFolder) continue;

        // Create subfolders
        for (const subfolder of folderDef.subfolders) {
          await supabase.from('compliance_folders').insert({
            tenant_id: tenantId,
            parent_folder_id: rootFolder.id,
            name: subfolder.name,
            authority: authority,
            color: folderDef.color,
            is_system_folder: true,
            auto_assign_document_types: subfolder.documents as any,
            sort_order: (folderDef.subfolders as any).indexOf(subfolder)
          });
        }
      }
    } catch (error) {
      log.error('Error creating folder structure', error, { component: 'ComplianceService', action: 'ensureFolderStructure', metadata: { tenantId } });
    }
  }

  /**
   * Get folder structure with documents
   */
  async getFolderStructure(tenantId: string, personId?: string): Promise<ComplianceFolder[]> {
    try {
      // Get all folders
      const { data: folders, error: folderError } = await supabase
        .from('compliance_folders')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order');

      if (folderError || !folders) {
        return [];
      }

      // Get documents if personId provided
      let documents: ComplianceDocument[] = [];
      if (personId) {
        const { data: docs } = await supabase
          .from('compliance_documents')
          .select('*, compliance_document_folders(*)')
          .eq('person_id', personId)
          .eq('is_current', true);

        documents = docs || [];
      }

      // Build folder tree
      const rootFolders = folders.filter(f => !f.parent_folder_id);

      return rootFolders.map(root => ({
        ...root,
        subfolders: folders
          .filter(f => f.parent_folder_id === root.id)
          .map(sub => ({
            ...sub,
            documents: documents.filter(d =>
              d.compliance_document_folders?.some((df: any) => df.folder_id === sub.id)
            )
          })),
        documents: documents.filter(d =>
          d.compliance_document_folders?.some((df: any) => df.folder_id === root.id)
        )
      }));
    } catch (error) {
      log.error('Error getting folder structure', error, { component: 'ComplianceService', action: 'getFolderStructure', metadata: { tenantId, personId } });
      return [];
    }
  }

  /**
   * Auto-assign document to appropriate folder
   */
  private async autoAssignToFolder(document: ComplianceDocument): Promise<void> {
    try {
      // Find folder that has this document type in auto_assign
      const { data: folder } = await supabase
        .from('compliance_folders')
        .select('id')
        .eq('tenant_id', document.tenant_id)
        .contains('auto_assign_document_types', [document.document_type_id])
        .single();

      if (folder) {
        await supabase.from('compliance_document_folders').insert({
          document_id: document.id,
          folder_id: folder.id
        });
      }
    } catch (error) {
      log.error('Error auto-assigning folder', error, { component: 'ComplianceService', action: 'autoAssignToFolder', metadata: { documentId: document.id } });
    }
  }

  // =========================================
  // CHECKLIST MANAGEMENT
  // =========================================

  /**
   * Initialize checklist items for a stage
   */
  async initializeChecklist(personId: string, tenantId: string, stage: ComplianceStage): Promise<void> {
    try {
      const stageReqs = STAGE_REQUIREMENTS[stage];
      if (!stageReqs) return;

      const checklistItems: Partial<ComplianceChecklistItem>[] = [];

      // Add required documents
      const requiredDocs = (stageReqs as any).requiredDocs || (stageReqs as any).monitoredDocs || [];
      for (const docTypeId of requiredDocs) {
        const docType = ALL_COMPLIANCE_DOCUMENTS[docTypeId as keyof typeof ALL_COMPLIANCE_DOCUMENTS];
        if (docType) {
          checklistItems.push({
            tenant_id: tenantId,
            person_id: personId,
            document_type_id: docTypeId,
            status: 'PENDING',
            is_required: true,
            is_applicable: true,
            stage: stage,
            authority: docType.authority
          });
        }
      }

      // Add optional documents
      const optionalDocs = (stageReqs as any).optionalDocs || [];
      for (const docTypeId of optionalDocs) {
        const docType = ALL_COMPLIANCE_DOCUMENTS[docTypeId as keyof typeof ALL_COMPLIANCE_DOCUMENTS];
        if (docType) {
          checklistItems.push({
            tenant_id: tenantId,
            person_id: personId,
            document_type_id: docTypeId,
            status: 'PENDING',
            is_required: false,
            is_applicable: true,
            stage: stage,
            authority: docType.authority
          });
        }
      }

      // Add conditional documents
      const conditionalDocs = (stageReqs as any).conditionalDocs || [];
      for (const docTypeId of conditionalDocs) {
        const docType = ALL_COMPLIANCE_DOCUMENTS[docTypeId as keyof typeof ALL_COMPLIANCE_DOCUMENTS];
        if (docType) {
          checklistItems.push({
            tenant_id: tenantId,
            person_id: personId,
            document_type_id: docTypeId,
            status: 'PENDING',
            is_required: true, // Will be updated based on conditions
            is_applicable: false, // Will be updated based on conditions
            stage: stage,
            authority: docType.authority
          });
        }
      }

      // Insert all items (ignore conflicts)
      if (checklistItems.length > 0) {
        await supabase
          .from('compliance_checklists')
          .upsert(checklistItems, { onConflict: 'person_id,document_type_id,stage' });
      }
    } catch (error) {
      log.error('Error initializing checklist', error, { component: 'ComplianceService', action: 'initializeChecklist', metadata: { personId, stage } });
    }
  }

  /**
   * Get checklist for a person
   */
  async getChecklist(personId: string, stage?: ComplianceStage): Promise<ComplianceChecklistItem[]> {
    try {
      let query = supabase
        .from('compliance_checklists')
        .select('*, compliance_documents(*)')
        .eq('person_id', personId)
        .eq('is_applicable', true);

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query.order('is_required', { ascending: false });

      if (error) {
        log.error('Error getting checklist', error, { component: 'ComplianceService', action: 'getChecklist', metadata: { personId, stage } });
        return [];
      }

      return data || [];
    } catch (error) {
      log.error('Error getting checklist', error, { component: 'ComplianceService', action: 'getChecklist', metadata: { personId, stage } });
      return [];
    }
  }

  /**
   * Update checklist when document is uploaded
   */
  private async updateChecklistWithDocument(
    personId: string,
    documentTypeId: string | undefined,
    documentId: string
  ): Promise<void> {
    if (!documentTypeId) return;

    try {
      await supabase
        .from('compliance_checklists')
        .update({
          status: 'UPLOADED',
          document_id: documentId,
          updated_at: new Date().toISOString()
        })
        .eq('person_id', personId)
        .eq('document_type_id', documentTypeId);
    } catch (error) {
      log.error('Error updating checklist', error, { component: 'ComplianceService', action: 'updateChecklistWithDocument', metadata: { personId, documentId } });
    }
  }

  /**
   * Update conditional document applicability
   */
  async updateConditionalApplicability(
    personId: string,
    conditions: Record<string, boolean>
  ): Promise<void> {
    try {
      const { data: person } = await supabase
        .from('compliance_persons')
        .select('*')
        .eq('id', personId)
        .single();

      if (!person) return;

      // Update based on nationality (for visa/BRP requirements)
      if ('nationality' in conditions) {
        const needsVisa = !['British', 'Irish'].includes(person.nationality || '');

        await supabase
          .from('compliance_checklists')
          .update({ is_applicable: needsVisa })
          .eq('person_id', personId)
          .in('document_type_id', ['rtw_visa', 'rtw_brp', 'rtw_share_code']);
      }

      // Update based on role (for NMC requirements)
      if ('requires_nmc' in conditions) {
        await supabase
          .from('compliance_checklists')
          .update({ is_applicable: conditions.requires_nmc })
          .eq('person_id', personId)
          .eq('document_type_id', 'nmc_pin');
      }

      // Recalculate compliance score
      await this.recalculateComplianceScore(personId);
    } catch (error) {
      log.error('Error updating conditional applicability', error, { component: 'ComplianceService', action: 'updateConditionalApplicability', metadata: { personId, conditions } });
    }
  }

  // =========================================
  // COMPLIANCE SCORING
  // =========================================

  /**
   * Recalculate and update compliance score
   */
  async recalculateComplianceScore(personId: string): Promise<void> {
    try {
      // Get all applicable checklist items
      const { data: items } = await supabase
        .from('compliance_checklists')
        .select('*')
        .eq('person_id', personId)
        .eq('is_applicable', true);

      if (!items) return;

      const documents = items.map(item => ({
        typeId: item.document_type_id,
        status: item.status,
        authority: item.authority
      }));

      const score = calculateComplianceScore(documents);

      await supabase
        .from('compliance_persons')
        .update({
          overall_compliance_score: score.overall,
          home_office_score: score.homeOffice,
          cqc_score: score.cqc,
          compliance_status: score.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', personId);
    } catch (error) {
      log.error('Error recalculating compliance score', error, { component: 'ComplianceService', action: 'recalculateComplianceScore', metadata: { personId } });
    }
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(tenantId: string): Promise<{
    totalPersons: number;
    compliant: number;
    atRisk: number;
    nonCompliant: number;
    expiringDocuments: number;
    pendingVerifications: number;
    byStage: Record<ComplianceStage, number>;
    recentActivity: any[];
  }> {
    try {
      // Get persons by status
      const { data: persons } = await supabase
        .from('compliance_persons')
        .select('*')
        .eq('tenant_id', tenantId);

      const personsList = persons || [];

      // Get expiring documents (next 30 days)
      const { data: expiringDocs } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_current', true)
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .gte('expiry_date', new Date().toISOString());

      // Get pending verifications
      const { data: pendingDocs } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'UPLOADED');

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Count by stage
      const byStage: Record<ComplianceStage, number> = {
        APPLICATION: 0,
        PRE_EMPLOYMENT: 0,
        ONBOARDING: 0,
        ONGOING: 0,
        OFFBOARDING: 0
      };

      personsList.forEach(p => {
        if (p.current_stage in byStage) {
          byStage[p.current_stage as ComplianceStage]++;
        }
      });

      return {
        totalPersons: personsList.length,
        compliant: personsList.filter(p => p.compliance_status === 'COMPLIANT').length,
        atRisk: personsList.filter(p => p.compliance_status === 'AT_RISK').length,
        nonCompliant: personsList.filter(p => p.compliance_status === 'NON_COMPLIANT').length,
        expiringDocuments: expiringDocs?.length || 0,
        pendingVerifications: pendingDocs?.length || 0,
        byStage,
        recentActivity: recentActivity || []
      };
    } catch (error) {
      log.error('Error getting dashboard', error, { component: 'ComplianceService', action: 'getComplianceDashboard', metadata: { tenantId } });
      return {
        totalPersons: 0,
        compliant: 0,
        atRisk: 0,
        nonCompliant: 0,
        expiringDocuments: 0,
        pendingVerifications: 0,
        byStage: {
          APPLICATION: 0,
          PRE_EMPLOYMENT: 0,
          ONBOARDING: 0,
          ONGOING: 0,
          OFFBOARDING: 0
        },
        recentActivity: []
      };
    }
  }

  // =========================================
  // AUTOMATION
  // =========================================

  /**
   * Check and auto-progress stage if requirements are met
   */
  private async checkAutoProgression(personId: string): Promise<void> {
    if (!COMPLIANCE_AUTOMATIONS.AUTO_STAGE_PROGRESS) return;

    try {
      const result = await this.progressToNextStage(personId);

      if (result.success && result.newStage) {
        // Log auto-progression
        await this.logAudit('AUTO_STAGE_PROGRESS', 'compliance_persons', personId, {
          newStage: result.newStage
        });
      }
    } catch (error) {
      log.error('Error in auto-progression', error, { component: 'ComplianceService', action: 'checkAutoProgression', metadata: { personId } });
    }
  }

  /**
   * Schedule expiry reminders for a document
   */
  private async scheduleExpiryReminders(document: ComplianceDocument): Promise<void> {
    if (!document.expiry_date) return;

    try {
      const expiryDate = new Date(document.expiry_date);
      const now = new Date();

      // Schedule reminders at 90, 30, and 7 days before expiry
      const reminderDays = [90, 30, 7];

      for (const days of reminderDays) {
        const reminderDate = new Date(expiryDate);
        reminderDate.setDate(reminderDate.getDate() - days);

        if (reminderDate > now) {
          await supabase.from('compliance_tasks').insert({
            tenant_id: document.tenant_id,
            person_id: document.person_id,
            document_id: document.id,
            task_type: 'EXPIRY_REMINDER',
            title: `Document expiring in ${days} days: ${document.file_name}`,
            urgency: days <= 7 ? 'HIGH' : days <= 30 ? 'MEDIUM' : 'LOW',
            status: 'SCHEDULED',
            due_date: reminderDate.toISOString(),
            is_automated: true,
            automation_trigger: `EXPIRY_ALERT_${days}_DAYS`
          });
        }
      }
    } catch (error) {
      log.error('Error scheduling reminders', error, { component: 'ComplianceService', action: 'scheduleExpiryReminders', metadata: { documentId: document.id } });
    }
  }

  /**
   * Process expired documents
   */
  async processExpiredDocuments(tenantId: string): Promise<number> {
    try {
      // Find and update expired documents
      const { data: expiredDocs, error } = await supabase
        .from('compliance_documents')
        .update({
          status: 'EXPIRED',
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .eq('is_current', true)
        .lt('expiry_date', new Date().toISOString())
        .neq('status', 'EXPIRED')
        .select();

      if (error || !expiredDocs) return 0;

      // Create tasks and notifications for each expired document
      for (const doc of expiredDocs) {
        await this.createTask({
          tenant_id: tenantId,
          person_id: doc.person_id,
          document_id: doc.id,
          task_type: 'DOCUMENT_EXPIRED',
          title: `URGENT: Document expired - ${doc.file_name}`,
          urgency: 'CRITICAL',
          is_automated: true
        });

        await this.sendNotification({
          tenant_id: tenantId,
          person_id: doc.person_id,
          document_id: doc.id,
          type: 'DOCUMENT_EXPIRED',
          urgency: 'CRITICAL',
          title: 'Document Expired',
          message: `Your ${doc.file_name} has expired. Please upload a new version immediately.`
        });

        // Recalculate compliance score
        await this.recalculateComplianceScore(doc.person_id);
      }

      return expiredDocs.length;
    } catch (error) {
      log.error('Error processing expired documents', error, { component: 'ComplianceService', action: 'processExpiredDocuments', metadata: { tenantId } });
      return 0;
    }
  }

  // =========================================
  // TASKS & NOTIFICATIONS
  // =========================================

  /**
   * Create a compliance task
   */
  async createTask(taskData: Partial<ComplianceTask>): Promise<ComplianceTask | null> {
    try {
      const { data, error } = await supabase
        .from('compliance_tasks')
        .insert({
          ...taskData,
          status: taskData.status || 'PENDING'
        })
        .select()
        .single();

      if (error) {
        log.error('Error creating task', error, { component: 'ComplianceService', action: 'createTask', metadata: { taskData } });
        return null;
      }

      return data;
    } catch (error) {
      log.error('Error creating task', error, { component: 'ComplianceService', action: 'createTask' });
      return null;
    }
  }

  /**
   * Get tasks for a person or tenant
   */
  async getTasks(tenantId: string, personId?: string, status?: string): Promise<ComplianceTask[]> {
    try {
      let query = supabase
        .from('compliance_tasks')
        .select('*')
        .eq('tenant_id', tenantId);

      if (personId) {
        query = query.eq('person_id', personId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) return [];
      return data || [];
    } catch (error) {
      log.error('Error getting tasks', error, { component: 'ComplianceService', action: 'getTasks', metadata: { tenantId, personId } });
      return [];
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(notification: {
    tenant_id: string;
    person_id?: string;
    document_id?: string;
    type: string;
    urgency: UrgencyLevel;
    title: string;
    message: string;
  }): Promise<void> {
    try {
      await supabase.from('compliance_notifications').insert({
        tenant_id: notification.tenant_id,
        person_id: notification.person_id,
        document_id: notification.document_id,
        notification_type: notification.type,
        urgency: notification.urgency,
        title: notification.title,
        message: notification.message,
        sent_at: new Date().toISOString(),
        in_app_sent: true
      });
    } catch (error) {
      log.error('Error sending notification', error, { component: 'ComplianceService', action: 'sendNotification', metadata: { notification } });
    }
  }

  // =========================================
  // CROSS-APP SYNC
  // =========================================

  /**
   * Sync person data to CareFlow
   */
  async syncToCareFlow(personId: string): Promise<boolean> {
    try {
      const { data: person } = await supabase
        .from('compliance_persons')
        .select('*')
        .eq('id', personId)
        .single();

      if (!person) return false;

      // Log sync attempt
      const { data: syncLog } = await supabase
        .from('compliance_sync_log')
        .insert({
          tenant_id: person.tenant_id,
          source_app: 'novumflow',
          target_app: 'careflow',
          sync_type: 'person',
          source_entity_id: personId,
          entity_type: 'compliance_person',
          status: 'PENDING',
          sync_started_at: new Date().toISOString(),
          sync_data: person
        })
        .select()
        .single();

      // In a real implementation, this would call CareFlow API
      // For now, we'll mark as synced
      await supabase
        .from('compliance_persons')
        .update({
          synced_to_careflow: true,
          careflow_sync_date: new Date().toISOString()
        })
        .eq('id', personId);

      // Update sync log
      if (syncLog) {
        await supabase
          .from('compliance_sync_log')
          .update({
            status: 'COMPLETED',
            sync_completed_at: new Date().toISOString()
          })
          .eq('id', syncLog.id);
      }

      return true;
    } catch (error) {
      log.error('Error syncing to CareFlow', error, { component: 'ComplianceService', action: 'syncToCareFlow', metadata: { personId } });
      return false;
    }
  }

  /**
   * Sync documents to CareFlow
   */
  async syncDocumentsToCareFlow(personId: string): Promise<number> {
    try {
      const { data: documents } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('person_id', personId)
        .eq('is_current', true);

      if (!documents) return 0;

      // In a real implementation, this would sync each document to CareFlow
      // For now, we log the sync attempt
      for (const doc of documents) {
        await supabase.from('compliance_sync_log').insert({
          tenant_id: doc.tenant_id,
          source_app: 'novumflow',
          target_app: 'careflow',
          sync_type: 'document',
          source_entity_id: doc.id,
          entity_type: 'compliance_document',
          status: 'COMPLETED',
          sync_started_at: new Date().toISOString(),
          sync_completed_at: new Date().toISOString()
        });
      }

      return documents.length;
    } catch (error) {
      log.error('Error syncing documents to CareFlow', error, { component: 'ComplianceService', action: 'syncDocumentsToCareFlow', metadata: { personId } });
      return 0;
    }
  }

  // =========================================
  // AUDIT
  // =========================================

  /**
   * Log audit entry
   */
  private async logAudit(
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('compliance_audit_log').insert({
        tenant_id: details?.tenant_id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        user_id: user?.id,
        user_email: user?.email,
        new_values: details
      });
    } catch (error) {
      log.error('Error logging audit', error, { component: 'ComplianceService', action: 'logAudit', metadata: { action, entityType, entityId } });
    }
  }

  /**
   * Get audit history
   */
  async getAuditHistory(
    tenantId: string,
    entityType?: string,
    entityId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('tenant_id', tenantId);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch (error) {
      log.error('Error getting audit history', error, { component: 'ComplianceService', action: 'getAuditHistory', metadata: { tenantId } });
      return [];
    }
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();
export default complianceService;
