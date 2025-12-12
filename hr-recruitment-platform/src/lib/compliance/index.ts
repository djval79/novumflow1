/**
 * Compliance Module Index
 * 
 * Central export for all compliance-related functionality
 */

// Types and Constants
export * from './complianceTypes';

// Services
export { complianceService, default as ComplianceService } from './ComplianceService';
export { documentClassificationService, default as DocumentClassificationService } from './DocumentClassificationService';
export { crossAppSyncService, default as CrossAppSyncService } from './CrossAppSyncService';
export { automatedWorkflowEngine, default as AutomatedWorkflowEngine } from './AutomatedWorkflowEngine';

// Re-export commonly used types
export type {
  CompliancePerson,
  ComplianceDocument,
  ComplianceChecklistItem,
  ComplianceTask,
  ComplianceFolder
} from './ComplianceService';

export type {
  ClassificationResult,
  ExtractedDocumentData
} from './DocumentClassificationService';

export type {
  SyncConfig,
  SyncResult,
  SyncStatus
} from './CrossAppSyncService';

export type {
  WorkflowTask,
  WorkflowTaskType,
  WorkflowRule
} from './AutomatedWorkflowEngine';
