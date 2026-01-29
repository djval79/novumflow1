import React, { useEffect, useRef, useState } from 'react';

interface MemoryLeakDetectorProps {
  children: React.ReactNode;
  maxMemoryMB?: number;
  checkInterval?: number;
}

interface MemoryInfo {
  used: number;
  total: number;
}

const MemoryLeakDetector: React.FC<MemoryLeakDetectorProps> = ({
  children,
  maxMemoryMB = 100,
  checkInterval = 30000 // 30 seconds
}) => {
  const [memoryWarning, setMemoryWarning] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as Performance & { memory?: PerformanceMemory }).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        
        setMemoryInfo({
          used: usedMB,
          total: totalMB
        });

        if (usedMB > maxMemoryMB) {
          setMemoryWarning(true);
          
          // Log memory issue for monitoring
          if (window.errorMonitoring) {
            window.errorMonitoring.reportPerformanceIssue(
              'memory_usage',
              usedMB,
              maxMemoryMB
            );
          }

          // Force garbage collection if available
          if ((window as any).gc) {
            (window as any).gc();
          }
        } else {
          setMemoryWarning(false);
        }
      }
    };

    // Check memory immediately
    checkMemory();

    // Set up periodic checks
    intervalRef.current = setInterval(checkMemory, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [maxMemoryMB, checkInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any pending operations
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (memoryWarning && memoryInfo) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              High Memory Usage Detected
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Memory usage: {memoryInfo.used.toFixed(1)}MB / {memoryInfo.total.toFixed(1)}MB</p>
              <p>Consider refreshing the page to free up memory.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for detecting memory leaks in components
export const useMemoryLeakDetector = (componentName: string, maxObjects: number = 100) => {
  const objectCountRef = useRef<Map<any, number>>(new Map());

  useEffect(() => {
    return () => {
      // Check for uncleaned objects on unmount
      if (objectCountRef.current.size > maxObjects) {
        console.warn(`Potential memory leak detected in ${componentName}:`, {
          objectCount: objectCountRef.current.size,
          maxObjects
        });
      }
      objectCountRef.current.clear();
    };
  }, [componentName, maxObjects]);

  const trackObject = (obj: any) => {
    objectCountRef.current.set(obj, Date.now());
    return obj;
  };

  const untrackObject = (obj: any) => {
    objectCountRef.current.delete(obj);
  };

  return { trackObject, untrackObject };
};

// Hook for cleaning up side effects
export const useCleanup = (cleanupFn: () => void, deps: React.DependencyList = []) => {
  useEffect(() => {
    return cleanupFn;
  }, deps);
};

export default MemoryLeakDetector;