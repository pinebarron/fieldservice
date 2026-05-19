'use client';

import { useEffect, useState, useCallback } from 'react';
import { db, type OfflineWorkLog, type OfflineProperty, generateLocalId } from './db';
import { syncService, type SyncStatus } from './syncService';

// Cache duration in milliseconds (5 minutes for frequently changing data)
const CACHE_DURATION = 5 * 60 * 1000;

export function useOfflineWorkLogs(businessId: string) {
  const [workLogs, setWorkLogs] = useState<OfflineWorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = await db.workLogs
        .where('businessId')
        .equals(businessId)
        .reverse()
        .sortBy('serviceDate');

      setWorkLogs(cached);
      return cached;
    } catch (err) {
      console.error('Error loading work logs from cache:', err);
      return [];
    }
  }, [businessId]);

  const fetchAndCache = useCallback(async () => {
    if (!navigator.onLine) {
      return loadFromCache();
    }

    try {
      // Check cache freshness
      const cacheKey = `workLogs_${businessId}`;
      const metadata = await db.cacheMetadata.get(cacheKey);

      if (metadata && metadata.expiresAt > Date.now()) {
        // Cache is still fresh
        return loadFromCache();
      }

      // Fetch from server
      const response = await fetch(`/api/offline/data/work-logs?businessId=${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch work logs');

      const data = await response.json();

      // Store in IndexedDB
      await db.transaction('rw', db.workLogs, db.cacheMetadata, async () => {
        // Update existing records or add new ones
        for (const log of data) {
          const existing = await db.workLogs.get(log.id);
          if (!existing || existing._syncStatus === 'synced') {
            await db.workLogs.put({
              ...log,
              _syncStatus: 'synced',
              _lastModified: Date.now(),
            });
          }
          // Don't overwrite local pending changes
        }

        // Update cache metadata
        await db.cacheMetadata.put({
          key: cacheKey,
          table: 'workLogs',
          businessId,
          lastFetched: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        });
      });

      return loadFromCache();
    } catch (err) {
      console.error('Error fetching work logs:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Fall back to cache on error
      return loadFromCache();
    }
  }, [businessId, loadFromCache]);

  useEffect(() => {
    setIsLoading(true);
    fetchAndCache().finally(() => setIsLoading(false));
  }, [fetchAndCache]);

  // Create a new work log (works offline)
  const createWorkLog = useCallback(async (data: Omit<OfflineWorkLog, 'id' | '_syncStatus' | '_lastModified'>) => {
    const localId = generateLocalId();
    const now = Date.now();

    const newLog: OfflineWorkLog = {
      ...data,
      id: localId,
      _localId: localId,
      _syncStatus: 'pending',
      _lastModified: now,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.workLogs.add(newLog);

    // Queue for sync
    await syncService.queueMutation({
      action: 'create',
      table: 'work_logs',
      recordId: localId,
      payload: data,
    });

    // Refresh local state
    await loadFromCache();

    return newLog;
  }, [loadFromCache]);

  // Update work log (works offline)
  const updateWorkLog = useCallback(async (id: string, updates: Partial<OfflineWorkLog>) => {
    await db.workLogs.update(id, {
      ...updates,
      _syncStatus: 'pending',
      _lastModified: Date.now(),
      updatedAt: new Date().toISOString(),
    });

    await syncService.queueMutation({
      action: 'update',
      table: 'work_logs',
      recordId: id,
      payload: updates,
    });

    await loadFromCache();
  }, [loadFromCache]);

  // Delete work log (works offline)
  const deleteWorkLog = useCallback(async (id: string) => {
    // Mark as pending delete locally
    await db.workLogs.update(id, {
      _syncStatus: 'pending',
      _lastModified: Date.now(),
    });

    await syncService.queueMutation({
      action: 'delete',
      table: 'work_logs',
      recordId: id,
      payload: null,
    });

    // Remove from local state immediately
    await db.workLogs.delete(id);
    await loadFromCache();
  }, [loadFromCache]);

  return {
    workLogs,
    isLoading,
    error,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    refresh: fetchAndCache,
  };
}

export function useOfflineProperties(businessId: string) {
  const [properties, setProperties] = useState<OfflineProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFromCache = useCallback(async () => {
    const cached = await db.properties
      .where('businessId')
      .equals(businessId)
      .toArray();
    setProperties(cached);
    return cached;
  }, [businessId]);

  const fetchAndCache = useCallback(async () => {
    if (!navigator.onLine) {
      return loadFromCache();
    }

    try {
      const cacheKey = `properties_${businessId}`;
      const metadata = await db.cacheMetadata.get(cacheKey);

      if (metadata && metadata.expiresAt > Date.now()) {
        return loadFromCache();
      }

      const response = await fetch(`/api/offline/data/properties?businessId=${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch properties');

      const data = await response.json();

      await db.transaction('rw', db.properties, db.cacheMetadata, async () => {
        for (const prop of data) {
          const existing = await db.properties.get(prop.id);
          if (!existing || existing._syncStatus === 'synced') {
            await db.properties.put({
              ...prop,
              _syncStatus: 'synced',
              _lastModified: Date.now(),
            });
          }
        }

        await db.cacheMetadata.put({
          key: cacheKey,
          table: 'properties',
          businessId,
          lastFetched: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        });
      });

      return loadFromCache();
    } catch (err) {
      console.error('Error fetching properties:', err);
      return loadFromCache();
    }
  }, [businessId, loadFromCache]);

  useEffect(() => {
    setIsLoading(true);
    fetchAndCache().finally(() => setIsLoading(false));
  }, [fetchAndCache]);

  const createProperty = useCallback(async (data: Omit<OfflineProperty, 'id' | '_syncStatus' | '_lastModified'>) => {
    const localId = generateLocalId();

    const newProp: OfflineProperty = {
      ...data,
      id: localId,
      _localId: localId,
      _syncStatus: 'pending',
      _lastModified: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.properties.add(newProp);

    await syncService.queueMutation({
      action: 'create',
      table: 'properties',
      recordId: localId,
      payload: data,
    });

    await loadFromCache();
    return newProp;
  }, [loadFromCache]);

  return {
    properties,
    isLoading,
    createProperty,
    refresh: fetchAndCache,
  };
}

// Hook for sync status
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  useEffect(() => {
    // Get initial pending count
    syncService.getPendingCount().then(count => {
      setStatus(prev => ({ ...prev, pendingCount: count }));
    });

    // Subscribe to status changes
    const unsubscribe = syncService.subscribe(setStatus);

    return unsubscribe;
  }, []);

  const manualSync = useCallback(() => {
    return syncService.sync();
  }, []);

  return { ...status, manualSync };
}
