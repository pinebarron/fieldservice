'use client';

import { useCallback, useEffect, useState } from 'react';
import { saveFormSubmission as saveFormSubmissionServer } from '@/app/tech/actions';
import {
  saveOfflineFormSubmission,
  updateOfflineFormSubmission,
  getOfflineFormSubmissions,
  cacheFormTemplates,
  getOfflineFormTemplates,
  getOfflineFormTemplate,
  isFormTemplateCacheValid,
  extractPhotosFromResponses,
} from './formOffline';
import { isLocalId, type OfflineFormSubmission, type OfflineFormTemplate } from './db';
import { getDebugOffline, isEffectivelyOnline } from './debugOffline';

interface UseOfflineFormOptions {
  businessId: string;
}

interface FormTemplate {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  work_type: string | null;
  schema: unknown;
  logic_rules: unknown | null;
  is_active: string;
  created_at: string | null;
}

export function useOfflineForm({ businessId }: UseOfflineFormOptions) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [debugMode, setDebugMode] = useState<boolean | null>(null);

  useEffect(() => {
    // Check debug mode and set initial state
    const debug = getDebugOffline();
    setDebugMode(debug);

    if (debug !== null) {
      setIsOnline(!debug);
    } else {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      if (getDebugOffline() === null) setIsOnline(true);
    };
    const handleOffline = () => {
      if (getDebugOffline() === null) setIsOnline(false);
    };

    // Listen for debug mode changes
    const handleDebugChange = (e: CustomEvent<{ offline: boolean | null }>) => {
      setDebugMode(e.detail.offline);
      if (e.detail.offline !== null) {
        setIsOnline(!e.detail.offline);
      } else {
        setIsOnline(navigator.onLine);
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

  /**
   * Cache form templates for offline use
   */
  const cacheTemplates = useCallback(async (templates: FormTemplate[]) => {
    await cacheFormTemplates(templates);
  }, []);

  /**
   * Get form templates (from cache if offline or cache is valid)
   */
  const getTemplates = useCallback(async (
    fetchFromServer: () => Promise<FormTemplate[]>
  ): Promise<FormTemplate[] | OfflineFormTemplate[]> => {
    if (isOnline) {
      try {
        const templates = await fetchFromServer();
        // Cache for offline use
        await cacheFormTemplates(templates);
        return templates;
      } catch (error) {
        console.error('Failed to fetch templates, trying cache:', error);
        // Fall back to cache
        return getOfflineFormTemplates(businessId);
      }
    } else {
      // Offline - use cache
      return getOfflineFormTemplates(businessId);
    }
  }, [isOnline, businessId]);

  /**
   * Get a single form template
   */
  const getTemplate = useCallback(async (
    templateId: string,
    fetchFromServer?: () => Promise<FormTemplate | null>
  ): Promise<FormTemplate | OfflineFormTemplate | null> => {
    if (isOnline && fetchFromServer) {
      try {
        const template = await fetchFromServer();
        return template;
      } catch (error) {
        console.error('Failed to fetch template, trying cache:', error);
        const cached = await getOfflineFormTemplate(templateId);
        return cached || null;
      }
    } else {
      const cached = await getOfflineFormTemplate(templateId);
      return cached || null;
    }
  }, [isOnline]);

  /**
   * Save form submission (handles offline automatically)
   */
  const saveSubmission = useCallback(async (
    jobId: string,
    templateId: string,
    responses: Record<string, unknown>,
    existingSubmissionId?: string
  ): Promise<{ success: boolean; error?: string; offlineId?: string }> => {
    if (isOnline) {
      // Online - save to server
      try {
        const result = await saveFormSubmissionServer(
          jobId,
          templateId,
          responses,
          existingSubmissionId
        );
        // Normalize result to match expected return type
        if (result.error) {
          return { success: false, error: result.error };
        }
        return { success: true };
      } catch (error) {
        console.error('Server save failed, saving offline:', error);
        // Fall through to offline save
      }
    }

    // Offline or server failed - save locally
    try {
      const pendingPhotos = extractPhotosFromResponses(responses);

      // Clean responses of blob data (just keep URLs/metadata)
      const cleanedResponses = cleanResponsesForStorage(responses);

      if (existingSubmissionId && isLocalId(existingSubmissionId)) {
        await updateOfflineFormSubmission(existingSubmissionId, cleanedResponses, pendingPhotos);
        return { success: true, offlineId: existingSubmissionId };
      } else {
        const offlineId = await saveOfflineFormSubmission(
          jobId,
          templateId,
          cleanedResponses,
          pendingPhotos
        );
        return { success: true, offlineId };
      }
    } catch (error) {
      console.error('Offline save failed:', error);
      return { success: false, error: 'Failed to save form offline' };
    }
  }, [isOnline]);

  /**
   * Get form submissions for a job (merges online and offline)
   */
  const getSubmissions = useCallback(async (
    jobId: string,
    fetchFromServer?: () => Promise<Array<{
      id: string;
      work_log_id: string;
      template_id: string;
      responses: Record<string, unknown>;
      submitted_at: string;
    }>>
  ) => {
    const offlineSubmissions = await getOfflineFormSubmissions(jobId);

    if (isOnline && fetchFromServer) {
      try {
        const serverSubmissions = await fetchFromServer();

        // Merge: offline pending submissions + server submissions (excluding synced offline ones)
        const pendingOffline = offlineSubmissions.filter(s => s._syncStatus === 'pending');
        const serverIds = new Set(serverSubmissions.map(s => s.id));

        // Filter out offline submissions that have been synced (exist on server)
        const uniquePending = pendingOffline.filter(s => !serverIds.has(s.id));

        return {
          submissions: [
            ...serverSubmissions.map(s => ({
              ...s,
              _isOffline: false,
              _syncStatus: 'synced' as const,
            })),
            ...uniquePending.map(s => ({
              id: s.id,
              work_log_id: s.workLogId,
              template_id: s.formTemplateId,
              responses: s.responses,
              submitted_at: s.submittedAt,
              _isOffline: true,
              _syncStatus: s._syncStatus,
            })),
          ],
          hasPending: uniquePending.length > 0,
        };
      } catch (error) {
        console.error('Failed to fetch submissions from server:', error);
      }
    }

    // Offline or fetch failed - return cached submissions
    return {
      submissions: offlineSubmissions.map(s => ({
        id: s.id,
        work_log_id: s.workLogId,
        template_id: s.formTemplateId,
        responses: s.responses,
        submitted_at: s.submittedAt,
        _isOffline: true,
        _syncStatus: s._syncStatus,
      })),
      hasPending: offlineSubmissions.some(s => s._syncStatus === 'pending'),
    };
  }, [isOnline]);

  return {
    isOnline,
    isSyncing,
    cacheTemplates,
    getTemplates,
    getTemplate,
    saveSubmission,
    getSubmissions,
  };
}

/**
 * Clean responses for storage by removing blob data
 * (blobs are stored separately in _pendingPhotos)
 */
function cleanResponsesForStorage(responses: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(responses)) {
    if (Array.isArray(value)) {
      // Check if it's an array of photos with blobs
      const cleanedArray = value.map(item => {
        if (item && typeof item === 'object' && 'blob' in item) {
          // Remove blob, keep other metadata
          const { blob, ...rest } = item as Record<string, unknown>;
          return {
            ...rest,
            _pendingUpload: true, // Mark for later upload
          };
        }
        return item;
      });
      cleaned[key] = cleanedArray;
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export type { OfflineFormSubmission, OfflineFormTemplate };
