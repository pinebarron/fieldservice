'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';

export function UpdatePrompt() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg border border-gray-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-green-600"
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
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            New version available
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Refresh to get the latest features and fixes.
          </p>
        </div>
        <button
          onClick={updateServiceWorker}
          className="flex-shrink-0 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
