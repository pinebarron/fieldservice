import { db, generateLocalId, isLocalId, type OfflineFormTemplate, type OfflineFormSubmission } from './db';

/**
 * Cache form templates to IndexedDB for offline access
 */
export async function cacheFormTemplates(templates: Array<{
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  work_type: string | null;
  schema: unknown;
  logic_rules: unknown | null;
  is_active: string;
  created_at: string | null;
}>): Promise<void> {
  const now = Date.now();

  const offlineTemplates: OfflineFormTemplate[] = templates.map(t => ({
    id: t.id,
    businessId: t.business_id,
    name: t.name,
    description: t.description,
    workType: t.work_type || '',
    schema: t.schema,
    logicRules: t.logic_rules,
    isActive: t.is_active,
    createdAt: t.created_at,
    _syncStatus: 'synced' as const,
    _lastModified: now,
  }));

  // Upsert all templates
  await db.formTemplates.bulkPut(offlineTemplates);

  // Update cache metadata
  if (templates.length > 0) {
    await db.cacheMetadata.put({
      key: `formTemplates_${templates[0].business_id}`,
      table: 'formTemplates',
      businessId: templates[0].business_id,
      lastFetched: now,
      expiresAt: now + (24 * 60 * 60 * 1000), // 24 hour cache
    });
  }
}

/**
 * Get form templates from IndexedDB (for offline use)
 */
export async function getOfflineFormTemplates(businessId: string): Promise<OfflineFormTemplate[]> {
  return db.formTemplates
    .where('businessId')
    .equals(businessId)
    .filter(t => t.isActive === 'true')
    .toArray();
}

/**
 * Get a single form template from IndexedDB
 */
export async function getOfflineFormTemplate(templateId: string): Promise<OfflineFormTemplate | undefined> {
  return db.formTemplates.get(templateId);
}

/**
 * Check if form templates are cached and not expired
 */
export async function isFormTemplateCacheValid(businessId: string): Promise<boolean> {
  const metadata = await db.cacheMetadata.get(`formTemplates_${businessId}`);
  if (!metadata) return false;
  return metadata.expiresAt > Date.now();
}

/**
 * Save a form submission offline
 */
export async function saveOfflineFormSubmission(
  workLogId: string,
  formTemplateId: string,
  responses: Record<string, unknown>,
  pendingPhotos?: OfflineFormSubmission['_pendingPhotos']
): Promise<string> {
  const now = Date.now();
  const id = generateLocalId();

  const submission: OfflineFormSubmission = {
    id,
    workLogId,
    formTemplateId,
    responses,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _localId: id,
    _syncStatus: 'pending',
    _lastModified: now,
    _pendingPhotos: pendingPhotos,
  };

  await db.formSubmissions.put(submission);

  // Add to sync queue
  await db.syncQueue.add({
    action: 'create',
    table: 'form_submissions',
    recordId: id,
    payload: submission,
    createdAt: now,
    attempts: 0,
    lastError: null,
  });

  return id;
}

/**
 * Update an existing offline form submission
 */
export async function updateOfflineFormSubmission(
  id: string,
  responses: Record<string, unknown>,
  pendingPhotos?: OfflineFormSubmission['_pendingPhotos']
): Promise<void> {
  const now = Date.now();
  const existing = await db.formSubmissions.get(id);

  if (!existing) {
    throw new Error(`Form submission ${id} not found`);
  }

  const updated: OfflineFormSubmission = {
    ...existing,
    responses,
    updatedAt: new Date().toISOString(),
    _syncStatus: 'pending',
    _lastModified: now,
    _pendingPhotos: pendingPhotos,
  };

  await db.formSubmissions.put(updated);

  // Add to sync queue
  const action = isLocalId(id) ? 'create' : 'update';
  await db.syncQueue.add({
    action,
    table: 'form_submissions',
    recordId: id,
    payload: updated,
    createdAt: now,
    attempts: 0,
    lastError: null,
  });
}

/**
 * Get offline form submissions for a work log
 */
export async function getOfflineFormSubmissions(workLogId: string): Promise<OfflineFormSubmission[]> {
  return db.formSubmissions
    .where('workLogId')
    .equals(workLogId)
    .toArray();
}

/**
 * Get all pending (unsynced) form submissions
 */
export async function getPendingFormSubmissions(): Promise<OfflineFormSubmission[]> {
  return db.formSubmissions
    .where('_syncStatus')
    .equals('pending')
    .toArray();
}

/**
 * Mark a form submission as synced (after successful upload)
 */
export async function markFormSubmissionSynced(
  localId: string,
  serverId: string
): Promise<void> {
  const submission = await db.formSubmissions.get(localId);
  if (!submission) return;

  // Remove old record with local ID
  await db.formSubmissions.delete(localId);

  // Add new record with server ID
  await db.formSubmissions.put({
    ...submission,
    id: serverId,
    _localId: undefined,
    _syncStatus: 'synced',
    _lastModified: Date.now(),
    _pendingPhotos: undefined, // Photos have been uploaded
  });
}

/**
 * Mark a form submission sync as failed
 */
export async function markFormSubmissionError(id: string, error: string): Promise<void> {
  await db.formSubmissions.update(id, {
    _syncStatus: 'error',
    _lastModified: Date.now(),
  });
}

/**
 * Cache a single form submission from the server
 */
export async function cacheFormSubmission(submission: {
  id: string;
  work_log_id: string;
  form_template_id: string;
  responses: Record<string, unknown>;
  submitted_at: string;
  created_at: string | null;
  updated_at: string | null;
}): Promise<void> {
  const offlineSubmission: OfflineFormSubmission = {
    id: submission.id,
    workLogId: submission.work_log_id,
    formTemplateId: submission.form_template_id,
    responses: submission.responses,
    submittedAt: submission.submitted_at,
    createdAt: submission.created_at,
    updatedAt: submission.updated_at,
    _syncStatus: 'synced',
    _lastModified: Date.now(),
  };

  await db.formSubmissions.put(offlineSubmission);
}

/**
 * Extract photos from form responses for offline storage
 */
export function extractPhotosFromResponses(
  responses: Record<string, unknown>
): OfflineFormSubmission['_pendingPhotos'] {
  const photos: OfflineFormSubmission['_pendingPhotos'] = [];

  for (const [fieldId, value] of Object.entries(responses)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'blob' in item) {
          photos.push({
            fieldId,
            blob: item.blob as Blob,
            filename: item.filename || `photo_${Date.now()}.jpg`,
            gps: item.gps,
            capturedAt: item.capturedAt || new Date().toISOString(),
          });
        }
      }
    }
  }

  return photos.length > 0 ? photos : undefined;
}
