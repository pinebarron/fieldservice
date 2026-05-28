'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/app/schedule/upload-action';
import { GPSCamera, CapturedPhoto } from './GPSCamera';
import type { FormPhotoValue, PhotoFieldConfig } from '@/lib/form-types';

// Local type for form field since we can't import from shared/schema
interface FormFieldDefinition {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  photoConfig?: PhotoFieldConfig;
}

interface FormPhotoFieldProps {
  field: FormFieldDefinition;
  value: FormPhotoValue[];
  onChange: (photos: FormPhotoValue[]) => void;
  jobLocation?: { lat: number; lng: number };
  disabled?: boolean;
}

// Calculate distance between two GPS points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compress image before upload
async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    if (file.size < 500000) {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      } else {
        resolve(file);
      }
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function FormPhotoField({ field, value, onChange, jobLocation, disabled = false }: FormPhotoFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = field.photoConfig || {};
  const maxPhotos = config.maxPhotos ?? 5;
  const minPhotos = config.minPhotos ?? 0;
  const gpsRequired = config.gpsRequired ?? false;
  const verifyLocation = config.verifyLocation ?? false;
  const verificationRadius = config.verificationRadius ?? 100;
  const classification = config.classification ?? 'general';

  // Determine verification status for a photo
  const getVerificationStatus = (photo: FormPhotoValue): 'verified' | 'mismatch' | 'pending' => {
    if (!verifyLocation || !jobLocation) return 'pending';
    if (!photo.lat || !photo.lng) return 'pending';

    const distance = calculateDistance(photo.lat, photo.lng, jobLocation.lat, jobLocation.lng);
    return distance <= verificationRadius ? 'verified' : 'mismatch';
  };

  const handleCameraCapture = async (photo: CapturedPhoto) => {
    setShowCamera(false);
    setUploading(true);
    setError('');

    try {
      const file = new File([photo.blob], `photo-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      setUploadProgress('Compressing...');
      const compressedFile = await compressImage(file);

      setUploadProgress('Uploading...');
      const formData = new FormData();
      formData.append('file', compressedFile);

      const result = await uploadImage(formData);

      if (result.error) throw new Error(result.error);
      if (!result.url) throw new Error('No URL returned from upload');

      // Calculate distance from job if location verification is enabled
      let distanceFromJob: number | undefined;
      let verificationStatus: 'pending' | 'verified' | 'mismatch' = 'pending';

      if (verifyLocation && jobLocation && photo.lat && photo.lng) {
        distanceFromJob = calculateDistance(photo.lat, photo.lng, jobLocation.lat, jobLocation.lng);
        verificationStatus = distanceFromJob <= verificationRadius ? 'verified' : 'mismatch';
      }

      const newPhoto: FormPhotoValue = {
        url: result.url,
        lat: photo.lat ?? undefined,
        lng: photo.lng ?? undefined,
        accuracy: photo.accuracy ?? undefined,
        altitude: photo.altitude ?? undefined,
        capturedAt: photo.capturedAt,
        hasExif: photo.hasExif,
        verificationStatus,
        distanceFromJob,
      };

      onChange([...value, newPhoto]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const newPhotos: FormPhotoValue[] = [];

      for (let i = 0; i < files.length && value.length + newPhotos.length < maxPhotos; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        setUploadProgress(`Processing ${i + 1}/${files.length}...`);
        const compressedFile = await compressImage(file);

        const formData = new FormData();
        formData.append('file', compressedFile);

        const result = await uploadImage(formData);
        if (result.error) throw new Error(result.error);
        if (!result.url) throw new Error('No URL returned');

        // Gallery uploads don't have GPS - mark as pending
        newPhotos.push({
          url: result.url,
          capturedAt: new Date().toISOString(),
          verificationStatus: 'pending',
        });
      }

      onChange([...value, ...newPhotos]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...value];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  // Get border color based on classification
  const getBorderColor = () => {
    switch (classification) {
      case 'before': return 'border-orange-500';
      case 'after': return 'border-green-500';
      default: return 'border-blue-500';
    }
  };

  // Get verification badge for a photo
  const VerificationBadge = ({ photo }: { photo: FormPhotoValue }) => {
    const status = photo.verificationStatus || getVerificationStatus(photo);

    if (!photo.lat || !photo.lng) {
      return (
        <div
          className="absolute bottom-1 left-1 w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center"
          title="No GPS data"
        >
          <i className="fas fa-question text-xs"></i>
        </div>
      );
    }

    if (status === 'verified') {
      return (
        <div
          className="absolute bottom-1 left-1 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center"
          title={`Verified - ${photo.distanceFromJob ? Math.round(photo.distanceFromJob) + 'm from job' : 'Location confirmed'}`}
        >
          <i className="fas fa-check text-xs"></i>
        </div>
      );
    }

    if (status === 'mismatch') {
      return (
        <div
          className="absolute bottom-1 left-1 w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center"
          title={`Location mismatch - ${photo.distanceFromJob ? Math.round(photo.distanceFromJob) + 'm from job' : 'Outside verification radius'}`}
        >
          <i className="fas fa-exclamation text-xs"></i>
        </div>
      );
    }

    return (
      <div
        className={`absolute bottom-1 left-1 w-5 h-5 ${photo.hasExif ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-full flex items-center justify-center`}
        title={`GPS: ${photo.lat?.toFixed(4)}, ${photo.lng?.toFixed(4)}${photo.hasExif ? ' (EXIF embedded)' : ''}`}
      >
        <i className={`fas ${photo.hasExif ? 'fa-check' : 'fa-map-marker-alt'} text-xs`}></i>
      </div>
    );
  };

  const canAddMore = value.length < maxPhotos;
  const hasMinPhotos = value.length >= minPhotos;

  return (
    <>
      {showCamera && (
        <GPSCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="space-y-3">
        {error && (
          <div className="p-2 rounded bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || !canAddMore}
        />

        {/* Photo grid */}
        {value.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {value.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className={`w-full h-20 object-cover rounded border-2 ${getBorderColor()}`}
                />
                <VerificationBadge photo={photo} />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  disabled={disabled}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`border-2 border-dashed ${getBorderColor().replace('border-', 'border-').replace('500', '300')} rounded p-4 text-center text-muted-foreground text-sm`}>
            {gpsRequired ? (
              <>
                <i className="fas fa-camera text-lg mb-1 block"></i>
                Use camera to capture GPS-tagged photos
              </>
            ) : (
              <>
                <i className="fas fa-image text-lg mb-1 block"></i>
                No photos added
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCamera(true)}
            disabled={disabled || uploading || !canAddMore}
            className="flex-1"
          >
            <i className="fas fa-camera mr-2"></i>
            Camera
            {gpsRequired && <span className="ml-1 text-xs text-muted-foreground">(GPS)</span>}
          </Button>

          {!gpsRequired && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading || !canAddMore}
              className="flex-1"
            >
              <i className="fas fa-upload mr-2"></i>
              Gallery
            </Button>
          )}
        </div>

        {/* Progress and status */}
        {uploading && (
          <div className="text-center text-sm text-muted-foreground">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            {uploadProgress || 'Uploading...'}
          </div>
        )}

        {/* Photo count and requirements */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {value.length} / {maxPhotos} photos
            {minPhotos > 0 && !hasMinPhotos && (
              <span className="text-destructive ml-2">
                (min {minPhotos} required)
              </span>
            )}
          </span>
          {verifyLocation && jobLocation && (
            <span className="flex items-center gap-1">
              <i className="fas fa-map-marker-alt"></i>
              Verification: {verificationRadius}m radius
            </span>
          )}
        </div>

        {/* GPS requirement warning */}
        {gpsRequired && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <i className="fas fa-info-circle"></i>
            GPS location required - use camera to capture
          </p>
        )}
      </div>
    </>
  );
}
