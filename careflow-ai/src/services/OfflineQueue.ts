interface OfflineQueueItem {
  id: string;
  type: 'medication' | 'visit' | 'incident' | 'form' | 'expense';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueue {
  private queue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private storageKey = 'careflow_offline_queue';
  private syncInProgress: boolean = false;

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Check connection status periodically
    setInterval(() => {
      this.checkConnection();
    }, 30000); // 30 seconds
  }

  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  addItem(type: OfflineQueueItem['type'], data: any): void {
    const item: OfflineQueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    this.queue.push(item);
    this.saveQueue();

    // Show notification to user
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      this.showOfflineNotification(type);
    }
  }

  private async showOfflineNotification(type: string): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('CareFlow - Offline Mode', {
        body: `Your ${type} will be synced when you're back online.`,
        icon: '/favicon.ico',
        tag: 'offline-queue'
      });
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Process items in order
      const itemsToProcess = [...this.queue];
      
      for (const item of itemsToProcess) {
        if (item.retryCount >= item.maxRetries) {
          // Remove items that have exceeded max retries
          this.removeFromQueue(item.id);
          continue;
        }

        try {
          await this.syncItem(item);
          this.removeFromQueue(item.id);
        } catch (error) {
          item.retryCount++;
          console.error(`Failed to sync ${item.type}:`, error);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000 * item.retryCount));
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: OfflineQueueItem): Promise<void> {
    const { supabase } = await import('../lib/supabase');
    
    switch (item.type) {
      case 'medication':
        return this.syncMedication(item.data, supabase);
      case 'visit':
        return this.syncVisit(item.data, supabase);
      case 'incident':
        return this.syncIncident(item.data, supabase);
      case 'form':
        return this.syncForm(item.data, supabase);
      case 'expense':
        return this.syncExpense(item.data, supabase);
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }
  }

  private async syncMedication(data: any, supabase: any): Promise<void> {
    const { error } = await supabase
      .from('careflow_medication_administrations')
      .insert([data]);
    if (error) throw error;
  }

  private async syncVisit(data: any, supabase: any): Promise<void> {
    const { error } = await supabase
      .from('careflow_visits')
      .insert([data]);
    if (error) throw error;
  }

  private async syncIncident(data: any, supabase: any): Promise<void> {
    const { error } = await supabase
      .from('careflow_incidents')
      .insert([data]);
    if (error) throw error;
  }

  private async syncForm(data: any, supabase: any): Promise<void> {
    const { error } = await supabase
      .from('careflow_form_submissions')
      .insert([data]);
    if (error) throw error;
  }

  private async syncExpense(data: any, supabase: any): Promise<void> {
    const { error } = await supabase
      .from('careflow_expenses')
      .insert([data]);
    if (error) throw error;
  }

  private removeFromQueue(itemId: string): void {
    this.queue = this.queue.filter(item => item.id !== itemId);
    this.saveQueue();
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueuedItems(): OfflineQueueItem[] {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }

  // Conflict resolution for when both offline and online changes occur
  async resolveConflicts(localItem: OfflineQueueItem, serverData: any): Promise<any> {
    // Simple conflict resolution: prefer server data but merge critical fields
    if (localItem.type === 'medication') {
      return {
        ...serverData,
        notes: localItem.data.notes, // Preserve local notes
        administered_at: serverData.administered_at || localItem.data.administered_at
      };
    }
    
    // For other types, prefer server data with timestamp
    return serverData.timestamp > localItem.timestamp ? serverData : localItem.data;
  }

  // Get storage usage
  getStorageUsage(): { used: number; available: number } {
    try {
      const testKey = 'storage_test';
      const testData = 'x'.repeat(1024); // 1KB test data
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      
      // Estimate available space (very rough approximation)
      const used = new Blob([JSON.stringify(this.queue)]).size;
      const available = 5 * 1024 * 1024; // Assume 5MB limit
      
      return { used, available };
    } catch {
      return { used: 0, available: 0 };
    }
  }
}

export const offlineQueue = new OfflineQueue();
export default offlineQueue;