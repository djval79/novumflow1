import React from 'react';
import { log } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react';

const isDevelopment = import.meta.env.MODE === 'development';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

const serializeError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${isDevelopment && error.stack ? '\n' + error.stack : ''}`;
  }
  return String(error);
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    log.error('React ErrorBoundary caught an error', error, {
      component: 'ErrorBoundary',
      metadata: {
        componentStack: errorInfo.componentStack,
        url: window.location.href
      }
    });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Direct Supabase log attempt
    this.logToSupabase(error, errorInfo);
  }

  private async logToSupabase(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (supabase) {
        await supabase.from('security_audit_logs').insert({
          event_type: 'frontend_crash',
          severity: 'high',
          details: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            url: window.location.href
          }
        });
      }
    } catch (e) {
      // Ignore logging failures
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Premium Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Something went wrong</h1>
              <p className="text-red-50 font-medium">We apologize for the inconvenience. Our technical team has been notified.</p>
            </div>

            <div className="p-8">
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Technical Details
                </h3>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-mono text-red-600 break-all font-bold">
                    {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown error'}
                  </p>
                  {isDevelopment && this.state.errorInfo && (
                    <pre className="mt-3 text-[10px] text-gray-500 overflow-auto max-h-40 leading-relaxed">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={this.handleRefresh}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 group"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Refresh App
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 rounded-2xl font-bold transition-all"
                >
                  <Home className="w-5 h-5" />
                  Return Home
                </button>
              </div>

              <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                If the problem persists, please contact our support team at <span className="text-indigo-600">support@novumsolvo.com</span>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center grayscale opacity-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">NovumFlow Managed System</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
