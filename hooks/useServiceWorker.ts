'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isUpdateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        setState(prev => ({
          ...prev,
          isInstalled: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                setState(prev => ({
                  ...prev,
                  isUpdateAvailable: true,
                }));
              }
            });
          }
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    handleRegistration();

    // Listen for controller changes (when skipWaiting is called)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const updateServiceWorker = () => {
    if (state.registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    ...state,
    updateServiceWorker,
  };
}
