import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PhotoMeta } from "@shared/schema";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  metadata?: PhotoMeta[];
}

const PHOTO_TYPE_CONFIG = {
  before: { label: "Before", className: "bg-amber-500/80 text-white", icon: "fas fa-hourglass-start" },
  after:  { label: "After",  className: "bg-green-500/80 text-white",  icon: "fas fa-check-circle" },
  general:{ label: "Photo",  className: "bg-blue-500/80 text-white",   icon: "fas fa-camera" },
};

export function ImageLightbox({ images, currentIndex, isOpen, onClose, onIndexChange, metadata }: ImageLightboxProps) {
  const previousImage = () => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    onIndexChange((currentIndex + 1) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); previousImage(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nextImage(); }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (images.length === 0) return null;

  const currentMeta = metadata?.[currentIndex];
  const typeConfig = currentMeta ? PHOTO_TYPE_CONFIG[currentMeta.type] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none max-h-none w-screen h-screen bg-black/95 border-none p-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white z-10 rounded-full"
            data-testid="lightbox-close"
          >
            <i className="fas fa-times text-xl"></i>
          </Button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={previousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white z-10 rounded-full"
                data-testid="lightbox-previous"
              >
                <i className="fas fa-chevron-left"></i>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white z-10 rounded-full"
                data-testid="lightbox-next"
              >
                <i className="fas fa-chevron-right"></i>
              </Button>
            </>
          )}

          {/* Image */}
          <div className="max-w-6xl max-h-full p-4 pb-24 flex flex-col items-center">
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1} of ${images.length}`}
              className="max-w-full max-h-[75vh] object-contain"
              data-testid={`lightbox-image-${currentIndex}`}
            />

            {/* Metadata Overlay */}
            {currentMeta ? (
              <div className="mt-4 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 max-w-2xl w-full" data-testid="lightbox-metadata">
                {typeConfig && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${typeConfig.className}`}>
                    <i className={typeConfig.icon}></i> {typeConfig.label}
                  </span>
                )}
                {currentMeta.capturedAt && (
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <i className="fas fa-clock text-white/50"></i>
                    {new Date(currentMeta.capturedAt).toLocaleString()}
                  </span>
                )}
                {currentMeta.lat !== undefined && currentMeta.lng !== undefined && (
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-white/50"></i>
                    {currentMeta.lat.toFixed(5)}, {currentMeta.lng.toFixed(5)}
                  </span>
                )}
                {currentMeta.address && (
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <i className="fas fa-building text-white/50"></i>
                    {currentMeta.address}
                  </span>
                )}
                {currentMeta.technicianName && (
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <i className="fas fa-user-hard-hat text-white/50"></i>
                    {currentMeta.technicianName}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center mt-3">
                <p className="text-white/60 text-sm" data-testid="lightbox-caption">
                  Image {currentIndex + 1} of {images.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
