/**
 * Automated Compliance Workflow Engine
 * 
 * Handles all automated compliance processes:
 * - Document expiry monitoring and alerts
 * - Automatic stage progression
 * - Reference chasing
 * - Training renewal scheduling
 * - Escalation procedures
 * - Bulk processing of compliance tasks
 */

import { supabase } from '../supabase';
import { 
  COMPLIANCE_AUTOMATIONS, 
  ComplianceAuthority, 
  ComplianceStage, 
  UrgencyLevel 
} from './complianceTypes';
import { complianceService } from './ComplianceService';

// ===========================================
// TYPES
// ===========================================

export interface WorkflowTask {
  id: string;
  type: WorkflowTaskType;
  entityId: string;
  entityType: string;
  tenantId: string;
  urgency: UrgencyLevel;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  scheduledAt: Date;
  executedAt?: Date;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export type WorkflowTaskType =
  | 'expiry_check'
  | 'expiry_reminder'
  | 'stage_progression'
  | 'reference_chase'
  | 'training_renewal'
  | 'rtw_annual_check'
  | 'compliance_score_update'
  | 'sync_to_careflow'
  | 'bulk_notification'
  | 'escalation';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface WorkflowAction {
  type: string;
  config: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  tenantId: string;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  actionsExecuted: number;
  errors?: string[];
}

// ===========================================
// WORKFLOW ENGINE
// ===========================================

class AutomatedWorkflowEngine {
  private taskQueue: WorkflowTask[] = [];
  private isProcessing: boolean = false;
  private intervalIds: NodeJS.Timer[] = [];

  // =========================================
  // INITIALIZATION
  // =========================================

  /**
   * Start all automated workflows
   */
  start(): void {
    console.log('Starting Automated Workflow Engine...');
    
    // Daily expiry check at 6 AM
    this.scheduleRecurring('expiry_check', () => this.runExpiryChecks(), {
      hour: 6,
      minute: 0
    });
    
    // Hourly reference chase check
    this.scheduleRecurring('reference_chase', () => this.runReferenceChasers(), {
      minute: 30 // Every hour at 30 minutes past
    });
    
    // Real-time queue processing
    this.intervalIds.push(
      setInterval(() => this.processQueue(), 5000) // Every 5 seconds
    );
    
    console.log('Workflow Engine started successfully');
  }

  /**
   * Stop all automated workflows
   */
  stop(): void {
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
    this.isProcessing = false;
    console.log('Workflow Engine stopped');
  }

  /**
   * Schedule a recurring task
   */
  private scheduleRecurring(
    name: string, 
    fn: () => Promise<void>,
    schedule: { hour?: number; minute?: number }
  ): void {
    const checkAndRun = () => {
      const now = new Date();
      if (
        (schedule.hour === undefined || now.getHours() === schedule.hour) &&
        (schedule.minute === undefined || now.getMinutes() === schedule.minute)
      ) {
        fn().catch(err => console.error(`Scheduled task ${name} failed:`, err));
      }
    };
    
    // Check every minute
    this.intervalIds.push(setInterval(checkAndRun, 60000));
  }

  // =========================================
  // EXPIRY MANAGEMENT
  // =========================================

  /**
   * Run expiry checks for all documents
   */
  async runExpiryChecks(): Promise<{ processed: number; expired: number; reminded: number }> {
    console.log('Running expiry checks...');
    let processed = 0;
    let expired = 0;
    let reminded = 0;

    try {
      // Get all documents with expiry dates
      const { data: documents, error } = await supabase
        .from('compliance_documents')
        .select('*, compliance_persons(*)')
        .eq('is_current', true)
        .not('expiry_date', 'is', null);

      if (error || !documents) {
        console.error('Failed to fetch documents for expiry check:', error);
        return { processed: 0, expired: 0, reminded: 0 };
      }

      const now = new Date();

      for (const doc of documents) {
        processed++;
        const expiryDate = new Date(doc.expiry_date);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Handle expired documents
        if (daysUntilExpiry < 0 && doc.status !== 'EXPIRED') {
          await this.handleExpiredDocument(doc);
          expired++;
        }
        // Handle expiring soon
        else if (daysUntilExpiry <= 30 && doc.status === 'VERIFIED') {
          await this.handleExpiringDocument(doc, daysUntilExpiry);
          reminded++;
        }
      }

      console.log(`Expiry check complete: ${processed} processed, ${expired} expired, ${reminded} reminded`);
      return { processed, expired, reminded };
    } catch (error) {
      console.error('Expiry check failed:', error);
      return { processed, expired, reminded };
    }
  }

