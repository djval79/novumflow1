/**
 * Document Data Hooks using React Query
 * 
 * Provides cached, optimized data fetching for document operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

export interface Document {
  id: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  expiry_date?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  uploaded_by: string;
  uploaded_at: string;
  version: number;
  is_current_version: boolean;
  replaced_by?: string;
  created_at: string;
  // Joined data
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
  };
  uploader?: {
    first_name: string;
    last_name: string;
  };
  verifier?: {
    first_name: string;
    last_name: string;
  };
  [key: string]: any;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  template_url?: string;
  required_fields?: string[];
  is_active: boolean;
  created_at: string;
  [key: string]: any;
}

export interface DocumentFilters {
  employee_id?: string;
  document_type?: string;
  is_verified?: boolean;
  expiring_before?: string;
  search?: string;
}

/**
 * Fetch all documents with optional filtering
 */
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: queryKeys.documents.list(filters),
    queryFn: async () => {
      try {
        log.info('Fetching documents', { filters });
        
        let query = supabase
          .from('documents')
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department
            )
          `)
          .eq('is_current_version', true)
          .order('uploaded_at', { ascending: false });

        // Apply filters
        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }
        if (filters?.document_type) {
          query = query.eq('document_type', filters.document_type);
        }
        if (filters?.is_verified !== undefined) {
          query = query.eq('is_verified', filters.is_verified);
        }
        if (filters?.expiring_before) {
          query = query.lte('expiry_date', filters.expiring_before);
        }
        if (filters?.search) {
          query = query.ilike('document_name', `%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch documents');
        }

        log.info(`Fetched ${data?.length || 0} documents`);
        return data as Document[];
      } catch (error) {
        throw handleError(error, 'useDocuments query failed');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single document by ID
 */
export function useDocument(id: string | null) {
  return useQuery({
    queryKey: queryKeys.documents.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        throw createError.validation('Document ID is required');
      }

      try {
        log.info('Fetching document', { id });

        const { data, error } = await supabase
          .from('documents')
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department,
              position
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Document', { id });
          }
          throw handleError(error, 'Failed to fetch document');
        }

        return data as Document;
      } catch (error) {
        throw handleError(error, 'useDocument query failed');
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch documents by employee ID
 */
export function useEmployeeDocuments(employeeId: string | null) {
  return useQuery({
    queryKey: ['documents', 'byEmployee', employeeId],
    queryFn: async () => {
      if (!employeeId) throw createError.validation('Employee ID is required');

      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('is_current_version', true)
          .order('document_type', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch employee documents');
        return data as Document[];
      } catch (error) {
        throw handleError(error, 'useEmployeeDocuments query failed');
      }
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch expiring documents (within 30 days)
 */
export function useExpiringDocuments(days: number = 30) {
  const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['documents', 'expiring', days],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('documents')
          .select(`
            *,
            employees (
              first_name,
              last_name,
              email,
              department
            )
          `)
          .eq('is_current_version', true)
          .gte('expiry_date', today)
          .lte('expiry_date', expiryDate)
          .order('expiry_date', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch expiring documents');
        return data as Document[];
      } catch (error) {
        throw handleError(error, 'useExpiringDocuments query failed');
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch unverified documents
 */
export function useUnverifiedDocuments() {
  return useQuery({
    queryKey: ['documents', 'unverified'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select(`
            *,
            employees (
              first_name,
              last_name,
              email,
              department
            )
          `)
          .eq('is_current_version', true)
          .eq('is_verified', false)
          .order('uploaded_at', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch unverified documents');
        return data as Document[];
      } catch (error) {
        throw handleError(error, 'useUnverifiedDocuments query failed');
      }
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Fetch document templates
 */
export function useDocumentTemplates() {
  return useQuery({
    queryKey: queryKeys.documents.templates,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('document_templates')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch document templates');
        return data as DocumentTemplate[];
      } catch (error) {
        throw handleError(error, 'useDocumentTemplates query failed');
      }
    },
    staleTime: 10 * 60 * 1000, // Templates change rarely
  });
}

/**
 * Fetch document version history
 */
export function useDocumentHistory(documentId: string | null) {
  return useQuery({
    queryKey: ['documents', 'history', documentId],
    queryFn: async () => {
      if (!documentId) throw createError.validation('Document ID is required');

      try {
        // First get the document to find related versions
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .select('employee_id, document_type, document_name')
          .eq('id', documentId)
          .single();

        if (docError) throw handleError(docError, 'Failed to fetch document');

        // Fetch all versions
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('employee_id', doc.employee_id)
          .eq('document_type', doc.document_type)
          .eq('document_name', doc.document_name)
          .order('version', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch document history');
        return data as Document[];
      } catch (error) {
        throw handleError(error, 'useDocumentHistory query failed');
      }
    },
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Upload new document (create record)
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentData: Partial<Document>) => {
      try {
        log.info('Creating document record', { data: documentData });

        const { data, error } = await supabase
          .from('documents')
          .insert({
            ...documentData,
            version: 1,
            is_current_version: true,
            is_verified: false,
            uploaded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to create document');
        }

        log.info('Document created successfully', { id: data.id });
        return data as Document;
      } catch (error) {
        throw handleError(error, 'useCreateDocument mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.documents.all);
      queryClient.setQueryData(queryKeys.documents.detail(data.id), data);
      log.track('document_uploaded', { documentId: data.id, documentType: data.document_type });
    },
  });
}

/**
 * Update document metadata
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Document> }) => {
      try {
        log.info('Updating document', { id, data });

        const { data: updated, error } = await supabase
          .from('documents')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update document');
        }

        log.info('Document updated successfully', { id });
        return updated as Document;
      } catch (error) {
        throw handleError(error, 'useUpdateDocument mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.documents.detail(data.id), data);
      invalidateQueries(queryKeys.documents.all);
      log.track('document_updated', { documentId: data.id });
    },
  });
}

/**
 * Verify document
 */
export function useVerifyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      verifierId, 
      notes 
    }: { 
      id: string; 
      verifierId: string; 
      notes?: string;
    }) => {
      try {
        log.info('Verifying document', { id, verifierId });

        const { data: updated, error } = await supabase
          .from('documents')
          .update({
            is_verified: true,
            verified_by: verifierId,
            verified_at: new Date().toISOString(),
            notes,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to verify document');
        }

        log.info('Document verified', { id });
        return updated as Document;
      } catch (error) {
        throw handleError(error, 'useVerifyDocument mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.documents.detail(data.id), data);
      invalidateQueries(queryKeys.documents.all);
      log.track('document_verified', { documentId: data.id });
    },
  });
}

/**
 * Upload new version of document
 */
export function useUploadDocumentVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      originalDocumentId, 
      newDocumentData 
    }: { 
      originalDocumentId: string; 
      newDocumentData: Partial<Document>;
    }) => {
      try {
        log.info('Uploading new document version', { originalDocumentId });

        // Get original document to increment version
        const { data: original, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', originalDocumentId)
          .single();

        if (fetchError) throw handleError(fetchError, 'Failed to fetch original document');

        // Mark original as not current
        const { error: updateError } = await supabase
          .from('documents')
          .update({ is_current_version: false })
          .eq('id', originalDocumentId);

        if (updateError) throw handleError(updateError, 'Failed to update original document');

        // Create new version
        const { data: newDoc, error: createError } = await supabase
          .from('documents')
          .insert({
            ...newDocumentData,
            employee_id: original.employee_id,
            document_type: original.document_type,
            version: original.version + 1,
            is_current_version: true,
            is_verified: false,
            uploaded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw handleError(createError, 'Failed to create new version');

        // Update original to point to new version
        await supabase
          .from('documents')
          .update({ replaced_by: newDoc.id })
          .eq('id', originalDocumentId);

        log.info('New document version uploaded', { id: newDoc.id, version: newDoc.version });
        return newDoc as Document;
      } catch (error) {
        throw handleError(error, 'useUploadDocumentVersion mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.documents.all);
      queryClient.setQueryData(queryKeys.documents.detail(data.id), data);
      log.track('document_version_uploaded', { documentId: data.id, version: data.version });
    },
  });
}

/**
 * Delete document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting document', { id });

        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', id);

        if (error) {
          throw handleError(error, 'Failed to delete document');
        }

        log.info('Document deleted successfully', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteDocument mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.documents.detail(id) });
      invalidateQueries(queryKeys.documents.all);
      log.track('document_deleted', { documentId: id });
    },
  });
}

/**
 * Get document types (for dropdowns)
 */
export function useDocumentTypes() {
  return useQuery({
    queryKey: ['documents', 'types'],
    queryFn: async () => {
      // Common document types - could also be fetched from DB if dynamic
      return [
        { value: 'passport', label: 'Passport' },
        { value: 'visa', label: 'Visa' },
        { value: 'work_permit', label: 'Work Permit' },
        { value: 'id_card', label: 'ID Card' },
        { value: 'driving_license', label: 'Driving License' },
        { value: 'dbs_certificate', label: 'DBS Certificate' },
        { value: 'qualification', label: 'Qualification/Certificate' },
        { value: 'contract', label: 'Employment Contract' },
        { value: 'reference', label: 'Reference Letter' },
        { value: 'medical', label: 'Medical Certificate' },
        { value: 'training', label: 'Training Certificate' },
        { value: 'policy', label: 'Policy Document' },
        { value: 'other', label: 'Other' },
      ];
    },
    staleTime: Infinity, // Static data
  });
}
