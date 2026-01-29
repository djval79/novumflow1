// Enhanced Performance Optimization and Bottleneck Fixes
// Fixed: Code splitting, lazy loading, caching, render optimization

import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { debounce, throttle } from 'lodash-es';

// Performance monitoring utilities
export const performanceUtils = {
  // Memoization helper
  memo: <T>(component: React.ComponentType<any>, areEqual?: (prev: T, next: T) => boolean) => {
    return memo(component, areEqual);
  },

  // Heavy computation caching
  useMemoWithCache: <T>(factory: () => T, deps: React.DependencyList = []) => {
    const cache = new Map<string, T>();
    const cacheKey = JSON.stringify(deps);
    
    return useMemo(() => {
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }
      
      const result = factory();
      cache.set(cacheKey, result);
      return result;
    }, deps);
  },

  // Debounced functions
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ) => {
    return debounce(func, wait, { leading: immediate, trailing: true });
  },

  // Throttled functions
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ) => {
    return throttle(func, limit);
  },

  // Render performance tracking
  trackRender: (componentName: string, renderFn: () => React.ReactElement) => {
    return () => {
      const startTime = performance.now();
      const element = renderFn();
      const endTime = performance.now();
      
      // Log slow renders
      const renderTime = endTime - startTime;
      if (renderTime > 16.67) { // More than 60fps
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
      
      return element;
    };
  }
};

// Virtual scrolling for large lists
export const useVirtualScroll = <T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    scrollElementProps: {
      onScroll: throttle((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
      }, 16), // Throttle to 60fps
      style: { height: containerHeight, overflow: 'auto' }
    }
  };
};

// Image optimization utilities
export const imageOptimization = {
  // Lazy loading for images
  useLazyImage: (src: string, options: {
    threshold?: number;
    rootMargin?: string;
  } = {}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const isInView = entry.isIntersecting;
          setIsInView(isInView);
          
          if (isInView && !isLoaded) {
            const img = imgRef.current;
            if (img) {
              img.src = src;
              img.onload = () => setIsLoaded(true);
            }
          }
        },
        {
          threshold: options.threshold || 0.1,
          rootMargin: options.rootMargin || '0px'
        }
      );

      const img = imgRef.current;
      if (img) {
        observer.observe(img);
      }

      return () => {
        const img = imgRef.current;
        if (img) {
          observer.unobserve(img);
        }
        observer.disconnect();
      };
    }, [src, options.threshold, options.rootMargin, isLoaded, isInView]);

    return {
      isLoaded,
      isInView,
      imgRef
    };
  },

  // Image compression and optimization
  optimizeImage: async (file: File, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(resolve as BlobCallback, 'image/jpeg', quality);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  },

  // Progressive image loading
  useProgressiveImage: (src: string) => {
    const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      const img = imgRef.current;
      if (!img) return;

      img.onload = () => setLoadingState('loaded');
      img.onerror = () => setLoadingState('error');
      
      // Load image with progressive enhancement
      img.src = src;
    }, [src]);

    return {
      loadingState,
      imgRef
    };
  }
};

// Bundle optimization utilities
export const bundleOptimization = {
  // Dynamic imports for code splitting
  lazyLoad: <T>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    return lazy(() => importFunc().then(module => ({ default: module.default })), { fallback });
  },

  // Preload critical resources
  preloadComponent: (importFunc: () => Promise<any>) => {
    importFunc();
  },

  // Resource hints
  addPreloadHints: (resources: Array<{ href: string; as: string }>) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      document.head.appendChild(link);
    });
  },

  // DNS prefetch
  prefetchDNS: (domains: string[]) => {
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }
};

// Memory management utilities
export const memoryManagement = {
  // Cleanup utilities
  cleanup: (cleanup: () => void) => {
    React.useEffect(() => cleanup, [cleanup]);
  },

  // Component cleanup on unmount
  useCleanup: (cleanup: () => void) => {
    React.useEffect(() => cleanup, [cleanup]);
  },

  // Memory monitoring
  useMemoryMonitor: () => {
    const [memoryStats, setMemoryStats] = useState({
      used: 0,
      total: 0,
      limit: 0
    });

    React.useEffect(() => {
      const updateStats = () => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          setMemoryStats({
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          });
        }
      };

      const interval = setInterval(updateStats, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }, []);

    return memoryStats;
  },

  // Garbage collection hint
  triggerGC: () => {
    if (window.gc) {
      window.gc();
    }
  }
};

