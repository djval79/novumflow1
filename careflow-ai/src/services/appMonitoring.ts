// Comprehensive Monitoring and Logging System
// Production-ready monitoring for all applications

class AppMonitor {
  private static instance: AppMonitor;
  private startTime: number;
  private metrics: Map<string, any> = new Map();
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.startTime = Date.now();
    this.initPerformanceMonitoring();
    this.initErrorTracking();
    this.initUserTracking();
    this.initSystemHealth();
  }

  static getInstance(): AppMonitor {
    if (!AppMonitor.instance) {
      AppMonitor.instance = new AppMonitor();
    }
    return AppMonitor.instance;
  }

  // Performance Monitoring
  private initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // Observe Core Web Vitals
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });

        observer.observe({ entryTypes: ['navigation', 'paint', 'layout-shift'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('[AppMonitor] Performance Observer not available:', error);
      }
    }

    // Track initial page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPageLoad();
      }, 0);
    });
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.metrics.set('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
        this.metrics.set('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
        this.metrics.set('first_paint', navEntry.loadEventEnd - navEntry.startTime);
        break;
      
      case 'paint':
        const paintEntry = entry as PerformancePaintTiming;
        if (paintEntry.name === 'first-contentful-paint') {
          this.metrics.set('first_contentful_paint', paintEntry.startTime);
        }
        break;
      
      case 'layout-shift':
        const layoutEntry = entry as PerformanceEntry & { value: number };
        this.metrics.set('cumulative_layout_shift', (this.metrics.get('cumulative_layout_shift') || 0) + layoutEntry.value);
        break;
    }
  }

  private trackPageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.metrics.set('page_load_complete', loadTime);
      
      // Track resource loading
      const resources = performance.getEntriesByType('resource');
      const resourceCount = resources.length;
      this.metrics.set('resource_count', resourceCount);
      
      // Calculate connection metrics
      if (navigator.connection) {
        this.metrics.set('connection_type', (navigator as any).connection.effectiveType);
        this.metrics.set('downlink', (navigator as any).connection.downlink);
      }
    }
  }

  // Error Tracking Enhancement
  private initErrorTracking() {
    // Enhance global error handler
    const originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.trackError('javascript', {
        message,
        source,
        line: lineno,
        column: colno,
        stack: error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      
      if (originalErrorHandler) {
        return originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('promise_rejection', {
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  // User Behavior Tracking
  private initUserTracking() {
    // Track page visibility changes
    let visibilityStart = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.metrics.set('time_on_page', Date.now() - visibilityStart);
      } else {
        visibilityStart = Date.now();
      }
    });

    // Track user interactions
    let interactionCount = 0;
    const trackInteraction = () => {
      interactionCount++;
      this.metrics.set('user_interactions', interactionCount);
    };

    document.addEventListener('click', trackInteraction);
    document.addEventListener('scroll', trackInteraction, { passive: true });
    document.addEventListener('keydown', trackInteraction);
  }

  // System Health Monitoring
  private initSystemHealth() {
    // Monitor memory usage
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        this.metrics.set('memory_used', memory.usedJSHeapSize);
        this.metrics.set('memory_total', memory.totalJSHeapSize);
        this.metrics.set('memory_limit', memory.jsHeapSizeLimit);
        this.metrics.set('memory_usage_ratio', memory.usedJSHeapSize / memory.jsHeapSizeLimit);
      };
      
      // Check memory every 5 seconds
      setInterval(checkMemory, 5000);
    }

    // Monitor network status
    const updateNetworkStatus = () => {
      this.metrics.set('online', navigator.onLine);
      if (navigator.connection) {
        this.metrics.set('connection_effective_type', (navigator as any).connection.effectiveType);
        this.metrics.set('connection_rtt', (navigator as any).connection.rtt);
        this.metrics.set('connection_downlink', (navigator as any).connection.downlink);
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
  }

  // Public API Methods
  trackError(type: string, details: any) {
    const errorData = {
      type,
      details,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    // Store in localStorage for debugging
    const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    errors.push(errorData);
    
    // Keep only last 100 errors
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }
    
    localStorage.setItem('app_errors', JSON.stringify(errors));

    // Send to monitoring service in production
    if (!this.isDevelopment()) {
      this.sendToMonitoring(errorData);
    }
  }

  trackUserAction(action: string, details: any = {}) {
    const actionData = {
      action,
      details,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    // Store user actions
    const actions = JSON.parse(localStorage.getItem('user_actions') || '[]');
    actions.push(actionData);
    
    // Keep only last 200 actions
    if (actions.length > 200) {
      actions.splice(0, actions.length - 200);
    }
    
    localStorage.setItem('user_actions', JSON.stringify(actions));

    if (!this.isDevelopment()) {
      this.sendToMonitoring(actionData);
    }
  }

  trackPerformanceMetric(metric: string, value: number, details: any = {}) {
    const metricData = {
      metric,
      value,
      details,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    this.metrics.set(metric, value);

    if (!this.isDevelopment()) {
      this.sendToMonitoring(metricData);
    }
  }

  // Utility Methods
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('app_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('app_session_id', sessionId);
    }
    return sessionId;
  }

  private isDevelopment(): boolean {
    return import.meta.env.DEV || false;
  }

  private async sendToMonitoring(data: any) {
    try {
      // Send to analytics endpoints
      if (typeof gtag !== 'undefined') {
        gtag('event', 'app_monitoring', {
          event_category: 'application',
          custom_map: { custom_parameter_1: 'monitoring_data' }
        });
      }

      if (typeof posthog !== 'undefined') {
        posthog.capture('app_monitoring', data);
      }

      // Send to custom endpoint if configured
      const monitoringEndpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
      if (monitoringEndpoint) {
        await fetch(monitoringEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
      }
    } catch (error) {
      console.error('[AppMonitor] Failed to send monitoring data:', error);
    }
  }

  // Get comprehensive health report
  getHealthReport() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = (performance as any).memory;
    
    return {
      uptime: Math.floor(uptime / 1000), // seconds
      sessionId: this.getSessionId(),
      metrics: Object.fromEntries(this.metrics),
      performance: {
        pageLoadTime: this.metrics.get('page_load_complete'),
        firstContentfulPaint: this.metrics.get('first_contentful_paint'),
        domContentLoaded: this.metrics.get('dom_content_loaded'),
        resourceCount: this.metrics.get('resource_count')
      },
      memory: memoryUsage ? {
        used: Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memoryUsage.jsHeapSizeLimit / 1024 / 1024) + 'MB',
        usageRatio: Math.round((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100) + '%'
      } : null,
      network: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
        online: navigator.onLine
      } : null,
      errors: JSON.parse(localStorage.getItem('app_errors') || '[]').slice(-5),
      userActions: JSON.parse(localStorage.getItem('user_actions') || '[]').slice(-10)
    };
  }

  // Cleanup method
  destroy() {
    // Clean up performance observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

// Initialize global monitor
const appMonitor = AppMonitor.getInstance();

// Export for use in components
export { appMonitor };
export default appMonitor;

// React hook for easy integration
export function useAppMonitoring() {
  return {
    trackError: appMonitor.trackError.bind(appMonitor),
    trackUserAction: appMonitor.trackUserAction.bind(appMonitor),
    trackPerformanceMetric: appMonitor.trackPerformanceMetric.bind(appMonitor),
    getHealthReport: appMonitor.getHealthReport.bind(appMonitor)
  };
}