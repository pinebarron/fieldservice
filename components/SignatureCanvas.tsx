'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SignatureCanvasProps {
  value?: string; // base64 data URL
  onChange: (signature: string | null) => void;
  disabled?: boolean;
  label?: string;
}

export function SignatureCanvas({ value, onChange, disabled, label }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If there's an existing signature, draw it
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    } else {
      // Draw signature line
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, rect.height - 30);
      ctx.lineTo(rect.width - 20, rect.height - 30);
      ctx.stroke();

      // Reset stroke style for signature
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
    }
  }, [value]);

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);

    // Prevent scrolling on touch devices
    e.preventDefault();
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || disabled) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Prevent scrolling on touch devices
    e.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setHasSignature(true);

    // Save signature as base64
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    // Clear and redraw background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw signature line
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();

    // Reset stroke style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className={`relative border-2 rounded-lg overflow-hidden ${disabled ? 'opacity-50' : ''} ${hasSignature ? 'border-green-500' : 'border-gray-300'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-32 touch-none cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {hasSignature ? (
            <span className="text-green-600 flex items-center gap-1">
              <i className="fas fa-check-circle"></i> Signature captured
            </span>
          ) : (
            'Draw your signature above'
          )}
        </p>
        {hasSignature && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSignature}
            className="text-xs"
          >
            <i className="fas fa-eraser mr-1"></i>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
