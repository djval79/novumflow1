/**
 * Cross-App Synchronization Service
 * 
 * Handles data synchronization between NovumFlow and CareFlow
 * - Employee/Carer data sync
 * - Document sync with proper categorization
 * - Training record sync
 * - Compliance status sync
 * - Real-time updates
 */

import { supabase } from '../supabase';
import { CompliancePerson, ComplianceDocument, ComplianceFolder } from './ComplianceService';

// ===========================================
// TYPES
// ===========================================

export interface SyncConfig {
  sourceApp: 'novumflow' | 'careflow';
  targetApp: 'novumflow' | 'careflow';
  syncType: SyncType;
  entityId?: string;
  tenantId: string;
  userId?: string;
}

export type SyncType = 
  | 'person'
  | 'document'
  | 'folder'
  | 'training'
  | 'compliance_status'
  | 'full_profile';

export interface SyncResult {
  success: boolean;
  syncId: string;
  entityType: string;
  sourceId: string;
  targetId?: string;
  syncedFields: string[];
  errors?: string[];
  timestamp: string;
}

export interface SyncMapping {
  novumflow: string;
  careflow: string;
  transform?: (value: any) => any;
}

export interface SyncStatus {
  lastSync: string;
  syncCount: number;
  pendingSync: number;
  errors: SyncError[];
  health: 'healthy' | 'degraded' | 'error';
}

export interface SyncError {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  error: string;
  retryCount: number;
}

// ===========================================
// FIELD MAPPINGS
// ===========================================

const PERSON_FIELD_MAPPINGS: SyncMapping[] = [
  { novumflow: 'full_name', careflow: 'name' },
  { novumflow: 'email', careflow: 'email' },
  { novumflow: 'phone', careflow: 'phone' },
  { novumflow: 'job_title', careflow: 'role' },
  { novumflow: 'department', careflow: 'department' },
  { novumflow: 'start_date', careflow: 'joinedDate' },
  { novumflow: 'overall_compliance_score', careflow: 'complianceScore' },
  { novumflow: 'compliance_status', careflow: 'status', 
    transform: (status: string) => status === 'COMPLIANT' ? 'Active' : 'At Risk' 
  },
  { novumflow: 'visa_expiry_date', careflow: 'visaExpiry' },
  { novumflow: 'requires_nmc', careflow: 'requiresNMC' },
  { novumflow: 'nmc_pin', careflow: 'nmcPin' },
  { novumflow: 'nmc_expiry_date', careflow: 'nmcExpiry' },
];

const DOCUMENT_CATEGORY_MAPPINGS: Record<string, string> = {
  // Home Office docs map to Staff HR in CareFlow
  'HOME_OFFICE': 'Staff HR',
  // CQC docs map to Compliance in CareFlow
  'CQC': 'Compliance',
  // Shared docs go to both
  'BOTH': 'Staff HR',
  // Internal stays as HR
  'INTERNAL': 'Staff HR'
};

const COMPLIANCE_RECORD_MAPPINGS: Record<string, string> = {
  'dbs_certificate': 'DBS Check',
  'mandatory_training': 'Mandatory Training',
  'safeguarding_adults': 'Safeguarding L2',
  'safeguarding_children': 'Safeguarding Children',
  'first_aid': 'First Aid',
  'manual_handling': 'Manual Handling',
  'medication_admin': 'Medication Admin',
  'fire_safety': 'Fire Safety',
  'health_safety': 'Health & Safety',
  'food_hygiene': 'Food Hygiene',
  'infection_control': 'Infection Control',
  'mental_capacity': 'Mental Capacity Act',
  'nmc_pin': 'NMC Registration',
  'care_certificate': 'Care Certificate'
};

// ===========================================
// SYNC SERVICE
// ===========================================

class CrossAppSyncService {
  private syncQueue: Map<string, SyncConfig> = new Map();
  private retryQueue: SyncError[] = [];
  private isProcessing: boolean = false;

