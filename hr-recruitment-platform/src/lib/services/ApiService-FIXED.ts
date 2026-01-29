// Enhanced API Service with Robust Error Handling and Security
// Fixed: Input validation, rate limiting, error boundaries, retry logic

import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

// API Error Types
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError extends Error {
  type: ApiErrorType;
  code?: string;
  status?: number;
  details?: any;
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input validation schemas
export const validationSchemas = {
  employee: {
    required: ['first_name', 'last_name', 'email', 'department', 'position', 'employment_type'],
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    salary: { min: 0, max: 1000000 }
  },
  job: {
    required: ['title', 'description', 'department', 'employment_type', 'location'],
    title: { minLength: 3, maxLength: 200 },
    description: { minLength: 50, maxLength: 2000 },
    salary: { min: 0, max: 1000000 }
  },
  application: {
    required: ['first_name', 'last_name', 'email', 'job_id'],
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    cover_letter: { maxLength: 5000 }
  },
  document: {
    required: ['title', 'document_type', 'employee_id'],
    title: { minLength: 1, maxLength: 200 },
    file: { maxSize: 10 * 1024 * 1024, types: ['pdf', 'doc', 'docx', 'jpg', 'png'] } // 10MB
  }
};

// Error handling utilities
export class ApiErrorHandler {
  static createError(
    message: string,
    type: ApiErrorType = ApiErrorType.UNKNOWN_ERROR,
    code?: string,
    status?: number,
    details?: any
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.type = type;
    error.code = code;
    error.status = status;
    error.details = details;
    return error;
  }

  static handleSupabaseError(error: any): ApiError {
    if (!error) return this.createError('Unknown error occurred');

    const message = error.message || 'An error occurred';
    
    // Handle specific Supabase errors
    if (error.code === 'PGRST116') {
      return this.createError('Invalid credentials', ApiErrorType.AUTHENTICATION_ERROR, 'INVALID_CREDENTIALS', 401);
    }
    
    if (error.code === 'PGRST301') {
      return this.createError('Access denied', ApiErrorType.AUTHORIZATION_ERROR, 'ACCESS_DENIED', 403);
    }
    
    if (error.code === 'PGRST116') {
      return this.createError('Record not found', ApiErrorType.NOT_FOUND_ERROR, 'NOT_FOUND', 404);
    }
    
    if (error.code?.startsWith('23505')) {
      return this.createError('Duplicate entry', ApiErrorType.VALIDATION_ERROR, 'DUPLICATE_ENTRY', 409);
    }
    
    // Handle network errors
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return this.createError('Network connection failed', ApiErrorType.NETWORK_ERROR, 'NETWORK_ERROR', 0);
    }
    
    // Handle server errors
    if (error.status >= 500) {
      return this.createError('Server error', ApiErrorType.SERVER_ERROR, 'SERVER_ERROR', error.status);
    }
    
    return this.createError(message, ApiErrorType.UNKNOWN_ERROR, error.code, error.status);
  }

  static isRetryableError(error: ApiError): boolean {
    return error.type === ApiErrorType.NETWORK_ERROR || 
           error.type === ApiErrorType.SERVER_ERROR ||
           (error.status && error.status >= 500);
  }
}

// Rate limiting utilities
export class RateLimiter {
  static isRateLimitExceeded(key: string): boolean {
    const now = Date.now();
    const limit = rateLimitStore.get(key);
    
    if (!limit || now > limit.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_CONFIG.windowMs });
      return false;
    }
    
    if (limit.count >= RATE_LIMIT_CONFIG.maxRequests) {
      return true;
    }
    
    limit.count++;
    return false;
  }

  static resetLimit(key: string): void {
    rateLimitStore.delete(key);
  }
}