  /**
   * Handle an expired document
   */
  private async handleExpiredDocument(document: any): Promise<void> {
    // Update document status
    await supabase
      .from('compliance_documents')
      .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
      .eq('id', document.id);

    // Update checklist
    await supabase
      .from('compliance_checklists')
      .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
      .eq('document_id', document.id);

    // Create urgent task
    await this.createTask({
      type: 'escalation',
      entityId: document.id,
      entityType: 'compliance_documents',
      tenantId: document.tenant_id,
      urgency: 'CRITICAL',
      scheduledAt: new Date()
    });

    // Send notifications
    await this.sendNotifications({
      tenantId: document.tenant_id,
      personId: document.person_id,
      type: 'DOCUMENT_EXPIRED',
      urgency: 'CRITICAL',
      title: 'Document Expired - Immediate Action Required',
      message: `${document.file_name} has expired. This person may no longer be compliant to work.`,
      recipients: ['employee', 'hr_manager', 'compliance_officer', 'registered_manager']
    });

    // Recalculate compliance score
    await complianceService.recalculateComplianceScore(document.person_id);
  }

  /**
   * Handle a document that is expiring soon
   */
  private async handleExpiringDocument(document: any, daysUntilExpiry: number): Promise<void> {
    // Determine urgency level
    let urgency: UrgencyLevel = 'LOW';
    if (daysUntilExpiry <= 7) urgency = 'HIGH';
    else if (daysUntilExpiry <= 14) urgency = 'MEDIUM';

    // Update status if not already expiring_soon
    if (document.status !== 'EXPIRING_SOON') {
      await supabase
        .from('compliance_documents')
        .update({ status: 'EXPIRING_SOON', updated_at: new Date().toISOString() })
        .eq('id', document.id);
    }

    // Check if reminder already sent today
    const { data: existingReminder } = await supabase
      .from('compliance_notifications')
      .select('id')
      .eq('document_id', document.id)
      .eq('notification_type', 'EXPIRY_REMINDER')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (!existingReminder) {
      // Send reminder based on days until expiry
      const recipients = daysUntilExpiry <= 7 
        ? ['employee', 'hr_manager', 'compliance_officer']
        : ['employee', 'hr_manager'];

      await this.sendNotifications({
        tenantId: document.tenant_id,
        personId: document.person_id,
        documentId: document.id,
        type: 'EXPIRY_REMINDER',
        urgency,
        title: `Document Expiring in ${daysUntilExpiry} Days`,
        message: `${document.file_name} will expire on ${document.expiry_date}. Please upload a renewed document.`,
        recipients
      });
    }
  }

  // =========================================
  // REFERENCE CHASING
  // =========================================

  /**
   * Run reference chaser for pending references
   */
  async runReferenceChasers(): Promise<{ chased: number }> {
    console.log('Running reference chasers...');
    let chased = 0;

    try {
      // Get pending reference requests
      const { data: pendingRefs, error } = await supabase
        .from('compliance_checklists')
        .select('*, compliance_persons(*)')
        .eq('document_type_id', 'employment_references')
        .eq('status', 'PENDING')
        .eq('is_applicable', true);

      if (error || !pendingRefs) {
        return { chased: 0 };
      }

      const now = new Date();

      for (const ref of pendingRefs) {
        const createdAt = new Date(ref.created_at);
        const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Chase after 3 days
        if (daysSinceCreated >= 3 && daysSinceCreated < 7) {
          await this.sendReferenceChaser(ref, 'first');
          chased++;
        }
        // Chase again after 7 days
        else if (daysSinceCreated >= 7 && daysSinceCreated < 14) {
          await this.sendReferenceChaser(ref, 'second');
          chased++;
        }
        // Escalate after 14 days
        else if (daysSinceCreated >= 14) {
          await this.escalateReference(ref);
          chased++;
        }
      }

      console.log(`Reference chase complete: ${chased} chased`);
      return { chased };
    } catch (error) {
      console.error('Reference chase failed:', error);
      return { chased: 0 };
    }
  }