  // =========================================
  // PERSON SYNC
  // =========================================

  /**
   * Sync a person from NovumFlow to CareFlow
   */
  async syncPersonToCareFlow(
    personId: string,
    tenantId: string
  ): Promise<SyncResult> {
    try {
      // Get person data from NovumFlow
      const { data: person, error: fetchError } = await supabase
        .from('compliance_persons')
        .select('*')
        .eq('id', personId)
        .single();

      if (fetchError || !person) {
        return this.createErrorResult('person', personId, 'Person not found');
      }

      // Transform data for CareFlow format
      const careflowData = this.transformPersonForCareFlow(person);

      // Check if person exists in CareFlow staff table
      const { data: existingStaff } = await supabase
        .from('staff_members')
        .select('id')
        .eq('email', person.email)
        .eq('tenant_id', tenantId)
        .single();

      let targetId: string;

      if (existingStaff) {
        // Update existing staff member
        const { error: updateError } = await supabase
          .from('staff_members')
          .update(careflowData)
          .eq('id', existingStaff.id);

        if (updateError) {
          return this.createErrorResult('person', personId, updateError.message);
        }
        targetId = existingStaff.id;
      } else {
        // Create new staff member
        const { data: newStaff, error: insertError } = await supabase
          .from('staff_members')
          .insert({
            ...careflowData,
            tenant_id: tenantId,
            status: 'Active'
          })
          .select()
          .single();

        if (insertError || !newStaff) {
          return this.createErrorResult('person', personId, insertError?.message || 'Insert failed');
        }
        targetId = newStaff.id;
      }

      // Update sync status in NovumFlow
      await supabase
        .from('compliance_persons')
        .update({
          synced_to_careflow: true,
          careflow_sync_date: new Date().toISOString()
        })
        .eq('id', personId);

      // Log sync
      await this.logSync({
        sourceApp: 'novumflow',
        targetApp: 'careflow',
        syncType: 'person',
        entityId: personId,
        tenantId
      }, targetId);

      return {
        success: true,
        syncId: crypto.randomUUID(),
        entityType: 'person',
        sourceId: personId,
        targetId,
        syncedFields: PERSON_FIELD_MAPPINGS.map(m => m.novumflow),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Sync error:', error);
      return this.createErrorResult('person', personId, String(error));
    }
  }

  /**
   * Transform NovumFlow person to CareFlow staff format
   */
  private transformPersonForCareFlow(person: CompliancePerson): Record<string, any> {
    const result: Record<string, any> = {};

    for (const mapping of PERSON_FIELD_MAPPINGS) {
      const value = person[mapping.novumflow as keyof CompliancePerson];
      if (value !== undefined && value !== null) {
        result[mapping.careflow] = mapping.transform 
          ? mapping.transform(value) 
          : value;
      }
    }

    return result;
  }

  // =========================================
  // DOCUMENT SYNC
  // =========================================

  /**
   * Sync documents from NovumFlow to CareFlow
   */
  async syncDocumentsToCareFlow(
    personId: string,
    tenantId: string
  ): Promise<SyncResult[]> {
    try {
      // Get all current documents for person
      const { data: documents, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('person_id', personId)
        .eq('is_current', true);

      if (error || !documents) {
        return [this.createErrorResult('document', personId, 'Failed to fetch documents')];
      }

      const results: SyncResult[] = [];

      for (const doc of documents) {
        const result = await this.syncSingleDocument(doc, tenantId);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Document sync error:', error);
      return [this.createErrorResult('document', personId, String(error))];
    }
  }

  /**
   * Sync a single document to CareFlow
   */
  async syncSingleDocument(
    document: ComplianceDocument,
    tenantId: string
  ): Promise<SyncResult> {
    try {
      // Transform document for CareFlow
      const careflowDoc = {
        name: document.file_name,
        type: this.getDocumentType(document.mime_type || ''),
        category: DOCUMENT_CATEGORY_MAPPINGS[document.authority] || 'Staff HR',
        uploadedDate: document.uploaded_at,
        expiryDate: document.expiry_date,
        tags: [
          document.authority.toLowerCase(),
          document.document_type_id,
          document.status.toLowerCase()
        ],
        size: this.formatFileSize(document.file_size || 0),
        tenant_id: tenantId,
        // Link to storage
        storage_bucket: document.storage_bucket,
        storage_path: document.storage_path,
        // Source reference
        novumflow_document_id: document.id,
        person_id: document.person_id
      };

      // Check if already synced
      const { data: existing } = await supabase
        .from('stored_documents')
        .select('id')
        .eq('novumflow_document_id', document.id)
        .single();

      let targetId: string;

      if (existing) {
        const { error: updateError } = await supabase
          .from('stored_documents')
          .update(careflowDoc)
          .eq('id', existing.id);

        if (updateError) {
          return this.createErrorResult('document', document.id, updateError.message);
        }
        targetId = existing.id;
      } else {
        const { data: newDoc, error: insertError } = await supabase
          .from('stored_documents')
          .insert(careflowDoc)
          .select()
          .single();

        if (insertError || !newDoc) {
          return this.createErrorResult('document', document.id, insertError?.message || 'Insert failed');
        }
        targetId = newDoc.id;
      }

      await this.logSync({
        sourceApp: 'novumflow',
        targetApp: 'careflow',
        syncType: 'document',
        entityId: document.id,
        tenantId
      }, targetId);

      return {
        success: true,
        syncId: crypto.randomUUID(),
        entityType: 'document',
        sourceId: document.id,
        targetId,
        syncedFields: ['name', 'type', 'category', 'expiryDate', 'tags'],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.createErrorResult('document', document.id, String(error));
    }
  }

  private getDocumentType(mimeType: string): 'PDF' | 'Image' | 'Word' {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
    return 'PDF';
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // =========================================
  // COMPLIANCE RECORD SYNC
  // =========================================

  /**
   * Sync compliance records to CareFlow staff compliance array
   */
  async syncComplianceRecords(
    personId: string,
    tenantId: string
  ): Promise<SyncResult> {
    try {
      // Get compliance checklist items
      const { data: checklists, error } = await supabase
        .from('compliance_checklists')
        .select('*, compliance_documents(*)')
        .eq('person_id', personId)
        .eq('is_applicable', true);

      if (error || !checklists) {
        return this.createErrorResult('compliance', personId, 'Failed to fetch checklists');
      }

      // Transform to CareFlow compliance record format
      const complianceRecords = checklists
        .filter(item => item.authority === 'CQC' || item.authority === 'BOTH')
        .map(item => ({
          id: item.id,
          name: COMPLIANCE_RECORD_MAPPINGS[item.document_type_id] || item.document_type_id,
          expiryDate: item.compliance_documents?.expiry_date || null,
          status: this.mapComplianceStatus(item.status, item.compliance_documents?.expiry_date),
          docUrl: item.compliance_documents?.file_path
        }));

      // Get person email to find CareFlow staff
      const { data: person } = await supabase
        .from('compliance_persons')
        .select('email')
        .eq('id', personId)
        .single();

      if (!person) {
        return this.createErrorResult('compliance', personId, 'Person not found');
      }

      // Update staff compliance in CareFlow
      const { data: staff, error: staffError } = await supabase
        .from('staff_members')
        .update({ compliance: complianceRecords })
        .eq('email', person.email)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (staffError || !staff) {
        return this.createErrorResult('compliance', personId, staffError?.message || 'Staff update failed');
      }

      await this.logSync({
        sourceApp: 'novumflow',
        targetApp: 'careflow',
        syncType: 'compliance_status',
        entityId: personId,
        tenantId
      }, staff.id);

      return {
        success: true,
        syncId: crypto.randomUUID(),
        entityType: 'compliance_status',
        sourceId: personId,
        targetId: staff.id,
        syncedFields: complianceRecords.map(r => r.name),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.createErrorResult('compliance', personId, String(error));
    }
  }

  private mapComplianceStatus(
    status: string, 
    expiryDate?: string
  ): 'Valid' | 'Due Soon' | 'Expired' {
    if (status === 'EXPIRED') return 'Expired';
    if (status === 'EXPIRING_SOON') return 'Due Soon';
    
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) return 'Expired';
      if (daysUntil < 30) return 'Due Soon';
    }
    
    return 'Valid';
  }

  // =========================================
  // FOLDER SYNC
  // =========================================

  /**
   * Sync folder structure to CareFlow
   */
  async syncFoldersToCareFlow(tenantId: string): Promise<SyncResult> {
    try {
      // Get NovumFlow folder structure
      const { data: folders, error } = await supabase
        .from('compliance_folders')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_system_folder', true);

      if (error || !folders) {
        return this.createErrorResult('folder', tenantId, 'Failed to fetch folders');
      }

      // Transform for CareFlow
      // CareFlow uses category-based organization
      const categoryMappings = folders.map(folder => ({
        name: folder.name,
        authority: folder.authority,
        careflowCategory: DOCUMENT_CATEGORY_MAPPINGS[folder.authority] || 'Staff HR',
        color: folder.color,
        autoAssign: folder.auto_assign_document_types
      }));

      // Store mapping for reference
      await supabase
        .from('compliance_sync_log')
        .insert({
          tenant_id: tenantId,
          source_app: 'novumflow',
          target_app: 'careflow',
          sync_type: 'folder',
          source_entity_id: tenantId,
          entity_type: 'folder_structure',
          status: 'COMPLETED',
          sync_started_at: new Date().toISOString(),
          sync_completed_at: new Date().toISOString(),
          sync_data: categoryMappings
        });

      return {
        success: true,
        syncId: crypto.randomUUID(),
        entityType: 'folder',
        sourceId: tenantId,
        syncedFields: ['name', 'authority', 'category', 'autoAssign'],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.createErrorResult('folder', tenantId, String(error));
    }
  }

  // =========================================
  // FULL PROFILE SYNC
  // =========================================

  /**
   * Sync complete profile (person + documents + compliance)
   */
  async syncFullProfile(
    personId: string,
    tenantId: string
  ): Promise<{
    person: SyncResult;
    documents: SyncResult[];
    compliance: SyncResult;
    overall: { success: boolean; errors: string[] };
  }> {
    const errors: string[] = [];

    // Sync person
    const personResult = await this.syncPersonToCareFlow(personId, tenantId);
    if (!personResult.success && personResult.errors) {
      errors.push(...personResult.errors);
    }

    // Sync documents
    const documentResults = await this.syncDocumentsToCareFlow(personId, tenantId);
    for (const result of documentResults) {
      if (!result.success && result.errors) {
        errors.push(...result.errors);
      }
    }

    // Sync compliance records
    const complianceResult = await this.syncComplianceRecords(personId, tenantId);
    if (!complianceResult.success && complianceResult.errors) {
      errors.push(...complianceResult.errors);
    }

    return {
      person: personResult,
      documents: documentResults,
      compliance: complianceResult,
      overall: {
        success: errors.length === 0,
        errors
      }
    };
  }

  // =========================================
  // BATCH SYNC
  // =========================================

  /**
   * Batch sync all employees to CareFlow
   */
  async batchSyncToCareFlow(tenantId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    errors: SyncError[];
  }> {
    const errors: SyncError[] = [];
    let successful = 0;
    let failed = 0;

    // Get all employees
    const { data: persons, error } = await supabase
      .from('compliance_persons')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('person_type', 'EMPLOYEE');

    if (error || !persons) {
      return { total: 0, successful: 0, failed: 0, errors: [] };
    }

    for (const person of persons) {
      const result = await this.syncFullProfile(person.id, tenantId);
      
      if (result.overall.success) {
        successful++;
      } else {
        failed++;
        errors.push({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          entityType: 'person',
          entityId: person.id,
          error: result.overall.errors.join(', '),
          retryCount: 0
        });
      }
    }

    return {
      total: persons.length,
      successful,
      failed,
      errors
    };
  }

  // =========================================
  // SYNC FROM CAREFLOW
  // =========================================

  /**
   * Sync training completion from CareFlow to NovumFlow
   */
  async syncTrainingFromCareFlow(
    staffId: string,
    tenantId: string
  ): Promise<SyncResult> {
    try {
      // Get training modules from CareFlow
      const { data: staff, error } = await supabase
        .from('staff_members')
        .select('*, training_modules(*)')
        .eq('id', staffId)
        .single();

      if (error || !staff) {
        return this.createErrorResult('training', staffId, 'Staff not found');
      }

      // Get corresponding NovumFlow person
      const { data: person } = await supabase
        .from('compliance_persons')
        .select('id')
        .eq('email', staff.email)
        .eq('tenant_id', tenantId)
        .single();

      if (!person) {
        return this.createErrorResult('training', staffId, 'Person not found in NovumFlow');
      }

      // Update training checklist items
      if (staff.training_modules) {
        for (const module of staff.training_modules) {
          if (module.status === 'Completed') {
            await supabase
              .from('compliance_checklists')
              .update({
                status: 'VERIFIED',
                completed_date: module.completedDate,
                notes: `Completed in CareFlow: ${module.title}`
              })
              .eq('person_id', person.id)
              .eq('document_type_id', 'mandatory_training');
          }
        }
      }

      await this.logSync({
        sourceApp: 'careflow',
        targetApp: 'novumflow',
        syncType: 'training',
        entityId: staffId,
        tenantId
      }, person.id);

      return {
        success: true,
        syncId: crypto.randomUUID(),
        entityType: 'training',
        sourceId: staffId,
        targetId: person.id,
        syncedFields: ['training_status', 'completed_date'],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.createErrorResult('training', staffId, String(error));
    }
  }

  // =========================================
  // REAL-TIME SYNC
  // =========================================

  /**
   * Setup real-time sync listeners
   */
  setupRealtimeSync(tenantId: string): void {
    // Listen for document changes in NovumFlow
    supabase
      .channel(`compliance_documents_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_documents',
          filter: `tenant_id=eq.${tenantId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const doc = payload.new as ComplianceDocument;
            await this.queueSync({
              sourceApp: 'novumflow',
              targetApp: 'careflow',
              syncType: 'document',
              entityId: doc.id,
              tenantId
            });
          }
        }
      )
      .subscribe();

    // Listen for person changes
    supabase
      .channel(`compliance_persons_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'compliance_persons',
          filter: `tenant_id=eq.${tenantId}`
        },
        async (payload) => {
          const person = payload.new as CompliancePerson;
          if (person.person_type === 'EMPLOYEE' && !person.synced_to_careflow) {
            await this.queueSync({
              sourceApp: 'novumflow',
              targetApp: 'careflow',
              syncType: 'person',
              entityId: person.id,
              tenantId
            });
          }
        }
      )
      .subscribe();
  }

  /**
   * Stop real-time sync
   */
  stopRealtimeSync(tenantId: string): void {
    supabase.channel(`compliance_documents_${tenantId}`).unsubscribe();
    supabase.channel(`compliance_persons_${tenantId}`).unsubscribe();
  }

  // =========================================
  // QUEUE MANAGEMENT
  // =========================================

  /**
   * Queue a sync operation
   */
  async queueSync(config: SyncConfig): Promise<void> {
    const key = `${config.syncType}_${config.entityId}`;
    this.syncQueue.set(key, config);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process sync queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.syncQueue.size > 0) {
        const entries = Array.from(this.syncQueue.entries());
        this.syncQueue.clear();

        for (const [key, config] of entries) {
          try {
            await this.executeSyncConfig(config);
          } catch (error) {
            console.error(`Sync failed for ${key}:`, error);
            this.retryQueue.push({
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              entityType: config.syncType,
              entityId: config.entityId || '',
              error: String(error),
              retryCount: 0
            });
          }
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a sync configuration
   */
  private async executeSyncConfig(config: SyncConfig): Promise<SyncResult> {
    switch (config.syncType) {
      case 'person':
        return this.syncPersonToCareFlow(config.entityId!, config.tenantId);
      case 'document':
        const results = await this.syncDocumentsToCareFlow(config.entityId!, config.tenantId);
        return results[0];
      case 'compliance_status':
        return this.syncComplianceRecords(config.entityId!, config.tenantId);
      case 'folder':
        return this.syncFoldersToCareFlow(config.tenantId);
      default:
        return this.createErrorResult(config.syncType, config.entityId || '', 'Unknown sync type');
    }
  }

  // =========================================
  // STATUS & LOGGING
  // =========================================

  /**
   * Get sync status for a tenant
   */
  async getSyncStatus(tenantId: string): Promise<SyncStatus> {
    try {
      // Get recent sync logs
      const { data: logs, error } = await supabase
        .from('compliance_sync_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !logs) {
        return {
          lastSync: 'Never',
          syncCount: 0,
          pendingSync: this.syncQueue.size,
          errors: this.retryQueue,
          health: 'error'
        };
      }

      const successCount = logs.filter(l => l.status === 'COMPLETED').length;
      const errorCount = logs.filter(l => l.status === 'FAILED').length;

      return {
        lastSync: logs[0]?.created_at || 'Never',
        syncCount: successCount,
        pendingSync: this.syncQueue.size,
        errors: this.retryQueue,
        health: errorCount > successCount * 0.1 ? 'degraded' : 'healthy'
      };
    } catch (error) {
      return {
        lastSync: 'Unknown',
        syncCount: 0,
        pendingSync: 0,
        errors: [],
        health: 'error'
      };
    }
  }

  /**
   * Log sync operation
   */
  private async logSync(config: SyncConfig, targetId?: string): Promise<void> {
    try {
      await supabase.from('compliance_sync_log').insert({
        tenant_id: config.tenantId,
        source_app: config.sourceApp,
        target_app: config.targetApp,
        sync_type: config.syncType,
        source_entity_id: config.entityId,
        target_entity_id: targetId,
        entity_type: config.syncType,
        status: 'COMPLETED',
        sync_started_at: new Date().toISOString(),
        sync_completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log sync:', error);
    }
  }

  /**
   * Create error result
   */
  private createErrorResult(
    entityType: string,
    entityId: string,
    error: string
  ): SyncResult {
    return {
      success: false,
      syncId: crypto.randomUUID(),
      entityType,
      sourceId: entityId,
      syncedFields: [],
      errors: [error],
      timestamp: new Date().toISOString()
    };
  }

  // =========================================
  // RETRY FAILED SYNCS
  // =========================================

  /**
   * Retry failed sync operations
   */
  async retryFailedSyncs(maxRetries: number = 3): Promise<{
    retried: number;
    succeeded: number;
    permanentFailures: number;
  }> {
    let succeeded = 0;
    let permanentFailures = 0;
    const toRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const error of toRetry) {
      if (error.retryCount >= maxRetries) {
        permanentFailures++;
        continue;
      }

      // Attempt retry logic here
      error.retryCount++;
      this.retryQueue.push(error);
    }

    return {
      retried: toRetry.length,
      succeeded,
      permanentFailures
    };
  }
}

// Export singleton instance
export const crossAppSyncService = new CrossAppSyncService();
export default crossAppSyncService;
