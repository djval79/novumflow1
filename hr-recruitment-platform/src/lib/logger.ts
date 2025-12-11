/**
 * Centralized Logging Utility
 * 
 * Production-safe logging that only outputs in development mode
 * Prevents information leakage in production builds
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

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
}

class Logger {
  private prefix = '[NOVUMFLOW]';

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
   * Error level logging - sanitized in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (isDevelopment) {
      console.error(`${this.prefix} [ERROR]`, message, error, context || '');
    } else {
      // Production: Log generic message without sensitive details
      console.error(`${this.prefix} [ERROR]`, message);
      
      // TODO: Send to external error tracking service (e.g., Sentry)
      // this.sendToErrorTracking(message, error, context);
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
    
    // TODO: Send to analytics service (e.g., Google Analytics, Mixpanel)
    // this.sendToAnalytics(action, context);
  }

  /**
   * Security event logging - always logged
   */
  security(event: string, context?: LogContext) {
    console.warn(`${this.prefix} [SECURITY]`, event, isProduction ? '' : context);
    
    // TODO: Send to security monitoring service
    // this.sendToSecurityMonitoring(event, context);
  }

  /**
   * Future: Send errors to external tracking service
   */
  private sendToErrorTracking(message: string, error: Error | unknown, context?: LogContext) {
    // Implementation for Sentry, LogRocket, etc.
    // Example:
    // Sentry.captureException(error, { contexts: { custom: context } });
  }

  /**
   * Future: Send events to analytics service
   */
  private sendToAnalytics(action: string, context?: LogContext) {
    // Implementation for Google Analytics, Mixpanel, etc.
    // Example:
    // gtag('event', action, context);
  }

  /**
   * Future: Send security events to monitoring service
   */
  private sendToSecurityMonitoring(event: string, context?: LogContext) {
    // Implementation for security monitoring
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