  /**
   * Send reference chase email
   */
  private async sendReferenceChaser(ref: any, chaseType: 'first' | 'second'): Promise<void> {
    const recipients = chaseType === 'first' 
      ? ['referee'] 
      : ['referee', 'applicant'];

    await this.sendNotifications({
      tenantId: ref.tenant_id,
      personId: ref.person_id,
      type: 'REFERENCE_CHASE',
      urgency: chaseType === 'second' ? 'HIGH' : 'MEDIUM',
      title: `Reference Request Follow-up`,
      message: `We are still awaiting references for ${ref.compliance_persons?.full_name}. Please respond at your earliest convenience.`,
      recipients
    });
  }

  /**
   * Escalate reference that has not been received
   */
  private async escalateReference(ref: any): Promise<void> {
    await this.createTask({
      type: 'escalation',
      entityId: ref.id,
      entityType: 'compliance_checklists',
      tenantId: ref.tenant_id,
      urgency: 'HIGH',
      scheduledAt: new Date()
    });

    await this.sendNotifications({
      tenantId: ref.tenant_id,
      personId: ref.person_id,
      type: 'REFERENCE_ESCALATION',
      urgency: 'HIGH',
      title: 'Reference Escalation Required',
      message: `References for ${ref.compliance_persons?.full_name} have not been received after 14 days. Alternative referees may be required.`,
      recipients: ['hr_manager', 'compliance_officer']
    });
  }

  // =========================================
  // TRAINING RENEWALS
  // =========================================

  /**
   * Process training renewal reminders
   */
  async processTrainingRenewals(): Promise<{ scheduled: number }> {
    console.log('Processing training renewals...');
    let scheduled = 0;

    try {
      // Get training documents expiring in 30 days
      const { data: expiringTraining, error } = await supabase
        .from('compliance_documents')
        .select('*, compliance_persons(*)')
        .eq('document_type_id', 'mandatory_training')
        .eq('is_current', true)
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .gte('expiry_date', new Date().toISOString());

      if (error || !expiringTraining) {
        return { scheduled: 0 };
      }

      for (const training of expiringTraining) {
        // Create training renewal task
        await this.createTask({
          type: 'training_renewal',
          entityId: training.id,
          entityType: 'compliance_documents',
          tenantId: training.tenant_id,
          urgency: 'MEDIUM',
          scheduledAt: new Date()
        });

        // Send notification
        await this.sendNotifications({
          tenantId: training.tenant_id,
          personId: training.person_id,
          documentId: training.id,
          type: 'TRAINING_RENEWAL',
          urgency: 'MEDIUM',
          title: 'Training Renewal Required',
          message: `Your ${training.extracted_data?.trainingType || 'mandatory training'} certificate will expire soon. Please complete the refresher course.`,
          recipients: ['employee', 'hr_manager']
        });

        scheduled++;
      }

      console.log(`Training renewals processed: ${scheduled} scheduled`);
      return { scheduled };
    } catch (error) {
      console.error('Training renewal processing failed:', error);
      return { scheduled: 0 };
    }
  }

  // =========================================
  // STAGE PROGRESSION
  // =========================================

  /**
   * Check and progress stages for all persons
   */
  async checkStageProgressions(tenantId: string): Promise<{ progressed: number }> {
    console.log('Checking stage progressions...');
    let progressed = 0;

    try {
      // Get all persons who might be ready for progression
      const { data: persons, error } = await supabase
        .from('compliance_persons')
        .select('id, current_stage')
        .eq('tenant_id', tenantId)
        .neq('current_stage', 'ONGOING')
        .neq('current_stage', 'OFFBOARDING');

      if (error || !persons) {
        return { progressed: 0 };
      }

      for (const person of persons) {
        const result = await complianceService.progressToNextStage(person.id);
        if (result.success) {
          progressed++;
          
          // Send notification about stage progression
          await this.sendNotifications({
            tenantId,
            personId: person.id,
            type: 'STAGE_PROGRESSION',
            urgency: 'LOW',
            title: 'Compliance Stage Advanced',
            message: `Congratulations! All requirements for ${person.current_stage} have been met. Moving to ${result.newStage}.`,
            recipients: ['employee', 'hr_manager']
          });
        }
      }

      console.log(`Stage progressions: ${progressed} advanced`);
      return { progressed };
    } catch (error) {
      console.error('Stage progression check failed:', error);
      return { progressed: 0 };
    }
  }

