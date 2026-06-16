'use client';

import { useState, useEffect } from 'react';
import { setDebugOffline, getDebugOffline } from '@/lib/offline/debugOffline';

/**
 * Debug toggle for testing offline functionality
 * Only shows in development mode
 */
export function OfflineDebugToggle() {
  const [mode, setMode] = useState<'auto' | 'offline' | 'online'>('auto');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    setIsVisible(process.env.NODE_ENV === 'development');

    // Get initial state
    const debug = getDebugOffline();
    if (debug === true) setMode('offline');
    else if (debug === false) setMode('online');
    else setMode('auto');
  }, []);

  const handleToggle = () => {
    const nextMode = mode === 'auto' ? 'offline' : mode === 'offline' ? 'online' : 'auto';
    setMode(nextMode);

    if (nextMode === 'offline') {
      setDebugOffline(true);
    } else if (nextMode === 'online') {
      setDebugOffline(false);
    } else {
      setDebugOffline(null);
    }
  };

  if (!isVisible) return null;

  const modeColors = {
    auto: 'bg-gray-500',
    offline: 'bg-red-500',
    online: 'bg-green-500',
  };

  const modeLabels = {
    auto: 'Auto',
    offline: 'Offline',
    online: 'Online',
  };

  const modeIcons = {
    auto: 'fa-wifi',
    offline: 'fa-wifi-slash',
    online: 'fa-wifi',
  };

  return (
    <button
      onClick={handleToggle}
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-white text-xs font-medium shadow-lg transition-colors ${modeColors[mode]}`}
      title={`Network mode: ${modeLabels[mode]}. Click to toggle.`}
    >
      <i className={`fas ${modeIcons[mode]}`}></i>
      <span>{modeLabels[mode]}</span>
    </button>
  );
}
