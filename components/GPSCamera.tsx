'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { embedExifData } from '@/lib/exif';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export interface CapturedPhoto {
  blob: Blob;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  altitude: number | null;
  capturedAt: string;
  hasExif: boolean;
}

interface GPSCameraProps {
  onCapture: (photo: CapturedPhoto) => void;
  onClose: () => void;
}

// Check if running on native platform
const isNative = Capacitor.isNativePlatform();

export function GPSCamera({ onCapture, onClose }: GPSCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'acquired' | 'denied' | 'unavailable'>('pending');
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number; accuracy: number; altitude: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Start GPS tracking
  useEffect(() => {
    let watchId: string | number | undefined;

    const startGpsTracking = async () => {
      if (isNative) {
        // Use Capacitor Geolocation for native
        try {
          const permission = await Geolocation.requestPermissions();
          if (permission.location === 'denied') {
            setGpsStatus('denied');
            return;
          }

          watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 },
            (position, err) => {
              if (err) {
                console.error('GPS error:', err);
                if (err.message?.includes('denied')) {
                  setGpsStatus('denied');
                }
                return;
              }
              if (position) {
                setCurrentPosition({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude,
                });
                setGpsStatus('acquired');
              }
            }
          );
        } catch (err) {
          console.error('Geolocation error:', err);
          setGpsStatus('unavailable');
        }
      } else {
        // Use web geolocation API
        if (!navigator.geolocation) {
          setGpsStatus('unavailable');
          return;
        }

        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentPosition({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
            });
            setGpsStatus('acquired');
          },
          (err) => {
            console.error('GPS error:', err.code, err.message);
            if (err.code === err.PERMISSION_DENIED) {
              setGpsStatus('denied');
            } else if (err.code === err.TIMEOUT) {
              console.log('GPS timeout, will keep trying...');
            } else {
              setGpsStatus('unavailable');
            }
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
        );
      }
    };

    startGpsTracking();

    return () => {
      if (watchId !== undefined) {
        if (isNative && typeof watchId === 'string') {
          Geolocation.clearWatch({ id: watchId });
        } else if (typeof watchId === 'number') {
          navigator.geolocation.clearWatch(watchId);
        }
      }
    };
  }, []);

  // Native camera capture
  const captureWithNativeCamera = async () => {
    setCapturing(true);
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
        saveToGallery: false,
      });

      if (!photo.base64String) {
        throw new Error('No photo data received');
      }

      // Convert base64 to blob
      const byteCharacters = atob(photo.base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      let blob = new Blob([byteArray], { type: `image/${photo.format || 'jpeg'}` });

      const captureTime = new Date();
      const capturedAt = captureTime.toISOString();
      const lat = currentPosition?.lat ?? null;
      const lng = currentPosition?.lng ?? null;
      const accuracy = currentPosition?.accuracy ?? null;
      const altitude = currentPosition?.altitude ?? null;

      // Embed EXIF data if GPS is available
      let hasExif = false;
      if (lat !== null && lng !== null) {
        try {
          blob = await embedExifData(blob, {
            gps: {
              lat,
              lng,
              altitude: altitude ?? undefined,
              accuracy: accuracy ?? undefined,
            },
            timestamp: captureTime,
            software: 'FieldService GPS Camera',
          });
          hasExif = true;
        } catch (exifError) {
          console.error('EXIF embedding failed:', exifError);
        }
      }

      onCapture({
        blob,
        lat,
        lng,
        accuracy,
        altitude,
        capturedAt,
        hasExif,
      });
    } catch (err) {
      console.error('Native capture error:', err);
      setError('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  // Start web camera
  const startCamera = useCallback(async () => {
    if (isNative) {
      // Native camera opens on demand, mark as ready
      setCameraReady(true);
      return;
    }

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please ensure camera permissions are granted.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Toggle camera facing mode (web only)
  const toggleCamera = async () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Capture photo (web)
  const capturePhoto = async () => {
    if (isNative) {
      await captureWithNativeCamera();
      return;
    }

    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    setCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      let blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create image blob'));
          },
          'image/jpeg',
          0.9
        );
      });

      // Capture GPS at this exact moment
      const captureTime = new Date();
      const capturedAt = captureTime.toISOString();
      const lat = currentPosition?.lat ?? null;
      const lng = currentPosition?.lng ?? null;
      const accuracy = currentPosition?.accuracy ?? null;
      const altitude = currentPosition?.altitude ?? null;

      // Embed EXIF data if GPS is available
      let hasExif = false;
      if (lat !== null && lng !== null) {
        try {
          blob = await embedExifData(blob, {
            gps: {
              lat,
              lng,
              altitude: altitude ?? undefined,
              accuracy: accuracy ?? undefined,
            },
            timestamp: captureTime,
            software: 'FieldService GPS Camera',
          });
          hasExif = true;
        } catch (exifError) {
          console.error('EXIF embedding failed:', exifError);
        }
      }

      onCapture({
        blob,
        lat,
        lng,
        accuracy,
        altitude,
        capturedAt,
        hasExif,
      });
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  // GPS status indicator
  const GpsIndicator = () => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Acquiring GPS...', animate: true },
      acquired: {
        color: 'bg-green-500',
        text: currentPosition
          ? `GPS ±${Math.round(currentPosition.accuracy)}m`
          : 'GPS Ready',
        animate: false
      },
      denied: { color: 'bg-red-500', text: 'GPS Denied', animate: false },
      unavailable: { color: 'bg-gray-500', text: 'GPS Unavailable', animate: false },
    };

    const config = statusConfig[gpsStatus];

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full">
        <div className={`w-2.5 h-2.5 rounded-full ${config.color} ${config.animate ? 'animate-pulse' : ''}`} />
        <span className="text-white text-sm font-medium">{config.text}</span>
      </div>
    );
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <div className="text-white text-center mb-4">
          <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
          <p>{error}</p>
        </div>
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>
    );
  }

  // Native platform: show simplified capture button
  if (isNative) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <GpsIndicator />
            </div>
            <button
              onClick={capturePhoto}
              disabled={capturing}
              className={`
                w-24 h-24 rounded-full border-4 border-white
                flex items-center justify-center mx-auto
                transition-all duration-150
                ${capturing ? 'bg-white/50' : 'bg-white/20 hover:bg-white/30 active:scale-95'}
                disabled:opacity-50
              `}
            >
              <div className={`w-20 h-20 rounded-full bg-white ${capturing ? 'scale-90' : ''} transition-transform flex items-center justify-center`}>
                <i className="fas fa-camera text-3xl text-gray-800"></i>
              </div>
            </button>
            <p className="text-white mt-6">Tap to open camera</p>
          </div>
        </div>

        <div className="bg-black/90 p-4 pb-8 safe-area-inset-bottom flex justify-center">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
        </div>

        {gpsStatus !== 'acquired' && (
          <div className="absolute bottom-24 left-0 right-0 text-center">
            <p className="text-yellow-400 text-xs">
              {gpsStatus === 'pending' && 'Waiting for GPS signal...'}
              {gpsStatus === 'denied' && 'Location access denied. Photo will not have GPS data.'}
              {gpsStatus === 'unavailable' && 'GPS not available. Photo will not have GPS data.'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Web platform: show video preview
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera preview */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Top overlay with GPS status */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
          <GpsIndicator />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white bg-black/40 hover:bg-black/60 rounded-full"
          >
            <i className="fas fa-times text-xl"></i>
          </Button>
        </div>

        {/* Camera loading overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-white text-center">
              <i className="fas fa-spinner fa-spin text-3xl mb-2"></i>
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/90 p-4 pb-8 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-8">
          {/* Switch camera button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            disabled={!cameraReady || capturing}
            className="text-white bg-white/20 hover:bg-white/30 rounded-full w-12 h-12"
          >
            <i className="fas fa-sync-alt text-lg"></i>
          </Button>

          {/* Shutter button */}
          <button
            onClick={capturePhoto}
            disabled={!cameraReady || capturing}
            className={`
              w-20 h-20 rounded-full border-4 border-white
              flex items-center justify-center
              transition-all duration-150
              ${capturing ? 'bg-white/50' : 'bg-white/20 hover:bg-white/30 active:scale-95'}
              disabled:opacity-50
            `}
          >
            <div className={`w-16 h-16 rounded-full bg-white ${capturing ? 'scale-90' : ''} transition-transform`} />
          </button>

          {/* Placeholder for symmetry */}
          <div className="w-12 h-12" />
        </div>

        {/* GPS warning if not acquired */}
        {gpsStatus !== 'acquired' && (
          <p className="text-yellow-400 text-xs text-center mt-3">
            {gpsStatus === 'pending' && 'Waiting for GPS signal...'}
            {gpsStatus === 'denied' && 'Location access denied. Photo will not have GPS data.'}
            {gpsStatus === 'unavailable' && 'GPS not available. Photo will not have GPS data.'}
          </p>
        )}
      </div>
    </div>
  );
}
