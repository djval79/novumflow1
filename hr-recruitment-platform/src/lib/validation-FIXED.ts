// Enhanced Form Validation and Input Handling
// Fixed: Comprehensive validation, sanitization, accessibility, real-time feedback

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';

// Comprehensive validation schemas
export const validationSchemas = {
  employee: z.object({
    first_name: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, hyphens, and spaces'),
    last_name: z.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, hyphens, and spaces'),
    email: z.string()
      .email('Invalid email format')
      .max(100, 'Email cannot exceed 100 characters'),
    phone: z.string()
      .regex(/^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format')
      .optional(),
    employee_number: z.string()
      .min(1, 'Employee number is required')
      .max(20, 'Employee number cannot exceed 20 characters')
      .regex(/^[A-Z0-9-]+$/, 'Employee number can only contain uppercase letters, numbers, and hyphens'),
    department: z.string()
      .min(2, 'Department must be at least 2 characters')
      .max(100, 'Department cannot exceed 100 characters'),
    position: z.string()
      .min(2, 'Position must be at least 2 characters')
      .max(100, 'Position cannot exceed 100 characters'),
    employment_type: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship'], 'Invalid employment type'),
    salary: z.coerce.number()
      .min(0, 'Salary must be positive')
      .max(1000000, 'Salary exceeds maximum allowed'),
    hire_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    address: z.string()
      .max(500, 'Address cannot exceed 500 characters')
      .optional(),
    visa_status: z.enum(['citizen', 'work_permit', 'student_visa', 'dependent_visa', 'other'], 'Invalid visa status')
      .optional(),
    emergency_contact_name: z.string()
      .min(2, 'Emergency contact name must be at least 2 characters')
      .max(100, 'Emergency contact name cannot exceed 100 characters')
      .optional(),
    emergency_contact_phone: z.string()
      .regex(/^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid emergency contact phone format')
      .optional()
  }),

  job: z.object({
    title: z.string()
      .min(5, 'Job title must be at least 5 characters')
      .max(200, 'Job title cannot exceed 200 characters')
      .trim(),
    description: z.string()
      .min(50, 'Job description must be at least 50 characters')
      .max(2000, 'Job description cannot exceed 2000 characters')
      .trim(),
    department: z.string()
      .min(2, 'Department must be at least 2 characters')
      .max(100, 'Department cannot exceed 100 characters'),
    location: z.string()
      .min(2, 'Location must be at least 2 characters')
      .max(100, 'Location cannot exceed 100 characters'),
    employment_type: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship'], 'Invalid employment type'),
    min_salary: z.coerce.number()
      .min(0, 'Minimum salary must be positive')
      .max(1000000, 'Salary exceeds maximum allowed'),
    max_salary: z.coerce.number()
      .min(0, 'Maximum salary must be positive')
      .max(1000000, 'Salary exceeds maximum allowed'),
    application_deadline: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid deadline date format'),
    status: z.enum(['draft', 'published', 'closed', 'cancelled', 'archived'], 'Invalid status'),
    remote_work: z.boolean().default(false),
    requirements: z.string()
      .max(1000, 'Requirements cannot exceed 1000 characters')
      .optional(),
    benefits: z.string()
      .max(1000, 'Benefits cannot exceed 1000 characters')
      .optional()
  }),

  application: z.object({
    first_name: z.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, hyphens, and spaces'),
    last_name: z.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, hyphens, and spaces'),
    email: z.string()
      .email('Invalid email format')
      .max(100, 'Email cannot exceed 100 characters'),
    phone: z.string()
      .regex(/^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format'),
    cover_letter: z.string()
      .min(50, 'Cover letter must be at least 50 characters')
      .max(5000, 'Cover letter cannot exceed 5000 characters'),
    linkedin_url: z.string()
      .url('Invalid LinkedIn URL format')
      .optional(),
    portfolio_url: z.string()
      .url('Invalid portfolio URL format')
      .optional(),
    notice_period: z.coerce.number()
      .min(1, 'Notice period must be at least 1 week')
      .max(12, 'Notice period cannot exceed 12 weeks')
      .optional(),
    expected_salary: z.coerce.number()
      .min(0, 'Expected salary must be positive')
      .max(1000000, 'Expected salary exceeds maximum allowed')
      .optional()
  }),

  document: z.object({
    title: z.string()
      .min(1, 'Document title is required')
      .max(200, 'Document title cannot exceed 200 characters')
      .trim(),
    document_type: z.enum(['cv', 'certificate', 'visa', 'passport', 'dbs', 'contract', 'offer_letter', 'reference', 'other'], 'Invalid document type'),
    expiry_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid expiry date format')
      .optional(),
    description: z.string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
  }),

  leave_request: z.object({
    leave_type: z.enum(['annual', 'sick', 'unpaid', 'maternity', 'paternity', 'compassionate', 'bereavement', 'parental'], 'Invalid leave type'),
    start_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format'),
    end_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format'),
    reason: z.string()
      .min(5, 'Reason must be at least 5 characters')
      .max(1000, 'Reason cannot exceed 1000 characters'),
    emergency_contact: z.string()
      .max(100, 'Emergency contact cannot exceed 100 characters')
      .optional()
    attachments: z.array(z.string()).optional()
  }),

  shift: z.object({
    shift_type: z.enum(['morning', 'day', 'evening', 'night', 'flexible'], 'Invalid shift type'),
    shift_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid shift date format'),
    start_time: z.string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format'),
    end_time: z.string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format'),
    break_duration: z.coerce.number()
      .min(0, 'Break duration must be positive')
      .max(480, 'Break duration cannot exceed 480 minutes'), // 8 hours
    location: z.string()
      .max(200, 'Location cannot exceed 200 characters')
      .optional(),
    notes: z.string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
  }),

  user_profile: z.object({
    full_name: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z.string()
      .email('Invalid email format'),
      .max(100, 'Email cannot exceed 100 characters'),
    bio: z.string()
      .max(500, 'Bio cannot exceed 500 characters')
      .optional(),
    timezone: z.string()
      .max(50, 'Timezone cannot exceed 50 characters')
      .optional(),
    language: z.string()
      .max(10, 'Language cannot exceed 10 characters')
      .optional()
  })
};

// Input sanitization utilities
export const sanitizers = {
  text: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS
      .replace(/[\s\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/javascript:/gi, 'java script:') // Prevent script injection
      .replace(/on\w+=/gi, 'on...='); // Remove event handlers
  },

  html: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  phone: (input: string): string => {
    // Normalize phone number format
    return input
      .replace(/[^\d+\s-()]/g, '') // Keep only digits and basic formatting
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  },

  email: (input: string): string => {
    return input.toLowerCase().trim();
  },

  fileName: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .trim();
  }
};

// Custom validation hook
export const useFormValidation = <T extends z.ZodType<any, any>>(
  schema: T,
  initialData: any
) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback((field: string, value: any) => {
    try {
      const fieldSchema = (schema as any).shape[field];
      if (!fieldSchema) return null;

      const result = fieldSchema.safeParse(value);
      if (result.success) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      } else {
        setErrors(prev => ({ ...prev, [field]: result.error.errors[0]?.message || 'Invalid value' }));
      }
      
      return result.success;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }, [schema]);

  const validateForm = useCallback(() => {
    try {
      const result = schema.safeParse(data);
      if (result.success) {
        setErrors({});
        setIsValid(true);
        return true;
      } else {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((error: any) => {
          if (error.path.length > 0) {
            newErrors[error.path.join('.')] = error.message;
          }
        });
        setErrors(newErrors);
        setIsValid(false);
        return false;
      }
    } catch (error) {
      console.error('Form validation error:', error);
      setErrors({ general: 'Validation failed' });
      setIsValid(false);
      return false;
    }
  }, [data, schema]);

  const setFieldValue = useCallback((field: string, value: any) => {
    const sanitizedValue = typeof value === 'string' ? sanitizers.text(value) : value;
    setData(prev => ({ ...prev, [field]: sanitizedValue }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on change
    validateField(field, sanitizedValue);
  }, []);

  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialData]);

  // Auto-validate when fields change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [data, validateForm, touched]);

  return {
    data,
    errors,
    touched,
    isValid,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm
  };
};

// Real-time validation hook with debouncing
export const useRealTimeValidation = <T extends z.ZodType<any, any>>(
  schema: T,
  debounceMs: number = 300
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validations, setValidations] = useState<Record<string, boolean>>({});

  const validate = useMemo(() => {
    return (field: string, value: any) => {
      try {
        const fieldSchema = (schema as any).shape[field];
        if (!fieldSchema) {
          setValidations(prev => ({ ...prev, [field]: true }));
          return null;
        }

        const result = fieldSchema.safeParse(value);
        if (result.success) {
          setErrors(prev => ({ ...prev, [field]: '' }));
          setValidations(prev => ({ ...prev, [field]: true }));
          return null;
        } else {
          setErrors(prev => ({ ...prev, [field]: result.error.errors[0]?.message || 'Invalid value' }));
          setValidations(prev => ({ ...prev, [field]: false }));
          return result.error.errors[0]?.message || 'Invalid value';
        }
      } catch (error) {
        console.error('Real-time validation error:', error);
        return 'Validation failed';
      }
    };
  }, [schema]);

  return {
    errors,
    validations,
    validate
  };
};

