import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, isOpen, onClose, onIndexChange }: ImageLightboxProps) {
  const previousImage = () => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    onIndexChange((currentIndex + 1) % images.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (images.length === 0) return null;

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

          {/* Navigation Buttons */}
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
          <div className="max-w-6xl max-h-full p-4">
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1} of ${images.length}`}
              className="max-w-full max-h-[85vh] object-contain"
              data-testid={`lightbox-image-${currentIndex}`}
            />
            <div className="text-center mt-4">
              <p className="text-white/80 text-sm" data-testid="lightbox-caption">
                Image {currentIndex + 1} of {images.length}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
