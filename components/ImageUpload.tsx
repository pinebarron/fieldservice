'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/app/schedule/upload-action';
import { GPSCamera, CapturedPhoto } from './GPSCamera';

export type PhotoType = 'before' | 'after' | 'general';

export interface UploadedImage {
  url: string;
  type: PhotoType;
  capturedAt: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number;
  hasExif?: boolean;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

// Compress image before upload
async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // If file is small enough, don't compress
    if (file.size < 500000) { // 500KB
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
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
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          quality
        );
      } else {
        resolve(file);
      }
    };

    img.onerror = () => resolve(file); // Fallback to original on error
    img.src = URL.createObjectURL(file);
  });
}

export function ImageUpload({ images, onChange, maxImages = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<PhotoType>('general');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPhotoType, setCameraPhotoType] = useState<PhotoType>('general');

  const uploadFile = async (file: File, type: PhotoType) => {
    try {
      // Compress image first
      setUploadProgress('Compressing...');
      const compressedFile = await compressImage(file);

      setUploadProgress('Uploading...');
      const formData = new FormData();
      formData.append('file', compressedFile);

      const result = await uploadImage(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.url) {
        throw new Error('No URL returned from upload');
      }

      return {
        url: result.url,
        type,
        capturedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: PhotoType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    setUploadProgress('');

    try {
      const newImages: UploadedImage[] = [];

      for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        setUploadProgress(`Processing ${i + 1}/${files.length}...`);
        const uploaded = await uploadFile(file, type);
        newImages.push(uploaded);
      }

      onChange([...images, ...newImages]);
      setUploadProgress('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('File upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const triggerUpload = (type: PhotoType) => {
    setPendingType(type);
    fileInputRef.current?.click();
  };

  const triggerCamera = (type: PhotoType) => {
    setCameraPhotoType(type);
    setShowCamera(true);
  };

  const handleCameraCapture = async (photo: CapturedPhoto) => {
    setShowCamera(false);
    setUploading(true);
    setError('');

    try {
      // Convert blob to file
      const file = new File([photo.blob], `photo-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Compress if needed
      setUploadProgress('Compressing...');
      const compressedFile = await compressImage(file);

      setUploadProgress('Uploading...');
      const formData = new FormData();
      formData.append('file', compressedFile);

      const result = await uploadImage(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.url) {
        throw new Error('No URL returned from upload');
      }

      const newImage: UploadedImage = {
        url: result.url,
        type: cameraPhotoType,
        capturedAt: photo.capturedAt,
        lat: photo.lat ?? undefined,
        lng: photo.lng ?? undefined,
        accuracy: photo.accuracy ?? undefined,
        altitude: photo.altitude ?? undefined,
        hasExif: photo.hasExif,
      };

      onChange([...images, newImage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Camera upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const beforeImages = images.filter(img => img.type === 'before');
  const afterImages = images.filter(img => img.type === 'after');
  const generalImages = images.filter(img => img.type === 'general');

  return (
    <>
      {showCamera && (
        <GPSCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      <div className="space-y-4">
      {error && (
        <div className="p-2 rounded bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Hidden file input for gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, pendingType)}
      />

      {/* Before Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            Before Photos
          </label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerCamera('before')}
              disabled={uploading || images.length >= maxImages}
            >
              <i className="fas fa-camera mr-1"></i>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerUpload('before')}
              disabled={uploading || images.length >= maxImages}
            >
              <i className="fas fa-upload mr-1"></i>
            </Button>
          </div>
        </div>
        {beforeImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {beforeImages.map((img, i) => {
              const originalIndex = images.findIndex(x => x === img);
              return (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt="Before"
                    className="w-full h-20 object-cover rounded border-2 border-orange-500"
                  />
                  {img.lat && img.lng && (
                    <div
                      className={`absolute bottom-1 left-1 w-5 h-5 ${img.hasExif ? 'bg-green-600' : 'bg-yellow-600'} text-white rounded-full flex items-center justify-center`}
                      title={`GPS: ${img.lat.toFixed(4)}, ${img.lng.toFixed(4)}${img.hasExif ? ' (EXIF embedded)' : ''}`}
                    >
                      <i className={`fas ${img.hasExif ? 'fa-check' : 'fa-map-marker-alt'} text-xs`}></i>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(originalIndex)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-orange-300 rounded p-3 text-center text-muted-foreground text-sm">
            No before photos
          </div>
        )}
      </div>

      {/* After Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            After Photos
          </label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerCamera('after')}
              disabled={uploading || images.length >= maxImages}
            >
              <i className="fas fa-camera mr-1"></i>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerUpload('after')}
              disabled={uploading || images.length >= maxImages}
            >
              <i className="fas fa-upload mr-1"></i>
            </Button>
          </div>
        </div>
        {afterImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {afterImages.map((img, i) => {
              const originalIndex = images.findIndex(x => x === img);
              return (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt="After"
                    className="w-full h-20 object-cover rounded border-2 border-green-500"
                  />
                  {img.lat && img.lng && (
                    <div
                      className={`absolute bottom-1 left-1 w-5 h-5 ${img.hasExif ? 'bg-green-600' : 'bg-yellow-600'} text-white rounded-full flex items-center justify-center`}
                      title={`GPS: ${img.lat.toFixed(4)}, ${img.lng.toFixed(4)}${img.hasExif ? ' (EXIF embedded)' : ''}`}
                    >
                      <i className={`fas ${img.hasExif ? 'fa-check' : 'fa-map-marker-alt'} text-xs`}></i>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(originalIndex)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-green-300 rounded p-3 text-center text-muted-foreground text-sm">
            No after photos
          </div>
        )}
      </div>

      {/* General Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Other Photos
          </label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerCamera('general')}
              disabled={uploading || images.length >= maxImages}
            >
              <i className="fas fa-camera mr-1"></i>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerUpload('general')}
              disabled={uploading || images.length >= maxImages}
            >
              <i className="fas fa-upload mr-1"></i>
            </Button>
          </div>
        </div>
        {generalImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {generalImages.map((img, i) => {
              const originalIndex = images.findIndex(x => x === img);
              return (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt="Photo"
                    className="w-full h-20 object-cover rounded border-2 border-blue-500"
                  />
                  {img.lat && img.lng && (
                    <div
                      className={`absolute bottom-1 left-1 w-5 h-5 ${img.hasExif ? 'bg-green-600' : 'bg-yellow-600'} text-white rounded-full flex items-center justify-center`}
                      title={`GPS: ${img.lat.toFixed(4)}, ${img.lng.toFixed(4)}${img.hasExif ? ' (EXIF embedded)' : ''}`}
                    >
                      <i className={`fas ${img.hasExif ? 'fa-check' : 'fa-map-marker-alt'} text-xs`}></i>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(originalIndex)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-blue-300 rounded p-3 text-center text-muted-foreground text-sm">
            No other photos
          </div>
        )}
      </div>

      {uploading && (
        <div className="text-center text-sm text-muted-foreground">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          {uploadProgress || 'Uploading...'}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {images.length} / {maxImages} photos
      </p>
    </div>
    </>
  );
}