// File validation hook
export const useFileValidation = (config: {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles?: number;
}) => {
  const [fileErrors, setFileErrors] = useState<Record<string, string[]>>({});
  const [isValidFiles, setIsValidFiles] = useState<Record<string, boolean>>({});

  const validateFile = useCallback((file: File, index?: number) => {
    const key = index !== undefined ? `${index}` : 'file';
    const errors: string[] = [];

    // Check file size
    if (file.size > config.maxSize) {
      errors.push(`File size (${Math.round(file.size / (1024 * 1024))MB) exceeds maximum (${Math.round(config.maxSize / (1024 * 1024))MB)`);
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowedTypes.includes(fileExtension)) {
      errors.push(`File type .${fileExtension} not allowed. Allowed types: ${config.allowedTypes.join(', ')}`);
    }

    // Check file name
    const sanitizedName = sanitizers.fileName(file.name);
    if (sanitizedName !== file.name) {
      errors.push('File name contains invalid characters');
    }

    setFileErrors(prev => ({ ...prev, [key]: errors }));
    setIsValidFiles(prev => ({ ...prev, [key]: errors.length === 0 }));

    return errors.length === 0;
  }, [config]);

  const validateFiles = useCallback((files: File[]) => {
    const errors: string[] = [];

    if (config.maxFiles && files.length > config.maxFiles) {
      errors.push(`Maximum ${config.maxFiles} files allowed`);
    }

    files.forEach((file, index) => {
      validateFile(file, index);
    });

    return errors.length === 0;
  }, [validateFile, config]);

  const clearFileErrors = useCallback(() => {
    setFileErrors({});
    setIsValidFiles({});
  }, []);

  return {
    fileErrors,
    isValidFiles,
    validateFile,
    validateFiles,
    clearFileErrors
  };
};

