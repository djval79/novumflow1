/**
 * PWA Update Notification Component
 * 
 * Displays a notification when a new version is available
 * or when the app is ready to work offline
 */

import React, { useEffect, useState } from 'react';
import { usePWAUpdate } from '@/lib/pwaUpdater';

export function PWAUpdateNotification() {
  const { needRefresh, offlineReady, update, close } = usePWAUpdate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (needRefresh || offlineReady) {
      setIsVisible(true);
      
      // Log the event
      if (needRefresh) {
        console.log('PWA update available');
      }
      if (offlineReady) {
        console.log('PWA offline ready');
      }
    }
  }, [needRefresh, offlineReady]);

  const handleUpdate = async () => {
    console.log('pwa_update_clicked');
    await update();
  };

  const handleClose = () => {
    console.log('pwa_notification_dismissed');
    setIsVisible(false);
    close();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {needRefresh && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Update Available
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  A new version of the app is available. Reload to update.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                  >
                    Reload Now
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    Later
                  </button>
                </div>
              </>
            )}
            
            {offlineReady && !needRefresh && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Ready to Work Offline
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  The app is now available offline. You can use it without an internet connection.
                </p>
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  Got it
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