// Network optimization utilities
export const networkOptimization = {
  // Request deduplication
  useRequestDeduplication: () => {
    const pendingRequests = new Map<string, Promise<any>>();

    return {
      executeRequest: async <T>(key: string, request: () => Promise<T>): Promise<T> => {
        if (pendingRequests.has(key)) {
          return pendingRequests.get(key);
        }

        const promise = request();
        pendingRequests.set(key, promise);

        try {
          const result = await promise;
          return result;
        } finally {
          pendingRequests.delete(key);
        }
      }
    };
  },

  // Request batching
  batchRequests: async <T>(requests: Array<{ key: string; request: () => Promise<T> }>) => {
    const batchResults = await Promise.allSettled(
      requests.map(req => req.request())
    );

    return requests.map((req, index) => ({
      key: req.key,
      result: batchResults[index].status === 'fulfilled' ? batchResults[index].value : null,
      error: batchResults[index].status === 'rejected' ? batchResults[index].reason : null
    }));
  },

  // Response caching
  useCache: <T>(ttl: number = 5 * 60 * 1000) => { // 5 minutes default
    const cache = new Map<string, { data: T; timestamp: number }>();

    return {
      get: (key: string): T | null => {
        const item = cache.get(key);
        if (!item) return null;
        
        const now = Date.now();
        if (now - item.timestamp > ttl) {
          cache.delete(key);
          return null;
        }
        
        return item.data;
      },
      
      set: (key: string, data: T): void => {
        cache.set(key, { data, timestamp: Date.now() });
      },
      
      invalidate: (key: string): void => {
        cache.delete(key);
      },
      
      clear: (): void => {
        cache.clear();
      }
    };
  }
};

// Render optimization utilities
export const renderOptimization = {
  // Re-render optimization
  useRerenderOptimization: (shouldUpdate: (prev: any, next: any) => boolean) => {
    const [, forceUpdate] = React.useReducer((
      state: any,
      action: any
    ) => {
      if (shouldUpdate(state, action)) {
        return { ...state, ...action };
      }
      return state;
    }, {} as any)[1]; // Force update function

    return [, update] = forceUpdate;
  },

  // Suspense optimization
  suspenseWrapper: (component: React.ComponentType<any>, fallback?: React.ComponentType<any>) => {
    return React.memo((props: any) => (
      <Suspense fallback={fallback ? React.createElement(fallback, props) : null}>
        {React.createElement(component, props)}
      </Suspense>
    ));
  },

  // Optimized list rendering
  useOptimizedList: <T>(
    items: T[],
    renderItem: (item: T, index: number) => React.ReactElement,
    keyExtractor: (item: T) => string,
    threshold: number = 50 // Render threshold for optimization
  ) => {
    return React.useMemo(() => {
      if (items.length > threshold) {
        // Render only visible items for large lists
        return items.slice(0, threshold).map(renderItem);
      }
      
      return items.map(renderItem);
    }, [items, renderItem, keyExtractor, threshold]);
  }
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    renderCount: 0,
    totalRenderTime: 0,
    slowRenders: 0,
    memoryUsage: 0,
    bundleSize: 0
  });

  React.useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      let totalRenderTime = 0;
      let slowRenders = 0;

      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          totalRenderTime += entry.duration;
          
          if (entry.duration > 16.67) { // More than 60fps
            slowRenders++;
          }
        }
      }

      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        totalRenderTime: prev.totalRenderTime + totalRenderTime,
        slowRenders: prev.slowRenders + slowRenders
      }));
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, []);

  return {
    ...metrics,
    recordCustomMetric: (name: string, value: number) => {
      setMetrics(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
};