'use client';

import { useEffect, useState } from 'react';
import { useSyncStatus } from '@/lib/offline/useOfflineData';
import { getDebugOffline } from '@/lib/offline/debugOffline';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const { pendingCount, isSyncing } = useSyncStatus();

  useEffect(() => {
    // Check initial state (respecting debug mode)
    const debug = getDebugOffline();
    setIsOffline(debug !== null ? debug : !navigator.onLine);

    const handleOnline = () => {
      if (getDebugOffline() === null) {
        setIsOffline(false);
        // Show "back online" message briefly
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
      }
    };

    const handleOffline = () => {
      if (getDebugOffline() === null) {
        setIsOffline(true);
        setShowBanner(true);
      }
    };

    // Listen for debug mode changes
    const handleDebugChange = (e: CustomEvent<{ offline: boolean | null }>) => {
      if (e.detail.offline !== null) {
        setIsOffline(e.detail.offline);
        setShowBanner(true);
        if (!e.detail.offline) {
          setTimeout(() => setShowBanner(false), 3000);
        }
      } else {
        setIsOffline(!navigator.onLine);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('debug-offline-change', handleDebugChange as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('debug-offline-change', handleDebugChange as EventListener);
    };
  }, []);

  // Show banner if offline, syncing, has pending changes, or just came back online
  const shouldShow = isOffline || isSyncing || pendingCount > 0 || showBanner;

  if (!shouldShow) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOffline
          ? 'bg-amber-500 text-white'
          : isSyncing
          ? 'bg-blue-500 text-white'
          : pendingCount > 0
          ? 'bg-amber-500 text-white'
          : 'bg-green-500 text-white'
      }`}
    >
      {isOffline ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          You're offline
          {pendingCount > 0 && ` - ${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending`}
        </span>
      ) : isSyncing ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Syncing changes...
        </span>
      ) : pendingCount > 0 ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {pendingCount} change{pendingCount !== 1 ? 's' : ''} waiting to sync
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Back online - all changes synced
        </span>
      )}
    </div>
  );
}
