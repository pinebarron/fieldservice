'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/app/schedule/upload-action';

export type PhotoType = 'before' | 'after' | 'general';

export interface UploadedImage {
  url: string;
  type: PhotoType;
  capturedAt: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<PhotoType>('general');

  const uploadFile = async (file: File, type: PhotoType) => {
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadImage(formData);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      url: result.url!,
      type,
      capturedAt: new Date().toISOString(),
    };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: PhotoType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const newImages: UploadedImage[] = [];

      for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const uploaded = await uploadFile(file, type);
        newImages.push(uploaded);
      }

      onChange([...images, ...newImages]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const updateImageType = (index: number, type: PhotoType) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], type };
    onChange(newImages);
  };

  const triggerUpload = (type: PhotoType) => {
    setPendingType(type);
    fileInputRef.current?.click();
  };

  const triggerCamera = (type: PhotoType) => {
    setPendingType(type);
    cameraInputRef.current?.click();
  };

  const beforeImages = images.filter(img => img.type === 'before');
  const afterImages = images.filter(img => img.type === 'after');
  const generalImages = images.filter(img => img.type === 'general');

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2 rounded bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, pendingType)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
          Uploading...
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {images.length} / {maxImages} photos
      </p>
    </div>
  );
}
