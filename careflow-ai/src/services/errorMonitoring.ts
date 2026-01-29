import { supabase } from '../lib/supabase';

interface ErrorReport {
  error: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  tenantId?: string;
  route: string;
}

class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }

  async reportError(error: Error, errorInfo?: any): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      const errorReport: ErrorReport = {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: user?.id,
        tenantId: session?.user?.user_metadata?.tenant_id,
        route: window.location.pathname
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error Report:', errorReport);
      }

      // Send to monitoring table
      await supabase.from('error_logs').insert([{
        error_message: errorReport.error,
        stack_trace: errorReport.stack,
        component_stack: errorReport.componentStack,
        user_agent: errorReport.userAgent,
        user_id: errorReport.userId,
        tenant_id: errorReport.tenantId,
        route: errorReport.route,
        metadata: errorReport
      }]);

    } catch (reportingError) {
      // Fallback to console if reporting fails
      console.error('Failed to report error:', error, reportingError);
    }
  }

  async reportApiError(endpoint: string, error: any, context?: any): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await supabase.from('api_error_logs').insert([{
        endpoint,
        error_message: error.message || 'Unknown error',
        status_code: error.status,
        request_context: context,
        timestamp: new Date().toISOString()
      }]);
    } catch (reportingError) {
      console.error('Failed to report API error:', error, reportingError);
    }
  }

  async reportPerformanceIssue(metric: string, value: number, threshold: number): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await supabase.from('performance_logs').insert([{
        metric_name: metric,
        value,
        threshold,
        exceeded: value > threshold,
        timestamp: new Date().toISOString()
      }]);
    } catch (reportingError) {
      console.error('Failed to report performance issue:', reportingError);
    }
  }

  // Setup global error handlers
  setupGlobalHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(new Error(event.reason), {
        type: 'unhandledrejection',
        promise: event.promise
      });
    });

    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }
}

export const errorMonitoring = ErrorMonitoring.getInstance();
export default errorMonitoring;