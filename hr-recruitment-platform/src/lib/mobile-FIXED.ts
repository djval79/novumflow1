// Enhanced Mobile Responsiveness and PWA Features
// Fixed: Responsive design, touch interactions, PWA caching, offline support

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 320,    // iPhone SE
  tablet: 768,     // iPad
  desktop: 1024,    // Small desktop
  large: 1440      // Large desktop
} as const;

// Mobile detection utilities
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenWidth: 0,
    screenHeight: 0,
    touchSupported: false,
    isPWA: false
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < BREAKPOINTS.tablet;
      const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
      const isDesktop = width >= BREAKPOINTS.desktop;
      const orientation = width > height ? 'landscape' : 'portrait';
      const touchSupported = 'ontouchstart' in window;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        screenWidth: width,
        screenHeight: height,
        touchSupported,
        isPWA
      });
    };

    // Update on resize
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    // Initial update
    updateDeviceInfo();

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return {
    ...deviceInfo,
    isSmallDevice: deviceInfo.screenWidth < 380,
    isLargeDevice: deviceInfo.screenWidth >= BREAKPOINTS.large,
    isTouchDevice: deviceInfo.touchSupported,
    canHover: !deviceInfo.touchSupported
  };
};

// Responsive component hook
export const useResponsive = () => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();

  const responsiveClasses = useMemo(() => ({
    container: 'w-full h-full',
    mobile: isMobile ? 'mobile-layout' : '',
    tablet: isTablet ? 'tablet-layout' : '',
    desktop: isDesktop ? 'desktop-layout' : '',
    navigation: isMobile ? 'mobile-nav' : 'desktop-nav',
    sidebar: isMobile ? 'mobile-sidebar' : 'desktop-sidebar',
    grid: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3',
    cards: isMobile ? 'mobile-cards' : 'desktop-cards',
    forms: isMobile ? 'mobile-forms' : 'desktop-forms'
  }), [isMobile, isTablet, isDesktop]);

  return responsiveClasses;
};

// Touch gesture utilities
export const useTouchGestures = () => {
  const [touchState, setTouchState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));

    // Prevent scrolling when dragging
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  }, [touchState]);

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

// Enhanced PWA utilities
export const usePWAFeatures = () => {
  const [pwaState, setPwaState] = useState({
    isInstallable: false,
    isInstalled: false,
    beforeInstallPrompt: null as any,
    deferredPrompt: null as any,
    updateAvailable: false
  });

  useEffect(() => {
    // Check if PWA is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInWebAppChrome = window.matchMedia('(display-mode: browser)').matches;
    
    setPwaState(prev => ({
      ...prev,
      isInstalled: isStandalone || isInWebAppiOS || isInWebAppChrome
    }));

    // Listen for beforeinstall event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaState(prev => ({
        ...prev,
        beforeInstallPrompt: e,
        isInstallable: true
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!pwaState.beforeInstallPrompt) {
      return false;
    }

    try {
      pwaState.beforeInstallPrompt.prompt();
      const { outcome } = await pwaState.beforeInstallPrompt.userChoice;
      
      setPwaState(prev => ({
        ...prev,
        isInstallable: outcome === 'accepted',
        beforeInstallPrompt: null
      }));

      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }, [pwaState.beforeInstallPrompt]);

  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        setPwaState(prev => ({
          ...prev,
          updateAvailable: true
        }));
      }
    }
  }, []);

  const activateUpdate = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        setPwaState(prev => ({
          ...prev,
          updateAvailable: false
        }));
      }
    }
  }, []);

  return {
    ...pwaState,
    installPWA,
    checkForUpdates,
    activateUpdate
  };
};

