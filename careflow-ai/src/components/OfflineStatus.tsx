import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import offlineQueue from '../services/OfflineQueue';

interface OfflineStatusProps {
  className?: string;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0 });

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online) {
        // Queue will process automatically, but update UI immediately
        setTimeout(() => {
          setQueueLength(offlineQueue.getQueueLength());
          setLastSync(new Date());
        }, 1000);
      }
    };

    const updateQueueStatus = () => {
      setQueueLength(offlineQueue.getQueueLength());
    };

    const updateStorageUsage = () => {
      setStorageUsage(offlineQueue.getStorageUsage());
    };

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Update queue status periodically
    const queueInterval = setInterval(updateQueueStatus, 5000);
    const storageInterval = setInterval(updateStorageUsage, 10000);

    // Initial update
    updateOnlineStatus();
    updateQueueStatus();
    updateStorageUsage();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(queueInterval);
      clearInterval(storageInterval);
    };
  }, []);

  const getStoragePercentage = () => {
    if (storageUsage.available === 0) return 0;
    return Math.round((storageUsage.used / storageUsage.available) * 100);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOnline) {
    return (
      <div className={`fixed top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm ${className}`}>
        <div className="flex items-center">
          <WifiOff className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              You're Offline
            </h3>
            <div className="mt-1 text-xs text-red-700">
              <p>Changes will be saved locally and synced when you're back online.</p>
              {queueLength > 0 && (
                <p className="font-medium">{queueLength} items waiting to sync</p>
              )}
              <p>Storage: {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.available)}</p>
              <div className="w-full bg-red-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (queueLength > 0) {
    return (
      <div className={`fixed top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 animate-pulse" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Syncing in Progress
            </h3>
            <div className="mt-1 text-xs text-yellow-700">
              <p>{queueLength} items being synced...</p>
              {lastSync && (
                <p>Last sync: {lastSync.toLocaleTimeString()}</p>
              )}
              <p>Storage: {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.available)}</p>
              <div className="w-full bg-yellow-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Online and synced - show minimal status indicator
  return (
    <div className={`fixed top-4 left-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg shadow-lg z-50 ${className}`}>
      <div className="flex items-center">
        <Wifi className="h-4 w-4 text-green-500 mr-2" />
        <span className="text-xs font-medium text-green-800">Online</span>
        {lastSync && (
          <span className="text-xs text-green-600 ml-2">
            Synced {lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

// Hook for components to check offline status
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      setQueueLength(offlineQueue.getQueueLength());
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const interval = setInterval(updateStatus, 5000);

    updateStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    queueLength,
    addToQueue: offlineQueue.addItem.bind(offlineQueue),
    clearQueue: offlineQueue.clearQueue.bind(offlineQueue),
    getQueueItems: offlineQueue.getQueuedItems.bind(offlineQueue)
  };
};

export default OfflineStatus;