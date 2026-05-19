'use client';

import { db, type OfflinePhoto, generateLocalId } from './db';

// Store a photo blob locally for later upload
export async function storeOfflinePhoto(
  workLogId: string,
  blob: Blob,
  type: 'before' | 'after' | 'general'
): Promise<OfflinePhoto> {
  const photo: OfflinePhoto = {
    id: generateLocalId(),
    workLogId,
    blob,
    type,
    capturedAt: new Date().toISOString(),
    uploaded: false,
    uploadedUrl: null,
  };

  await db.photos.add(photo);
  return photo;
}

// Get all photos for a work log
export async function getPhotosForWorkLog(workLogId: string): Promise<OfflinePhoto[]> {
  return db.photos.where('workLogId').equals(workLogId).toArray();
}

// Get all pending (not uploaded) photos
export async function getPendingPhotos(): Promise<OfflinePhoto[]> {
  return db.photos.where('uploaded').equals(0).toArray();
}

// Mark a photo as uploaded and store the URL
export async function markPhotoUploaded(photoId: string, uploadedUrl: string): Promise<void> {
  await db.photos.update(photoId, {
    uploaded: true,
    uploadedUrl,
  });
}

// Delete a local photo
export async function deleteOfflinePhoto(photoId: string): Promise<void> {
  await db.photos.delete(photoId);
}

// Convert a blob to a data URL for display
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert a File to a blob
export function fileToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
      resolve(blob);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Upload pending photos when online
export async function uploadPendingPhotos(
  uploadFn: (blob: Blob, filename: string) => Promise<string>
): Promise<{ uploaded: number; failed: number }> {
  if (!navigator.onLine) {
    return { uploaded: 0, failed: 0 };
  }

  const pendingPhotos = await getPendingPhotos();
  let uploaded = 0;
  let failed = 0;

  for (const photo of pendingPhotos) {
    try {
      const filename = `${photo.type}_${photo.id}.jpg`;
      const url = await uploadFn(photo.blob, filename);
      await markPhotoUploaded(photo.id, url);
      uploaded++;
    } catch (error) {
      console.error('Failed to upload photo:', photo.id, error);
      failed++;
    }
  }

  return { uploaded, failed };
}

// Get total size of stored photos (for storage management)
export async function getPhotoStorageSize(): Promise<number> {
  const photos = await db.photos.toArray();
  return photos.reduce((total, photo) => total + photo.blob.size, 0);
}

// Clear old uploaded photos to free space
export async function clearUploadedPhotos(): Promise<number> {
  const uploadedPhotos = await db.photos.where('uploaded').equals(1).toArray();
  const ids = uploadedPhotos.map(p => p.id);
  await db.photos.bulkDelete(ids);
  return ids.length;
}
