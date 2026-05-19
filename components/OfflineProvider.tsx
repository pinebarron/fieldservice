'use client';

import { useEffect, type ReactNode } from 'react';
import { syncService } from '@/lib/offline/syncService';

export function OfflineProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize the sync service when the app loads
    syncService.init();
  }, []);

  return <>{children}</>;
}
