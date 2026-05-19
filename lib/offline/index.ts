// Offline data layer - IndexedDB + sync queue
export { db, generateLocalId, isLocalId } from './db';
export type {
  OfflineWorkLog,
  OfflineProperty,
  OfflineFormTemplate,
  SyncQueueItem,
  OfflinePhoto,
} from './db';

export { syncService } from './syncService';
export type { SyncStatus, SyncResult } from './syncService';

export {
  useOfflineWorkLogs,
  useOfflineProperties,
  useSyncStatus,
} from './useOfflineData';

export {
  storeOfflinePhoto,
  getPhotosForWorkLog,
  getPendingPhotos,
  markPhotoUploaded,
  deleteOfflinePhoto,
  blobToDataUrl,
  fileToBlob,
  uploadPendingPhotos,
  getPhotoStorageSize,
  clearUploadedPhotos,
} from './photoStorage';
