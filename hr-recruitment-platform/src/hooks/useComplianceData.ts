/**
 * Supabase Hooks for Compliance Data
 * 
 * Provides React Query hooks for fetching and mutating compliance data
 * Integrates with the compliance database schema
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { 
  ComplianceAuthority, 
  ComplianceStage, 
  DocumentStatus, 
  UrgencyLevel 
} from '@/lib/compliance/complianceTypes';

// ===========================================
// TYPES - Matching Database Schema
// ===========================================

export interface CompliancePerson {
  id: string;
  tenant_id: string;
  external_id?: string;
  source_system: 'NOVUMFLOW' | 'CAREFLOW' | 'BOTH';
  person_type: 'APPLICANT' | 'CANDIDATE' | 'NEW_HIRE' | 'EMPLOYEE' | 'FORMER_EMPLOYEE';
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  requires_sponsorship: boolean;
  visa_type?: string;
  visa_expiry_date?: string;
  brp_number?: string;
  share_code?: string;
  ni_number?: string;
  dbs_certificate_number?: string;
  dbs_issue_date?: string;
  dbs_update_service: boolean;
  nmc_pin?: string;
  nmc_expiry_date?: string;
  current_stage: ComplianceStage;
  start_date?: string;
  end_date?: string;
  job_title?: string;
  department?: string;
  location?: string;
  line_manager?: string;
  compliance_status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' | 'PENDING';
  overall_compliance_score: number;
  home_office_score: number;
  cqc_score: number;
  last_compliance_check?: string;
  notes?: string;
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
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  uploaded_by: string;
  uploaded_at: string;
  verified_by?: string;
  verified_at?: string;
  rejected_reason?: string;
  expiry_date?: string;
  issue_date?: string;
  document_number?: string;
  authority: ComplianceAuthority;
  version: number;
  is_current: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  document_type_name?: string;
  person_name?: string;
}

export interface ComplianceTask {
  id: string;
  tenant_id: string;
  person_id?: string;
  document_id?: string;
  title: string;
  description?: string;
  task_type: string;
  urgency: UrgencyLevel;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  auto_generated: boolean;
  automation_rule_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  person_name?: string;
}

export interface ComplianceFolder {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  folder_type: 'HOME_OFFICE' | 'CQC' | 'BOTH' | 'INTERNAL';
  parent_id?: string;
  color: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  document_count?: number;
}

export interface ComplianceNotification {
  id: string;
  tenant_id: string;
  person_id?: string;
  document_id?: string;
  notification_type: string;
  title: string;
  message: string;
  urgency: UrgencyLevel;
  recipients: string[];
  sent_at?: string;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ComplianceStats {
  totalPersons: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  pending: number;
  expiringDocuments: number;
  pendingVerifications: number;
  byStage: Record<ComplianceStage, number>;
  byAuthority: {
    homeOffice: { total: number; compliant: number; score: number };
    cqc: { total: number; compliant: number; score: number };
  };
  recentActivity: any[];
}

export interface ExpiringDocument {
  id: string;
  person_id: string;
  person_name: string;
  person_email: string;
  document_type: string;
  authority: ComplianceAuthority;
  expiry_date: string;
  days_until_expiry: number;
  urgency: UrgencyLevel;
  status: DocumentStatus;
}

// ===========================================
// QUERY KEYS
// ===========================================

export const complianceKeys = {
  all: ['compliance'] as const,
  persons: (tenantId: string) => [...complianceKeys.all, 'persons', tenantId] as const,
  person: (tenantId: string, id: string) => [...complianceKeys.persons(tenantId), id] as const,
  documents: (tenantId: string) => [...complianceKeys.all, 'documents', tenantId] as const,
  document: (tenantId: string, id: string) => [...complianceKeys.documents(tenantId), id] as const,
  personDocuments: (tenantId: string, personId: string) => [...complianceKeys.documents(tenantId), 'person', personId] as const,
  tasks: (tenantId: string) => [...complianceKeys.all, 'tasks', tenantId] as const,
  folders: (tenantId: string) => [...complianceKeys.all, 'folders', tenantId] as const,
  notifications: (tenantId: string) => [...complianceKeys.all, 'notifications', tenantId] as const,
  stats: (tenantId: string) => [...complianceKeys.all, 'stats', tenantId] as const,
  expiring: (tenantId: string, days: number) => [...complianceKeys.all, 'expiring', tenantId, days] as const,
  audit: (tenantId: string) => [...complianceKeys.all, 'audit', tenantId] as const,
};

// ===========================================
// HOOKS - PERSONS
// ===========================================

export function useCompliancePersons(tenantId: string, options?: {
  stage?: ComplianceStage;
  status?: CompliancePerson['compliance_status'];
  search?: string;
}) {
  return useQuery({
    queryKey: [...complianceKeys.persons(tenantId), options],
    queryFn: async () => {
      let query = supabase
        .from('compliance_persons')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false });

      if (options?.stage) {
        query = query.eq('current_stage', options.stage);
      }
      if (options?.status) {
        query = query.eq('compliance_status', options.status);
      }
      if (options?.search) {
        query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CompliancePerson[];
    },
    enabled: !!tenantId,
  });
}

export function useCompliancePerson(tenantId: string, personId: string) {
  return useQuery({
    queryKey: complianceKeys.person(tenantId, personId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_persons')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', personId)
        .single();

      if (error) throw error;
      return data as CompliancePerson;
    },
    enabled: !!tenantId && !!personId,
  });
}

export function useCreateCompliancePerson(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (person: Partial<CompliancePerson>) => {
      const { data, error } = await supabase
        .from('compliance_persons')
        .insert({ ...person, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data as CompliancePerson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.persons(tenantId) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats(tenantId) });
    },
  });
}

export function useUpdateCompliancePerson(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CompliancePerson> }) => {
      const { data, error } = await supabase
        .from('compliance_persons')
        .update(updates)
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CompliancePerson;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.persons(tenantId) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.person(tenantId, data.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats(tenantId) });
    },
  });
}

// ===========================================
// HOOKS - DOCUMENTS
// ===========================================

export function useComplianceDocuments(tenantId: string, options?: {
  personId?: string;
  status?: DocumentStatus;
  authority?: ComplianceAuthority;
}) {
  return useQuery({
    queryKey: [...complianceKeys.documents(tenantId), options],
    queryFn: async () => {
      let query = supabase
        .from('compliance_documents')
        .select(`
          *,
          compliance_document_types(name, authority),
          compliance_persons(full_name, email)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_current', true)
        .order('updated_at', { ascending: false });

      if (options?.personId) {
        query = query.eq('person_id', options.personId);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.authority) {
        query = query.eq('authority', options.authority);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((doc: any) => ({
        ...doc,
        document_type_name: doc.compliance_document_types?.name,
        person_name: doc.compliance_persons?.full_name,
      })) as ComplianceDocument[];
    },
    enabled: !!tenantId,
  });
}

export function usePersonDocuments(tenantId: string, personId: string) {
  return useQuery({
    queryKey: complianceKeys.personDocuments(tenantId, personId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .select(`
          *,
          compliance_document_types(name, authority, has_expiry)
        `)
        .eq('tenant_id', tenantId)
        .eq('person_id', personId)
        .eq('is_current', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((doc: any) => ({
        ...doc,
        document_type_name: doc.compliance_document_types?.name,
      })) as ComplianceDocument[];
    },
    enabled: !!tenantId && !!personId,
  });
}

export function useUploadDocument(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Partial<ComplianceDocument>) => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .insert({ ...document, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data as ComplianceDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.documents(tenantId) });
      if (data.person_id) {
        queryClient.invalidateQueries({ queryKey: complianceKeys.personDocuments(tenantId, data.person_id) });
      }
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats(tenantId) });
    },
  });
}

export function useVerifyDocument(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, verified, rejectedReason }: { 
      documentId: string; 
      verified: boolean; 
      rejectedReason?: string 
    }) => {
      const updates: Partial<ComplianceDocument> = {
        status: verified ? 'VERIFIED' : 'REJECTED',
        verified_at: verified ? new Date().toISOString() : undefined,
        rejected_reason: !verified ? rejectedReason : undefined,
      };

      const { data, error } = await supabase
        .from('compliance_documents')
        .update(updates)
        .eq('tenant_id', tenantId)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data as ComplianceDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.documents(tenantId) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats(tenantId) });
    },
  });
}

// ===========================================
// HOOKS - EXPIRING DOCUMENTS VIEW
// ===========================================

export function useExpiringDocuments(tenantId: string, daysAhead: number = 30) {
  return useQuery({
    queryKey: complianceKeys.expiring(tenantId, daysAhead),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_expiring_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .lte('days_until_expiry', daysAhead)
        .order('days_until_expiry', { ascending: true });

      if (error) throw error;
      
      return (data || []).map((doc: any) => ({
        ...doc,
        urgency: doc.days_until_expiry <= 0 ? 'CRITICAL' 
               : doc.days_until_expiry <= 7 ? 'HIGH'
               : doc.days_until_expiry <= 30 ? 'MEDIUM' 
               : 'LOW'
      })) as ExpiringDocument[];
    },
    enabled: !!tenantId,
  });
}

// ===========================================
// HOOKS - TASKS
// ===========================================

export function useComplianceTasks(tenantId: string, options?: {
  status?: ComplianceTask['status'];
  urgency?: UrgencyLevel;
  personId?: string;
}) {
  return useQuery({
    queryKey: [...complianceKeys.tasks(tenantId), options],
    queryFn: async () => {
      let query = supabase
        .from('compliance_tasks')
        .select(`
          *,
          compliance_persons(full_name)
        `)
        .eq('tenant_id', tenantId)
        .order('urgency', { ascending: true })
        .order('due_date', { ascending: true });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.urgency) {
        query = query.eq('urgency', options.urgency);
      }
      if (options?.personId) {
        query = query.eq('person_id', options.personId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((task: any) => ({
        ...task,
        person_name: task.compliance_persons?.full_name,
      })) as ComplianceTask[];
    },
    enabled: !!tenantId,
  });
}

export function useUpdateTask(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ComplianceTask> }) => {
      const { data, error } = await supabase
        .from('compliance_tasks')
        .update(updates)
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComplianceTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.tasks(tenantId) });
    },
  });
}

// ===========================================
// HOOKS - FOLDERS
// ===========================================

export function useComplianceFolders(tenantId: string) {
  return useQuery({
    queryKey: complianceKeys.folders(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_folders')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ComplianceFolder[];
    },
    enabled: !!tenantId,
  });
}

// ===========================================
// HOOKS - NOTIFICATIONS
// ===========================================

export function useComplianceNotifications(tenantId: string, options?: {
  unreadOnly?: boolean;
  urgency?: UrgencyLevel;
}) {
  return useQuery({
    queryKey: [...complianceKeys.notifications(tenantId), options],
    queryFn: async () => {
      let query = supabase
        .from('compliance_notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (options?.unreadOnly) {
        query = query.is('read_at', null);
      }
      if (options?.urgency) {
        query = query.eq('urgency', options.urgency);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ComplianceNotification[];
    },
    enabled: !!tenantId,
  });
}

export function useMarkNotificationRead(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('compliance_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.notifications(tenantId) });
    },
  });
}

// ===========================================
// HOOKS - DASHBOARD STATS
// ===========================================

export function useComplianceStats(tenantId: string) {
  return useQuery({
    queryKey: complianceKeys.stats(tenantId),
    queryFn: async () => {
      // Fetch persons for status counts
      const { data: persons, error: personsError } = await supabase
        .from('compliance_persons')
        .select('id, compliance_status, current_stage, home_office_score, cqc_score')
        .eq('tenant_id', tenantId);

      if (personsError) throw personsError;

      // Fetch pending verifications
      const { count: pendingVerifications, error: pendingError } = await supabase
        .from('compliance_documents')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['UPLOADED', 'UNDER_REVIEW']);

      if (pendingError) throw pendingError;

      // Fetch expiring documents (next 30 days)
      const { count: expiringDocs, error: expiringError } = await supabase
        .from('v_expiring_documents')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lte('days_until_expiry', 30);

      if (expiringError) throw expiringError;

      // Fetch recent activity
      const { data: activity, error: activityError } = await supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      // Calculate stats
      const personsList = persons || [];
      const stats: ComplianceStats = {
        totalPersons: personsList.length,
        compliant: personsList.filter(p => p.compliance_status === 'COMPLIANT').length,
        atRisk: personsList.filter(p => p.compliance_status === 'AT_RISK').length,
        nonCompliant: personsList.filter(p => p.compliance_status === 'NON_COMPLIANT').length,
        pending: personsList.filter(p => p.compliance_status === 'PENDING').length,
        expiringDocuments: expiringDocs || 0,
        pendingVerifications: pendingVerifications || 0,
        byStage: {
          APPLICATION: personsList.filter(p => p.current_stage === 'APPLICATION').length,
          PRE_EMPLOYMENT: personsList.filter(p => p.current_stage === 'PRE_EMPLOYMENT').length,
          ONBOARDING: personsList.filter(p => p.current_stage === 'ONBOARDING').length,
          ONGOING: personsList.filter(p => p.current_stage === 'ONGOING').length,
          OFFBOARDING: personsList.filter(p => p.current_stage === 'OFFBOARDING').length,
        },
        byAuthority: {
          homeOffice: {
            total: personsList.length,
            compliant: personsList.filter(p => p.home_office_score >= 100).length,
            score: personsList.length > 0 
              ? Math.round(personsList.reduce((sum, p) => sum + (p.home_office_score || 0), 0) / personsList.length)
              : 0,
          },
          cqc: {
            total: personsList.length,
            compliant: personsList.filter(p => p.cqc_score >= 100).length,
            score: personsList.length > 0
              ? Math.round(personsList.reduce((sum, p) => sum + (p.cqc_score || 0), 0) / personsList.length)
              : 0,
          },
        },
        recentActivity: activity || [],
      };

      return stats;
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // Refresh every minute
  });
}

// ===========================================
// HOOKS - AUDIT LOG
// ===========================================

export function useComplianceAuditLog(tenantId: string, options?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...complianceKeys.audit(tenantId), options],
    queryFn: async () => {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 100);

      if (options?.entityType) {
        query = query.eq('entity_type', options.entityType);
      }
      if (options?.entityId) {
        query = query.eq('entity_id', options.entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

// ===========================================
// HOOKS - COMPLIANCE SCORE CALCULATION
// ===========================================

export function useCalculateComplianceScore(tenantId: string, personId: string) {
  return useQuery({
    queryKey: ['compliance-score', tenantId, personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_compliance_score', { p_person_id: personId });

      if (error) throw error;
      return data as { 
        home_office_score: number; 
        cqc_score: number; 
        overall_score: number;
        compliance_status: string;
      };
    },
    enabled: !!tenantId && !!personId,
  });
}

// ===========================================
// EXPORT DEFAULT
// ===========================================

export default {
  useCompliancePersons,
  useCompliancePerson,
  useCreateCompliancePerson,
  useUpdateCompliancePerson,
  useComplianceDocuments,
  usePersonDocuments,
  useUploadDocument,
  useVerifyDocument,
  useExpiringDocuments,
  useComplianceTasks,
  useUpdateTask,
  useComplianceFolders,
  useComplianceNotifications,
  useMarkNotificationRead,
  useComplianceStats,
  useComplianceAuditLog,
  useCalculateComplianceScore,
};
