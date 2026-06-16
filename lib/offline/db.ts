import Dexie, { type Table } from 'dexie';

// Offline-compatible types (matching Supabase but with local tracking)
export interface OfflineWorkLog {
  id: string;
  businessId: string;
  propertyId: string | null;
  technicianUserId: string;
  customerName: string;
  workType: string;
  locationName: string;
  city: string;
  state: string;
  zipCode: string;
  serviceDate: string;
  startTime: string | null;
  endTime: string | null;
  workPerformed: string;
  additionalNotes: string | null;
  status: string;
  technicianUserIds: string[] | null;
  imageUrls: string[] | null;
  photoMetadata: unknown[] | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Offline tracking
  _localId?: string;
  _syncStatus: 'synced' | 'pending' | 'error';
  _lastModified: number;
}

export interface OfflineProperty {
  id: string;
  businessId: string;
  propertyName: string;
  customerName: string;
  locationName: string;
  city: string;
  state: string;
  zipCode: string;
  status: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Offline tracking
  _localId?: string;
  _syncStatus: 'synced' | 'pending' | 'error';
  _lastModified: number;
}

export interface OfflineFormTemplate {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  workType: string;
  schema: unknown;
  logicRules: unknown | null;
  isActive: string;
  createdAt: string | null;
  // Offline tracking
  _syncStatus: 'synced' | 'pending' | 'error';
  _lastModified: number;
}

export interface OfflineFormSubmission {
  id: string;
  workLogId: string;
  formTemplateId: string;
  responses: Record<string, unknown>;
  submittedAt: string;
  createdAt: string | null;
  updatedAt: string | null;
  // Offline tracking
  _localId?: string;
  _syncStatus: 'synced' | 'pending' | 'error';
  _lastModified: number;
  // Store photo blobs separately for offline
  _pendingPhotos?: Array<{
    fieldId: string;
    blob: Blob;
    filename: string;
    gps?: { lat: number; lng: number; accuracy?: number };
    capturedAt: string;
  }>;
}

export interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  table: 'work_logs' | 'properties' | 'form_submissions';
  recordId: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

export interface OfflinePhoto {
  id: string;
  workLogId: string;
  blob: Blob;
  type: 'before' | 'after' | 'general';
  capturedAt: string;
  uploaded: boolean;
  uploadedUrl: string | null;
}

export interface CacheMetadata {
  key: string;
  table: string;
  businessId: string;
  lastFetched: number;
  expiresAt: number;
}

class FieldServiceDB extends Dexie {
  workLogs!: Table<OfflineWorkLog, string>;
  properties!: Table<OfflineProperty, string>;
  formTemplates!: Table<OfflineFormTemplate, string>;
  formSubmissions!: Table<OfflineFormSubmission, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  photos!: Table<OfflinePhoto, string>;
  cacheMetadata!: Table<CacheMetadata, string>;

  constructor() {
    super('FieldServiceDB');

    this.version(1).stores({
      workLogs: 'id, businessId, serviceDate, status, _syncStatus, _lastModified',
      properties: 'id, businessId, customerName, _syncStatus, _lastModified',
      formTemplates: 'id, businessId, workType, _syncStatus',
      syncQueue: '++id, table, recordId, createdAt, attempts',
      photos: 'id, workLogId, uploaded',
      cacheMetadata: 'key, table, businessId, expiresAt',
    });

    // Version 2: Add form submissions table
    this.version(2).stores({
      workLogs: 'id, businessId, serviceDate, status, _syncStatus, _lastModified',
      properties: 'id, businessId, customerName, _syncStatus, _lastModified',
      formTemplates: 'id, businessId, workType, _syncStatus',
      formSubmissions: 'id, workLogId, formTemplateId, _syncStatus, _lastModified',
      syncQueue: '++id, table, recordId, createdAt, attempts',
      photos: 'id, workLogId, uploaded',
      cacheMetadata: 'key, table, businessId, expiresAt',
    });
  }
}

export const db = new FieldServiceDB();

// Helper to generate temporary local IDs for new records
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if an ID is a local (unsynced) ID
export function isLocalId(id: string): boolean {
  return id.startsWith('local_');
}