  // =========================================
  // RTW ANNUAL CHECKS
  // =========================================

  /**
   * Process annual Right to Work checks for limited leave employees
   */
  async processRTWAnnualChecks(): Promise<{ checked: number }> {
    console.log('Processing RTW annual checks...');
    let checked = 0;

    try {
      // Get employees with limited leave to remain
      const { data: employees, error } = await supabase
        .from('compliance_persons')
        .select('*')
        .eq('person_type', 'EMPLOYEE')
        .eq('has_indefinite_leave', false)
        .not('visa_type', 'is', null);

      if (error || !employees) {
        return { checked: 0 };
      }

      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      for (const employee of employees) {
        // Check if annual check is due
        const lastCheck = await this.getLastRTWCheck(employee.id);
        
        if (!lastCheck || new Date(lastCheck.created_at) < oneYearAgo) {
          // Create RTW check task
          await this.createTask({
            type: 'rtw_annual_check',
            entityId: employee.id,
            entityType: 'compliance_persons',
            tenantId: employee.tenant_id,
            urgency: 'HIGH',
            scheduledAt: new Date()
          });

          // Send notification
          await this.sendNotifications({
            tenantId: employee.tenant_id,
            personId: employee.id,
            type: 'RTW_ANNUAL_CHECK',
            urgency: 'HIGH',
            title: 'Annual Right to Work Check Due',
            message: `Annual RTW verification is required for ${employee.full_name}. Please complete the check and update records.`,
            recipients: ['hr_manager', 'compliance_officer']
          });

          checked++;
        }
      }

      console.log(`RTW annual checks: ${checked} due`);
      return { checked };
    } catch (error) {
      console.error('RTW annual check failed:', error);
      return { checked: 0 };
    }
  }