// Offline support utilities
export const useOfflineSupport = () => {
  const [offlineState, setOfflineState] = useState({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    offlineQueue: [] as any[],
    syncInProgress: false
  });

  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false
      }));
      
      // Process offline queue when back online
      if (offlineState.offlineQueue.length > 0) {
        processOfflineQueue();
      }
    };

    const handleOffline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: false,
        isOffline: true
      }));
    };

    const processOfflineQueue = async () => {
      if (offlineState.syncInProgress) return;
      
      setOfflineState(prev => ({ ...prev, syncInProgress: true }));
      
      try {
        // Process each queued action
        for (const action of offlineState.offlineQueue) {
          try {
            await action();
          } catch (error) {
            console.error('Failed to process offline action:', error);
          }
        }
        
        setOfflineState(prev => ({
          ...prev,
          offlineQueue: [],
          syncInProgress: false
        }));
      } catch (error) {
        console.error('Sync failed:', error);
        setOfflineState(prev => ({ ...prev, syncInProgress: false }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineState.offlineQueue, offlineState.syncInProgress]);

  const addToOfflineQueue = useCallback((action: any) => {
    setOfflineState(prev => ({
      ...prev,
      offlineQueue: [...prev.offlineQueue, action]
    }));
  }, []);

  return {
    ...offlineState,
    addToOfflineQueue
  };
};

// Enhanced responsive styles
export const responsiveStyles = {
  // Mobile-first CSS classes
  container: {
    base: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    mobile: 'px-4 py-2',
    tablet: 'px-6 py-4',
    desktop: 'px-8 py-6'
  },
  navigation: {
    base: 'bg-white shadow-sm border-b border-gray-200',
    mobile: 'fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 z-50',
    tablet: 'sticky top-0 z-40',
    desktop: 'sticky top-0 z-40'
  },
  grid: {
    mobile: 'grid grid-cols-1 gap-4',
    tablet: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    desktop: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
  },
  cards: {
    base: 'bg-white rounded-lg shadow-sm border border-gray-200',
    mobile: 'p-4 space-y-3',
    tablet: 'p-6 space-y-4',
    desktop: 'p-6 space-y-4'
  },
  forms: {
    base: 'space-y-6',
    mobile: 'space-y-4',
    tablet: 'space-y-5',
    desktop: 'space-y-6'
  },
  buttons: {
    base: 'inline-flex items-center px-4 py-2 border border text-sm font-medium rounded-md transition-colors',
    mobile: 'text-sm px-3 py-2 min-h-[44px]', // Minimum touch target
    tablet: 'text-sm px-4 py-3',
    desktop: 'text-sm px-4 py-2'
  },
  inputs: {
    base: 'block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
    mobile: 'text-lg px-4 py-3 min-h-[44px]', // Larger on mobile
    tablet: 'text-base px-4 py-2',
    desktop: 'text-sm px-3 py-2'
  },
  typography: {
    mobile: 'text-base sm:text-lg', // Larger text on mobile
    tablet: 'text-base',
    desktop: 'text-sm'
  }
};

// Performance monitoring for mobile
export const useMobilePerformance = () => {
  const [performance, setPerformance] = useState({
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    bundleSize: 0
  });

  useEffect(() => {
    // Monitor render performance
    const startTime = performance.now();
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          setPerformance(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setPerformance(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize
      }));
    }

    return () => observer.disconnect();
  }, []);

  const startMeasure = useCallback((name: string) => {
    performance.mark(`${name}-start`);
  }, []);

  const endMeasure = useCallback((name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }, []);

  return {
    performance,
    startMeasure,
    endMeasure
  };
};

// Accessibility utilities
export const useAccessibility = () => {
  const [a11yState, setA11yState] = useState({
    keyboardNavigation: false,
    highContrast: false,
    reducedMotion: false,
    screenReader: false
  });

  useEffect(() => {
    // Check for keyboard navigation
    const checkKeyboardNavigation = () => {
      setA11yState(prev => ({
        ...prev,
        keyboardNavigation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      }));
    };

    // Check for reduced motion
    const checkReducedMotion = () => {
      setA11yState(prev => ({
        ...prev,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      }));
    };

    // Check for screen reader
    const checkScreenReader = () => {
      setA11yState(prev => ({
        ...prev,
        screenReader: window.speechSynthesis !== undefined
      }));
    };

    checkKeyboardNavigation();
    checkReducedMotion();
    checkScreenReader();

    // Listen for keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setA11yState(prev => ({
          ...prev,
          keyboardNavigation: true
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    ...a11yState,
    focusManagement: {
      trapFocus: (element: HTMLElement) => {
        const focusableElements = element.querySelectorAll(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        element.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              e.preventDefault();
              lastElement.focus();
            } else {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
      },
      
      restoreFocus: () => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.focus();
        }
      }
    },
    
    announcements: {
      announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 1000);
      }
    }
  };
};