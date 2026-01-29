// Error Tracking Service
// Centralized error logging and monitoring for production

class ErrorTracker {
  private errors: any[] = [];
  private maxErrors = 100; // Keep last 100 errors
  private isDevelopment = import.meta.env.DEV;

  constructor() {
    this.init();
  }

  init() {
    // Global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // Log initialization
    console.log('[ErrorTracker] Initialized in', this.isDevelopment ? 'development' : 'production');
  }

  handleGlobalError(event) {
    const error = {
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.logError(error);
  }

  handlePromiseRejection(event) {
    const error = {
      type: 'promise_rejection',
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.logError(error);
  }

  logError(error, context = {}) {
    const enhancedError = {
      ...error,
      id: this.generateErrorId(),
      context,
      timestamp: new Date().toISOString()
    };

    // Store locally
    this.errors.push(enhancedError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Development: console with details
    if (this.isDevelopment) {
      console.error('[ErrorTracker]', enhancedError);
    }

    // Production: send to monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoring(enhancedError);
    }
  }

  // Manual error tracking
  trackError(message, details = {}, context = {}) {
    const error = {
      type: 'manual',
      message,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.logError(error, context);
  }

  // API error tracking
  trackApiError(url, method, status, response, context = {}) {
    const error = {
      type: 'api_error',
      message: `API ${method} ${url} failed with status ${status}`,
      url,
      method,
      status,
      response: typeof response === 'object' ? JSON.stringify(response) : response,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      locationUrl: window.location.href
    };
    
    this.logError(error, context);
  }

  // User action tracking
  trackUserAction(action, details = {}) {
    const event = {
      type: 'user_action',
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Only track in production or explicit development tracking
    if (!this.isDevelopment || import.meta.env.VITE_ENABLE_TRACKING) {
      this.sendToMonitoring(event);
    }
  }

  // Performance tracking
  trackPerformance(metric, value, context = {}) {
    const event = {
      type: 'performance',
      metric,
      value,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (!this.isDevelopment) {
      this.sendToMonitoring(event);
    }
  }

  generateErrorId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async sendToMonitoring(data) {
    try {
      // In a real implementation, send to your monitoring service
      // For now, we'll store in localStorage and optionally send to analytics
      
      // Store in localStorage for debugging
      const stored = localStorage.getItem('app_logs') || '[]';
      const logs = JSON.parse(stored);
      logs.push(data);
      
      // Keep only last 500 logs
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));

      // Send to analytics if configured
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'app_error', {
          error_type: data.type,
          error_message: data.message,
          custom_map: { custom_parameter_1: 'error_details' }
        });
      }

      // Send to PostHog if configured
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('app_error', {
          error_type: data.type,
          error_message: data.message,
          error_details: data
        });
      }

    } catch (err) {
      console.error('[ErrorTracker] Failed to send error to monitoring:', err);
    }
  }

  // Get recent errors for debugging
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  // Clear error logs
  clearErrors() {
    this.errors = [];
    localStorage.removeItem('app_logs');
  }

  // Get system health report
  getHealthReport() {
    return {
      errorCount: this.errors.length,
      recentErrors: this.getRecentErrors(5),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      } : null,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null
    };
  }
}

// Create global instance
const errorTracker = new ErrorTracker();

// Export for use in components
export default errorTracker;

// React hook for easy usage
export function useErrorTracking() {
  return {
    trackError: errorTracker.trackError.bind(errorTracker),
    trackApiError: errorTracker.trackApiError.bind(errorTracker),
    trackUserAction: errorTracker.trackUserAction.bind(errorTracker),
    trackPerformance: errorTracker.trackPerformance.bind(errorTracker),
    getRecentErrors: errorTracker.getRecentErrors.bind(errorTracker),
    getHealthReport: errorTracker.getHealthReport.bind(errorTracker)
  };
}