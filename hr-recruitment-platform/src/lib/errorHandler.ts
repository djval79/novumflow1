/**
 * Centralized Error Handling Utility
 * 
 * Provides consistent error handling across the application
 * Sanitizes errors for production to prevent information leakage
 */

import { log } from './logger';

const isProduction = import.meta.env.MODE === 'production';

/**
 * Standard error codes for the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION = 'INVALID_OPERATION',
  WORKFLOW_ERROR = 'WORKFLOW_ERROR',
  
  // File Operations
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: Record<string, any>,
    public originalError?: Error | unknown
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (isProduction) {
      // Return generic messages in production
      return this.getGenericMessage();
    }
    return this.message;
  }

  /**
   * Get generic error message based on code
   */
  private getGenericMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.AUTH_REQUIRED]: 'Authentication required. Please log in.',
      [ErrorCode.AUTH_INVALID]: 'Invalid authentication credentials.',
      [ErrorCode.AUTH_EXPIRED]: 'Your session has expired. Please log in again.',
      [ErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
      
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.INVALID_INPUT]: 'Invalid input provided.',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
      
      [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
      [ErrorCode.RECORD_NOT_FOUND]: 'The requested record was not found.',
      [ErrorCode.DUPLICATE_RECORD]: 'A record with this information already exists.',
      [ErrorCode.CONSTRAINT_VIOLATION]: 'This operation violates a data constraint.',
      
      [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
      [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      
      [ErrorCode.BUSINESS_RULE_VIOLATION]: 'This operation is not allowed.',
      [ErrorCode.INVALID_OPERATION]: 'Invalid operation.',
      [ErrorCode.WORKFLOW_ERROR]: 'Workflow error occurred.',
      
      [ErrorCode.FILE_UPLOAD_ERROR]: 'File upload failed. Please try again.',
      [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit.',
      [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type. Please upload a supported file format.',
      
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Please contact support.',
    };

    return messages[this.code] || messages[ErrorCode.UNKNOWN_ERROR];
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      error: {
        message: this.getUserMessage(),
        code: this.code,
        ...(isProduction ? {} : {
          details: this.details,
          stack: this.stack,
        }),
      },
    };
  }
}

/**
 * Handle and normalize errors from various sources
 */
export function handleError(error: unknown, context?: string): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    log.error(context || 'Application error', error);
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return normalizeError(error, context);
  }

  // Unknown error type
  log.error(context || 'Unknown error type', error);
  return new AppError(
    'An unexpected error occurred',
    ErrorCode.UNKNOWN_ERROR,
    500,
    undefined,
    error
  );
}

/**
 * Normalize standard errors to AppError
 */
function normalizeError(error: Error, context?: string): AppError {
  const message = error.message.toLowerCase();

  // Authentication errors
  if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
    return new AppError(
      error.message,
      ErrorCode.AUTH_INVALID,
      401,
      undefined,
      error
    );
  }

  // Permission errors
  if (message.includes('permission') || message.includes('forbidden')) {
    return new AppError(
      error.message,
      ErrorCode.PERMISSION_DENIED,
      403,
      undefined,
      error
    );
  }

  // Not found errors
  if (message.includes('not found')) {
    return new AppError(
      error.message,
      ErrorCode.RECORD_NOT_FOUND,
      404,
      undefined,
      error
    );
  }

  // Duplicate errors
  if (message.includes('duplicate') || message.includes('unique constraint')) {
    return new AppError(
      error.message,
      ErrorCode.DUPLICATE_RECORD,
      409,
      undefined,
      error
    );
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return new AppError(
      error.message,
      ErrorCode.NETWORK_ERROR,
      503,
      undefined,
      error
    );
  }

  // Service unavailable
  if (message.includes('unavailable') || message.includes('503')) {
    return new AppError(
      error.message,
      ErrorCode.SERVICE_UNAVAILABLE,
      503,
      undefined,
      error
    );
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return new AppError(
      error.message,
      ErrorCode.TIMEOUT_ERROR,
      504,
      undefined,
      error
    );
  }

  // Default to internal error
  log.error(context || 'Unhandled error', error);
  return new AppError(
    error.message,
    ErrorCode.INTERNAL_ERROR,
    500,
    undefined,
    error
  );
}

/**
 * Create specific error types
 */
export const createError = {
  auth: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorCode.AUTH_REQUIRED, 401, details),
  
  authInvalid: (message: string = 'Invalid credentials', details?: Record<string, any>) =>
    new AppError(message, ErrorCode.AUTH_INVALID, 401, details),
  
  permission: (message: string = 'Permission denied', details?: Record<string, any>) =>
    new AppError(message, ErrorCode.PERMISSION_DENIED, 403, details),
  
  notFound: (resource: string, details?: Record<string, any>) =>
    new AppError(`${resource} not found`, ErrorCode.RECORD_NOT_FOUND, 404, details),
  
  validation: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorCode.VALIDATION_ERROR, 400, details),
  
  duplicate: (resource: string, details?: Record<string, any>) =>
    new AppError(`${resource} already exists`, ErrorCode.DUPLICATE_RECORD, 409, details),
  
  network: (message: string = 'Network error occurred', details?: Record<string, any>) =>
    new AppError(message, ErrorCode.NETWORK_ERROR, 503, details),
  
  serviceUnavailable: (message: string = 'Service temporarily unavailable', details?: Record<string, any>) =>
    new AppError(message, ErrorCode.SERVICE_UNAVAILABLE, 503, details),
  
  businessRule: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorCode.BUSINESS_RULE_VIOLATION, 400, details),
  
  fileUpload: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorCode.FILE_UPLOAD_ERROR, 400, details),
};

/**
 * Async error wrapper for try-catch elimination
 */
export function asyncHandler<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<[AppError | null, T | null]> {
  return fn()
    .then((data) => [null, data] as [null, T])
    .catch((error) => [handleError(error, context), null] as [AppError, null]);
}

/**
 * Display user-friendly error message
 */
export function displayError(error: unknown, fallbackMessage: string = 'An error occurred'): string {
  if (error instanceof AppError) {
    return error.getUserMessage();
  }
  
  if (error instanceof Error) {
    return isProduction ? fallbackMessage : error.message;
  }
  
  return fallbackMessage;
}