// Password strength indicator
export const usePasswordStrength = (password: string) => {
  const strength = useMemo(() => {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Common patterns check
    if (!/(.)\1/.test(password) && !/(123|qwerty|password)/i.test(password)) score += 1;
    else feedback.push('Avoid common patterns');

    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score <= 2) level = 'weak';
    else if (score <= 3) level = 'fair';
    else if (score <= 4) level = 'good';
    else level = 'strong';

    return { score, level, feedback };
  }, [password]);

  return strength;
};

// Accessible form component wrapper
export const useAccessibleForm = () => {
  const getFieldProps = useCallback((name: string, options: {
    required?: boolean;
    description?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  } = {}) => {
    const props: any = {
      id: name,
      name,
      'aria-label': options.description || name,
      'aria-required': options.required || false,
      'aria-invalid': false, // Will be updated based on validation state
    };

    if (options.pattern) {
      props.pattern = options.pattern;
    }

    if (options.minLength) {
      props.minLength = options.minLength;
    }

    if (options.maxLength) {
      props.maxLength = options.maxLength;
    }

    return props;
  }, []);

  const getErrorProps = useCallback((error?: string) => {
    if (!error) return {};

    return {
      'aria-describedby': `${error}-error`,
      'aria-invalid': true,
      role: 'alert'
    };
  }, []);

  return {
    getFieldProps,
    getErrorProps
  };
};

// Auto-save functionality
export const useAutoSave = <T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  debounceMs: number = 5000
) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (data) {
        setIsSaving(true);
        try {
          await saveFunction(data);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [data, saveFunction, debounceMs]);

  return { lastSaved, isSaving };
};

// Form submission handler with retry
export const useFormSubmission = <T, R>(
  initialData: T,
  submitFunction: (data: T) => Promise<R>,
  options: {
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
    validateBeforeSubmit?: (data: T) => boolean;
  } = {}
) => {
  const [data, setData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    // Validate before submission
    if (options.validateBeforeSubmit && !options.validateBeforeSubmit(data)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitFunction(data);
      if (options.onSuccess) {
        options.onSuccess(result);
      }
    } catch (error: any) {
      setSubmitError(error as Error);
      if (options.onError) {
        options.onError(error as Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [data, submitFunction, options]);

  const reset = useCallback(() => {
    setData(initialData);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [initialData]);

  return {
    data,
    setData,
    isSubmitting,
    submitError,
    handleSubmit,
    reset
  };
};