// Enhanced API service functions
export class ApiService {
  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = RATE_LIMIT_CONFIG.retryAttempts
  ): Promise<T> {
    let lastError: ApiError | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        
        // Reset rate limit on successful operation
        RateLimiter.resetLimit(operationName);
        
        return result;
      } catch (error: any) {
        lastError = ApiErrorHandler.handleSupabaseError(error);
        
        log.warn(`API operation failed (attempt ${attempt}/${retries})`, {
          component: 'ApiService',
          action: operationName,
          error: lastError,
          metadata: { attempt, retries }
        });
        
        // Don't retry on client errors (4xx) except rate limits
        if (lastError.status && lastError.status >= 400 && lastError.status < 500 && lastError.status !== 429) {
          break;
        }
        
        // Don't retry on authentication errors
        if (lastError.type === ApiErrorType.AUTHENTICATION_ERROR || 
            lastError.type === ApiErrorType.AUTHORIZATION_ERROR) {
          break;
        }
        
        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Validation utilities
  static validateInput<T>(data: T, schema: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!data[field as keyof T] || (typeof data[field as keyof T] === 'string' && !(data[field as keyof T] as string).trim())) {
          errors.push(`${field} is required`);
        }
      }
    }
    
    // Check email format
    if (schema.email && data.email) {
      const email = data.email as string;
      if (!schema.email.test(email)) {
        errors.push('Invalid email format');
      }
    }
    
    // Check phone format
    if (schema.phone && data.phone) {
      const phone = data.phone as string;
      if (!schema.phone.test(phone)) {
        errors.push('Invalid phone number format');
      }
    }
    
    // Check string length constraints
    if (schema.title && data.title) {
      const title = data.title as string;
      if (title.length < (schema.title.minLength || 0)) {
        errors.push(`Title must be at least ${schema.title.minLength} characters`);
      }
      if (title.length > (schema.title.maxLength || Infinity)) {
        errors.push(`Title must not exceed ${schema.title.maxLength} characters`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // Employee API functions
  static async createEmployee(employeeData: any): Promise<any> {
    const key = 'create_employee';
    
    if (RateLimiter.isRateLimitExceeded(key)) {
      throw ApiErrorHandler.createError('Rate limit exceeded', ApiErrorType.RATE_LIMIT_ERROR, 'RATE_LIMIT', 429);
    }
    
    // Validate input
    const validation = this.validateInput(employeeData, validationSchemas.employee);
    if (!validation.isValid) {
      throw ApiErrorHandler.createError(
        `Validation failed: ${validation.errors.join(', ')}`,
        ApiErrorType.VALIDATION_ERROR,
        'VALIDATION_FAILED',
        400,
        { errors: validation.errors }
      );
    }
    
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          ...employeeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'createEmployee');
  }

  static async updateEmployee(id: string, employeeData: any): Promise<any> {
    const key = 'update_employee';
    
    if (RateLimiter.isRateLimitExceeded(key)) {
      throw ApiErrorHandler.createError('Rate limit exceeded', ApiErrorType.RATE_LIMIT_ERROR, 'RATE_LIMIT', 429);
    }
    
    // Validate input (exclude optional fields)
    const validation = this.validateInput(employeeData, validationSchemas.employee);
    if (!validation.isValid) {
      throw ApiErrorHandler.createError(
        `Validation failed: ${validation.errors.join(', ')}`,
        ApiErrorType.VALIDATION_ERROR,
        'VALIDATION_FAILED',
        400,
        { errors: validation.errors }
      );
    }
    
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('employees')
        .update({
          ...employeeData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'updateEmployee');
  }

  static async getEmployees(filters?: {
    department?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    return this.executeWithRetry(async () => {
      let query = supabase
        .from('employees')
        .select('*');
      
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, 'getEmployees');
  }

  static async deleteEmployee(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // Soft delete for audit trail
      const { error } = await supabase
        .from('employees')
        .update({ 
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    }, 'deleteEmployee');
  }

  // Job API functions
  static async createJob(jobData: any): Promise<any> {
    const key = 'create_job';
    
    if (RateLimiter.isRateLimitExceeded(key)) {
      throw ApiErrorHandler.createError('Rate limit exceeded', ApiErrorType.RATE_LIMIT_ERROR, 'RATE_LIMIT', 429);
    }
    
    // Validate input
    const validation = this.validateInput(jobData, validationSchemas.job);
    if (!validation.isValid) {
      throw ApiErrorHandler.createError(
        `Validation failed: ${validation.errors.join(', ')}`,
        ApiErrorType.VALIDATION_ERROR,
        'VALIDATION_FAILED',
        400,
        { errors: validation.errors }
      );
    }
    
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          ...jobData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'createJob');
  }

  static async getJobs(filters?: {
    status?: string;
    department?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    return this.executeWithRetry(async () => {
      let query = supabase
        .from('jobs')
        .select('*');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, 'getJobs');
  }

  // Application API functions
  static async createApplication(applicationData: any): Promise<any> {
    const key = 'create_application';
    
    if (RateLimiter.isRateLimitExceeded(key)) {
      throw ApiErrorHandler.createError('Rate limit exceeded', ApiErrorType.RATE_LIMIT_ERROR, 'RATE_LIMIT', 429);
    }
    
    // Validate input
    const validation = this.validateInput(applicationData, validationSchemas.application);
    if (!validation.isValid) {
      throw ApiErrorHandler.createError(
        `Validation failed: ${validation.errors.join(', ')}`,
        ApiErrorType.VALIDATION_ERROR,
        'VALIDATION_FAILED',
        400,
        { errors: validation.errors }
      );
    }
    
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          ...applicationData,
          status: 'applied',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'createApplication');
  }

  static async updateApplicationStatus(id: string, status: string, notes?: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('applications')
        .update({ 
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'updateApplicationStatus');
  }

  // Document API functions with enhanced security
  static async uploadDocument(documentData: any, file: File): Promise<any> {
    const key = 'upload_document';
    
    if (RateLimiter.isRateLimitExceeded(key)) {
      throw ApiErrorHandler.createError('Rate limit exceeded', ApiErrorType.RATE_LIMIT_ERROR, 'RATE_LIMIT', 429);
    }
    
    // Validate file
    const validation = this.validateInput(documentData, validationSchemas.document);
    if (!validation.isValid) {
      throw ApiErrorHandler.createError(
        `Validation failed: ${validation.errors.join(', ')}`,
        ApiErrorType.VALIDATION_ERROR,
        'VALIDATION_FAILED',
        400,
        { errors: validation.errors }
      );
    }
    
    // Validate file
    const maxSize = validationSchemas.document.file.maxSize;
    const allowedTypes = validationSchemas.document.file.types;
    
    if (file.size > maxSize) {
      throw ApiErrorHandler.createError(
        `File size exceeds ${Math.round(maxSize / (1024 * 1024))MB limit`,
        ApiErrorType.VALIDATION_ERROR,
        'FILE_TOO_LARGE',
        413
      );
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw ApiErrorHandler.createError(
        `File type ${fileExtension} not allowed`,
        ApiErrorType.VALIDATION_ERROR,
        'INVALID_FILE_TYPE',
        415
      );
    }
    
    return this.executeWithRetry(async () => {
      // Upload file to storage
      const fileName = `documents/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...documentData,
          file_url: uploadData.path,
          file_size: file.size,
          file_type: fileExtension,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'uploadDocument');
  }

  // Batch operations for performance
  static async bulkUpdate<T>(
    table: string,
    updates: { id: string; data: Partial<T> }[]
  ): Promise<any[]> {
    const key = `bulk_update_${table}`;
    
    if (RateLimiter.isRateLimitExceeded(key)) {
      throw ApiErrorHandler.createError('Rate limit exceeded', ApiErrorType.RATE_LIMIT_ERROR, 'RATE_LIMIT', 429);
    }
    
    return this.executeWithRetry(async () => {
      const results = [];
      
      for (const update of updates) {
        const { data, error } = await supabase
          .from(table)
          .update({
            ...update.data,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .select()
          .single();
        
        if (error) throw error;
        results.push(data);
      }
      
      return results;
    }, `bulkUpdate_${table}`);
  }

  // Analytics and monitoring
  static async getApiMetrics(): Promise<any> {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data || [];
    }, 'getApiMetrics');
  }

  // Health check
  static async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    const checks = {
      database: false,
      storage: false,
      auth: false
    };
    
    try {
      // Check database connectivity
      const { error: dbError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);
      
      checks.database = !dbError;
      
      // Check storage connectivity
      const { error: storageError } = await supabase.storage
        .from('documents')
        .list();
      
      checks.storage = !storageError;
      
      // Check auth service
      const { data: authData, error: authError } = await supabase.auth.getSession();
      checks.auth = !authError;
      
      const failedChecks = Object.entries(checks).filter(([_, passed]) => !passed).length;
      let status: 'healthy' | 'degraded' | 'unhealthy';
      
      if (failedChecks === 0) {
        status = 'healthy';
      } else if (failedChecks === 1) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return { status, details: checks };
    } catch (error: any) {
      log.error('Health check failed', error, { component: 'ApiService' });
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

// React Hook for using API service
export const useApiService = () => {
  return {
    createEmployee: ApiService.createEmployee,
    updateEmployee: ApiService.updateEmployee,
    getEmployees: ApiService.getEmployees,
    deleteEmployee: ApiService.deleteEmployee,
    createJob: ApiService.createJob,
    getJobs: ApiService.getJobs,
    createApplication: ApiService.createApplication,
    updateApplicationStatus: ApiService.updateApplicationStatus,
    uploadDocument: ApiService.uploadDocument,
    bulkUpdate: ApiService.bulkUpdate,
    getApiMetrics: ApiService.getApiMetrics,
    healthCheck: ApiService.healthCheck
  };
};