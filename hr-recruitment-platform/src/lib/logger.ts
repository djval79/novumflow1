/**
 * Centralized Logging Utility
 * 
 * Production-safe logging that only outputs in development mode
 * Prevents information leakage in production builds
 * 
 * Integrations:
 * - Sentry for error tracking (set VITE_SENTRY_DSN env var)
 * - Google Analytics for event tracking (set VITE_GA_MEASUREMENT_ID env var)
 * - Internal security audit logging
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// External service configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const ENABLE_SECURITY_LOGGING = import.meta.env.VITE_ENABLE_SECURITY_LOGGING === 'true';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

interface SecurityEvent {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: LogContext;
  timestamp: string;
}

class Logger {
  private prefix = '[NOVUMFLOW]';
  private securityEvents: SecurityEvent[] = [];

  /**
   * Debug level logging - development only
   */
  debug(message: string, context?: LogContext) {
    if (isDevelopment) {
      console.debug(`${this.prefix} [DEBUG]`, message, context || '');
    }
  }

  /**
   * Info level logging - development only
   */
  info(message: string, context?: LogContext) {
    if (isDevelopment) {
      console.info(`${this.prefix} [INFO]`, message, context || '');
    }
  }

  /**
   * Warning level logging - shown in all environments
   */
  warn(message: string, context?: LogContext) {
    console.warn(`${this.prefix} [WARN]`, message, isProduction ? '' : context);
  }

  /**
   * Error level logging - sanitized in production, sent to Sentry
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (isDevelopment) {
      console.error(`${this.prefix} [ERROR]`, message, error, context || '');
    } else {
      // Production: Log generic message without sensitive details
      console.error(`${this.prefix} [ERROR]`, message);

      // Send to Sentry error tracking
      this.sendToErrorTracking(message, error, context);
    }
  }

  /**
   * API call logging - development only
   */
  apiCall(method: string, endpoint: string, status?: number, context?: LogContext) {
    if (isDevelopment) {
      const statusEmoji = status && status < 400 ? '✅' : '❌';
      console.log(
        `${this.prefix} [API] ${statusEmoji} ${method} ${endpoint}`,
        status ? `(${status})` : '',
        context || ''
      );
    }
  }

  /**
   * Performance logging - development only
   */
  performance(label: string, duration: number, context?: LogContext) {
    if (isDevelopment) {
      console.log(
        `${this.prefix} [PERF] ${label}: ${duration.toFixed(2)}ms`,
        context || ''
      );
    }
  }

  /**
   * User action tracking - for analytics
   */
  trackAction(action: string, context?: LogContext) {
    if (isDevelopment) {
      console.log(`${this.prefix} [ACTION]`, action, context || '');
    }

    // Send to Google Analytics
    this.sendToAnalytics(action, context);
  }

  /**
   * Security event logging - always logged
   */
  security(event: string, context?: LogContext) {
    console.warn(`${this.prefix} [SECURITY]`, event, isProduction ? '' : context);

    // Send to security monitoring
    this.sendToSecurityMonitoring(event, context);
  }

  /**
   * Send errors to Sentry error tracking service
   */
  private sendToErrorTracking(message: string, error: Error | unknown, context?: LogContext) {
    if (!SENTRY_DSN || !isProduction) return;

    try {
      // Dynamic import to avoid loading Sentry in development
      import('@sentry/browser').then(Sentry => {
        // Initialize Sentry if not already done
        if (!Sentry.getCurrentHub().getClient()) {
          Sentry.init({
            dsn: SENTRY_DSN,
            environment: import.meta.env.MODE,
            tracesSampleRate: 0.1,
            beforeSend(event) {
              // Scrub sensitive data
              if (event.request?.headers) {
                delete event.request.headers['Authorization'];
                delete event.request.headers['Cookie'];
              }
              return event;
            }
          });
        }

        // Capture the error with context
        Sentry.withScope(scope => {
          if (context) {
            scope.setContext('custom', context);
            if (context.userId) {
              scope.setUser({ id: context.userId });
            }
            if (context.component) {
              scope.setTag('component', context.component);
            }
          }

          if (error instanceof Error) {
            Sentry.captureException(error);
          } else {
            Sentry.captureMessage(message, 'error');
          }
        });
      }).catch(() => {
        // Sentry not installed - silently fail
      });
    } catch {
      // Silently fail if Sentry is not available
    }
  }

  /**
   * Send events to Google Analytics
   */
  private sendToAnalytics(action: string, context?: LogContext) {
    if (!GA_MEASUREMENT_ID) return;

    try {
      // Use gtag if available (loaded via script tag)
      const gtag = (window as any).gtag;
      if (typeof gtag === 'function') {
        gtag('event', action, {
          event_category: context?.component || 'general',
          event_label: context?.action || action,
          value: context?.metadata?.value,
          ...context?.metadata
        });
      }
    } catch {
      // Silently fail if GA is not available
    }
  }

  /**
   * Send security events to monitoring service
   * Stores events locally and can sync to backend
   */
  private sendToSecurityMonitoring(event: string, context?: LogContext) {
    const securityEvent: SecurityEvent = {
      event_type: event,
      severity: this.determineSeverity(event),
      details: context || {},
      timestamp: new Date().toISOString()
    };

    // Store locally for batching
    this.securityEvents.push(securityEvent);

    // If enabled, sync to backend
    if (ENABLE_SECURITY_LOGGING && this.securityEvents.length >= 5) {
      this.flushSecurityEvents();
    }

    // Log high severity events to console in production
    if (isProduction && (securityEvent.severity === 'high' || securityEvent.severity === 'critical')) {
      console.warn(`${this.prefix} [SECURITY ALERT]`, event);
    }
  }

  /**
   * Determine severity level based on event type
   */
  private determineSeverity(event: string): SecurityEvent['severity'] {
    const criticalEvents = ['unauthorized_access', 'data_breach', 'injection_attempt'];
    const highEvents = ['failed_login_multiple', 'permission_escalation', 'suspicious_activity'];
    const mediumEvents = ['failed_login', 'invalid_token', 'rate_limited'];

    const lowerEvent = event.toLowerCase();

    if (criticalEvents.some(e => lowerEvent.includes(e))) return 'critical';
    if (highEvents.some(e => lowerEvent.includes(e))) return 'high';
    if (mediumEvents.some(e => lowerEvent.includes(e))) return 'medium';
    return 'low';
  }

  /**
   * Flush security events to backend
   */
  private async flushSecurityEvents() {
    if (this.securityEvents.length === 0) return;

    const eventsToSend = [...this.securityEvents];
    this.securityEvents = [];

    try {
      // Import supabase dynamically to avoid circular dependencies
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('security_audit_logs').insert(
        eventsToSend.map(e => ({
          event_type: e.event_type,
          severity: e.severity,
          details: e.details,
          created_at: e.timestamp
        }))
      );
    } catch {
      // If sync fails, put events back in queue
      this.securityEvents.unshift(...eventsToSend);
    }
  }

  /**
   * Force flush all pending security events (call on app shutdown)
   */
  async flushAll() {
    await this.flushSecurityEvents();
  }
}

// Export singleton instance
export const logger = new Logger();

// Export helper functions for convenience
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) =>
    logger.error(message, error, context),
  api: (method: string, endpoint: string, status?: number, context?: LogContext) =>
    logger.apiCall(method, endpoint, status, context),
  performance: (label: string, duration: number, context?: LogContext) =>
    logger.performance(label, duration, context),
  track: (action: string, context?: LogContext) => logger.trackAction(action, context),
  security: (event: string, context?: LogContext) => logger.security(event, context),
};

// Flush events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.flushAll();
  });
}

