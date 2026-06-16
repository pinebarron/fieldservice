/**
 * Debug utilities for testing offline functionality
 *
 * Usage:
 * - Import and call setDebugOffline(true) to simulate offline mode
 * - The useOfflineForm hook will respect this setting
 */

// Global state for debug offline mode
let debugOfflineMode: boolean | null = null;

/**
 * Set debug offline mode
 * @param offline - true to simulate offline, false to simulate online, null to use real network state
 */
export function setDebugOffline(offline: boolean | null): void {
  debugOfflineMode = offline;

  // Dispatch a custom event so hooks can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debug-offline-change', { detail: { offline } }));
  }
}

/**
 * Get the current debug offline mode
 * @returns true if simulating offline, false if simulating online, null if using real network state
 */
export function getDebugOffline(): boolean | null {
  return debugOfflineMode;
}

/**
 * Check if we should consider the app offline (respects debug mode)
 */
export function isEffectivelyOffline(): boolean {
  if (debugOfflineMode !== null) {
    return debugOfflineMode;
  }
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

/**
 * Check if we should consider the app online (respects debug mode)
 */
export function isEffectivelyOnline(): boolean {
  return !isEffectivelyOffline();
}