  private async getLastRTWCheck(personId: string): Promise<any> {
    const { data } = await supabase
      .from('compliance_audit_log')
      .select('*')
      .eq('entity_id', personId)
      .eq('action', 'RTW_CHECK_COMPLETED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data;
  }

  // =========================================
  // ESCALATION
  // =========================================

  /**
   * Process escalations for overdue tasks
   */
  async processEscalations(): Promise<{ escalated: number }> {
    console.log('Processing escalations...');
    let escalated = 0;

    try {
      // Get overdue tasks
      const { data: overdueTasks, error } = await supabase
        .from('compliance_tasks')
        .select('*')
        .eq('status', 'PENDING')
        .lt('due_date', new Date().toISOString());

      if (error || !overdueTasks) {
        return { escalated: 0 };
      }

      for (const task of overdueTasks) {
        // Escalate based on how overdue
        const dueDate = new Date(task.due_date);
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        let newUrgency = task.urgency;
        if (daysOverdue >= 7) {
          newUrgency = 'CRITICAL';
        } else if (daysOverdue >= 3) {
          newUrgency = task.urgency === 'LOW' ? 'MEDIUM' : 'HIGH';
        }

        if (newUrgency !== task.urgency) {
          // Update task urgency
          await supabase
            .from('compliance_tasks')
            .update({ urgency: newUrgency })
            .eq('id', task.id);

          // Send escalation notification
          await this.sendNotifications({
            tenantId: task.tenant_id,
            personId: task.person_id || undefined,
            type: 'TASK_ESCALATION',
            urgency: newUrgency,
            title: `Task Escalated: ${task.title}`,
            message: `This task is ${daysOverdue} days overdue and has been escalated to ${newUrgency} priority.`,
            recipients: ['hr_manager', 'compliance_officer', 'registered_manager']
          });

          escalated++;
        }
      }

      console.log(`Escalations processed: ${escalated}`);
      return { escalated };
    } catch (error) {
      console.error('Escalation processing failed:', error);
      return { escalated: 0 };
    }
  }

  // =========================================
  // QUEUE MANAGEMENT
  // =========================================

  /**
   * Create a workflow task
   */
  async createTask(task: Omit<WorkflowTask, 'id' | 'status' | 'retryCount' | 'maxRetries'>): Promise<WorkflowTask> {
    const newTask: WorkflowTask = {
      ...task,
      id: crypto.randomUUID(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    };

    this.taskQueue.push(newTask);
    return newTask;
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) return;

    this.isProcessing = true;
    
    try {
      const task = this.taskQueue.shift();
      if (!task) return;

      task.status = 'in_progress';
      
      try {
        const result = await this.executeTask(task);
        task.status = 'completed';
        task.result = result;
        task.executedAt = new Date();
      } catch (error) {
        task.retryCount++;
        task.error = String(error);
        
        if (task.retryCount < task.maxRetries) {
          task.status = 'pending';
          this.taskQueue.push(task);
        } else {
          task.status = 'failed';
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a workflow task
   */
  private async executeTask(task: WorkflowTask): Promise<any> {
    switch (task.type) {
      case 'expiry_check':
        return this.runExpiryChecks();
      case 'reference_chase':
        return this.runReferenceChasers();
      case 'training_renewal':
        return this.processTrainingRenewals();
      case 'compliance_score_update':
        return complianceService.recalculateComplianceScore(task.entityId);
      case 'stage_progression':
        return complianceService.progressToNextStage(task.entityId);
      default:
        console.warn(`Unknown task type: ${task.type}`);
        return null;
    }
  }

  // =========================================
  // NOTIFICATIONS
  // =========================================

  /**
   * Send notifications to specified recipients
   */
  private async sendNotifications(params: {
    tenantId: string;
    personId?: string;
    documentId?: string;
    type: string;
    urgency: UrgencyLevel;
    title: string;
    message: string;
    recipients: string[];
  }): Promise<void> {
    try {
      // Create notification record
      await supabase.from('compliance_notifications').insert({
        tenant_id: params.tenantId,
        person_id: params.personId,
        document_id: params.documentId,
        notification_type: params.type,
        urgency: params.urgency,
        title: params.title,
        message: params.message,
        recipients: params.recipients.map(r => ({ role: r })),
        sent_at: new Date().toISOString(),
        in_app_sent: true
      });

      // In production, this would also trigger:
      // - Email notifications via integration service
      // - SMS for critical alerts
      // - Push notifications for mobile app

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // =========================================
  // REPORTING
  // =========================================

  /**
   * Get workflow status and statistics
   */
  async getWorkflowStatus(): Promise<{
    queueLength: number;
    processing: boolean;
    recentTasks: WorkflowTask[];
    statistics: {
      completed: number;
      failed: number;
      pending: number;
    };
  }> {
    return {
      queueLength: this.taskQueue.length,
      processing: this.isProcessing,
      recentTasks: this.taskQueue.slice(0, 10),
      statistics: {
        completed: 0, // Would query from database in production
        failed: 0,
        pending: this.taskQueue.filter(t => t.status === 'pending').length
      }
    };
  }

  /**
   * Run all workflows manually (for testing/admin)
   */
  async runAllWorkflows(tenantId: string): Promise<{
    expiryChecks: { processed: number; expired: number; reminded: number };
    referenceChase: { chased: number };
    trainingRenewals: { scheduled: number };
    stageProgressions: { progressed: number };
    escalations: { escalated: number };
  }> {
    console.log('Running all workflows manually...');
    
    const results = {
      expiryChecks: await this.runExpiryChecks(),
      referenceChase: await this.runReferenceChasers(),
      trainingRenewals: await this.processTrainingRenewals(),
      stageProgressions: await this.checkStageProgressions(tenantId),
      escalations: await this.processEscalations()
    };

    console.log('All workflows complete:', results);
    return results;
  }
}

// Export singleton instance
export const automatedWorkflowEngine = new AutomatedWorkflowEngine();
export default automatedWorkflowEngine;
