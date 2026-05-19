'use client';

import { db, type SyncQueueItem, isLocalId } from './db';

type SyncAction = {
  action: 'create' | 'update' | 'delete';
  table: 'work_logs' | 'properties' | 'form_submissions';
  recordId: string;
  payload: unknown;
};

class SyncService {
  private isSyncing = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  // Queue a mutation for later sync
  async queueMutation(mutation: SyncAction): Promise<void> {
    await db.syncQueue.add({
      ...mutation,
      createdAt: Date.now(),
      attempts: 0,
      lastError: null,
    });

    this.notifyListeners();

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  // Get pending sync count
  async getPendingCount(): Promise<number> {
    return db.syncQueue.count();
  }

  // Get all pending items
  async getPendingItems(): Promise<SyncQueueItem[]> {
    return db.syncQueue.toArray();
  }

  // Main sync function
  async sync(): Promise<SyncResult> {
    if (this.isSyncing || !navigator.onLine) {
      return { success: false, synced: 0, failed: 0, reason: this.isSyncing ? 'already_syncing' : 'offline' };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let synced = 0;
    let failed = 0;

    try {
      const items = await db.syncQueue.orderBy('createdAt').toArray();

      for (const item of items) {
        try {
          await this.processSyncItem(item);
          await db.syncQueue.delete(item.id!);
          synced++;
        } catch (error) {
          failed++;
          // Update attempt count and error
          await db.syncQueue.update(item.id!, {
            attempts: item.attempts + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });

          // If too many attempts, we might want to handle differently
          if (item.attempts >= 5) {
            console.error(`Sync item ${item.id} failed after 5 attempts`, error);
          }
        }
      }

      return { success: true, synced, failed };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { action, table, recordId, payload } = item;

    // Call the appropriate server action based on the mutation
    // This uses dynamic imports to call server actions
    switch (table) {
      case 'work_logs':
        await this.syncWorkLog(action, recordId, payload);
        break;
      case 'properties':
        await this.syncProperty(action, recordId, payload);
        break;
      case 'form_submissions':
        await this.syncFormSubmission(action, recordId, payload);
        break;
    }
  }

  private async syncWorkLog(action: string, recordId: string, payload: unknown): Promise<void> {
    // For work logs, we call the server actions via fetch
    // This is because we're in a client context and can't directly call server actions
    const data = payload as Record<string, unknown>;

    if (action === 'create') {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      const response = await fetch('/api/offline/sync/work-logs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync work log');
      }

      const result = await response.json();

      // Update local record with server ID if it was a local ID
      if (isLocalId(recordId) && result.id) {
        await db.workLogs.where('id').equals(recordId).modify({
          id: result.id,
          _syncStatus: 'synced',
        });
      }
    } else if (action === 'update') {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      const response = await fetch(`/api/offline/sync/work-logs/${recordId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update work log');
      }

      await db.workLogs.where('id').equals(recordId).modify({
        _syncStatus: 'synced',
      });
    } else if (action === 'delete') {
      const response = await fetch(`/api/offline/sync/work-logs/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete work log');
      }

      await db.workLogs.delete(recordId);
    }
  }

  private async syncProperty(action: string, recordId: string, payload: unknown): Promise<void> {
    const data = payload as Record<string, unknown>;

    if (action === 'create') {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch('/api/offline/sync/properties', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to sync property');
      }

      const result = await response.json();

      if (isLocalId(recordId) && result.id) {
        await db.properties.where('id').equals(recordId).modify({
          id: result.id,
          _syncStatus: 'synced',
        });
      }
    }
  }

  private async syncFormSubmission(action: string, recordId: string, payload: unknown): Promise<void> {
    // Form submissions are typically created along with work logs
    // Handle if needed
    console.log('Syncing form submission', { action, recordId, payload });
  }

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async notifyListeners(): Promise<void> {
    const pendingCount = await this.getPendingCount();
    const status: SyncStatus = {
      isSyncing: this.isSyncing,
      pendingCount,
      isOnline: navigator.onLine,
    };
    this.listeners.forEach(listener => listener(status));
  }

  // Initialize sync service - call on app load
  init(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.notifyListeners();
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });

    // Initial sync attempt
    if (navigator.onLine) {
      this.sync();
    }
  }
}

export type SyncStatus = {
  isSyncing: boolean;
  pendingCount: number;
  isOnline: boolean;
};

export type SyncResult = {
  success: boolean;
  synced: number;
  failed: number;
  reason?: string;
};

// Singleton instance
export const syncService = new SyncService();
