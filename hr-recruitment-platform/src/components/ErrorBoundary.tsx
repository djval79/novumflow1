import React from 'react';
import { log } from '@/lib/logger';

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
    return error.message + (isDevelopment && error.stack ? '\n' + error.stack : '');
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
      component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      metadata: { componentStack: isDevelopment ? errorInfo.componentStack : undefined }
    });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
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

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-4">
              We apologize for the inconvenience. Please try refreshing the page or return to the home page.
            </p>

            {isDevelopment && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                  {serializeError(this.state.error)}
                </pre>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRefresh}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
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
