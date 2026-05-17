import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PhotoAnnotation } from "@shared/schema";

type AnnotationTool = "arrow" | "circle" | "rectangle" | "text" | "freehand" | "select";

interface PhotoAnnotatorProps {
  imageUrl: string;
  initialAnnotations?: PhotoAnnotation[];
  onSave: (annotations: PhotoAnnotation[]) => void;
  onCancel: () => void;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#000000", "#ffffff"];
const STROKE_WIDTHS = [2, 4, 6, 8];

export function PhotoAnnotator({
  imageUrl,
  initialAnnotations = [],
  onSave,
  onCancel,
}: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<PhotoAnnotation[]>(initialAnnotations);
  const [currentTool, setCurrentTool] = useState<AnnotationTool>("arrow");
  const [currentColor, setCurrentColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw canvas when annotations change or image loads
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match image (scaled to fit container)
    const container = containerRef.current;
    if (!container) return;

    const maxWidth = container.clientWidth - 32;
    const maxHeight = window.innerHeight * 0.6;
    const scale = Math.min(maxWidth / imageDimensions.width, maxHeight / imageDimensions.height, 1);

    canvas.width = imageDimensions.width * scale;
    canvas.height = imageDimensions.height * scale;

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw all annotations
    annotations.forEach((annotation) => {
      drawAnnotation(ctx, annotation, scale);
    });
  }, [imageLoaded, imageDimensions, annotations]);

  const drawAnnotation = (
    ctx: CanvasRenderingContext2D,
    annotation: PhotoAnnotation,
    scale: number = 1
  ) => {
    ctx.strokeStyle = annotation.color;
    ctx.fillStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const coords = annotation.coordinates.map((c) => c * scale);

    switch (annotation.type) {
      case "arrow":
        drawArrow(ctx, coords[0], coords[1], coords[2], coords[3]);
        break;
      case "circle":
        const radius = Math.sqrt(
          Math.pow(coords[2] - coords[0], 2) + Math.pow(coords[3] - coords[1], 2)
        );
        ctx.beginPath();
        ctx.arc(coords[0], coords[1], radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case "rectangle":
        ctx.strokeRect(
          coords[0],
          coords[1],
          coords[2] - coords[0],
          coords[3] - coords[1]
        );
        break;
      case "text":
        ctx.font = `${(annotation.fontSize || 16) * scale}px sans-serif`;
        ctx.fillText(annotation.text || "", coords[0], coords[1]);
        break;
      case "freehand":
        if (coords.length < 4) return;
        ctx.beginPath();
        ctx.moveTo(coords[0], coords[1]);
        for (let i = 2; i < coords.length; i += 2) {
          ctx.lineTo(coords[i], coords[i + 1]);
        }
        ctx.stroke();
        break;
    }
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Convert canvas coordinates to image coordinates (for storage)
  const toImageCoords = (canvasCoords: number[]): number[] => {
    const canvas = canvasRef.current;
    if (!canvas) return canvasCoords;
    const scale = canvas.width / imageDimensions.width;
    return canvasCoords.map((c) => c / scale);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);

    if (currentTool === "text") {
      setTextPosition({ x, y });
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x, y });

    if (currentTool === "freehand") {
      setCurrentPath([x, y]);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();

    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imageRef.current) return;

    // Redraw image and existing annotations
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    const scale = canvas.width / imageDimensions.width;
    annotations.forEach((a) => drawAnnotation(ctx, a, scale));

    // Draw current shape preview
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.lineWidth = strokeWidth;

    if (currentTool === "freehand") {
      setCurrentPath((prev) => [...prev, x, y]);
      ctx.beginPath();
      ctx.moveTo(currentPath[0], currentPath[1]);
      for (let i = 2; i < currentPath.length; i += 2) {
        ctx.lineTo(currentPath[i], currentPath[i + 1]);
      }
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (startPoint) {
      switch (currentTool) {
        case "arrow":
          drawArrow(ctx, startPoint.x, startPoint.y, x, y);
          break;
        case "circle":
          const radius = Math.sqrt(
            Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
          );
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case "rectangle":
          ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
          break;
      }
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(false);

    if (!startPoint && currentTool !== "freehand") return;

    const id = `annotation-${Date.now()}`;
    let newAnnotation: PhotoAnnotation | null = null;

    if (currentTool === "freehand" && currentPath.length >= 4) {
      newAnnotation = {
        id,
        type: "freehand",
        coordinates: toImageCoords([...currentPath, x, y]),
        color: currentColor,
        strokeWidth,
      };
    } else if (startPoint) {
      // Only create if there's meaningful movement
      const distance = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );
      if (distance > 5) {
        newAnnotation = {
          id,
          type: currentTool as "arrow" | "circle" | "rectangle",
          coordinates: toImageCoords([startPoint.x, startPoint.y, x, y]),
          color: currentColor,
          strokeWidth,
        };
      }
    }

    if (newAnnotation) {
      setAnnotations((prev) => [...prev, newAnnotation!]);
    }

    setStartPoint(null);
    setCurrentPath([]);
  };

  const handleAddText = () => {
    if (!textPosition || !textInput.trim()) return;

    const newAnnotation: PhotoAnnotation = {
      id: `annotation-${Date.now()}`,
      type: "text",
      coordinates: toImageCoords([textPosition.x, textPosition.y]),
      color: currentColor,
      strokeWidth,
      text: textInput,
      fontSize: 16,
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setTextInput("");
    setTextPosition(null);
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAnnotations([]);
  };

  const tools: { id: AnnotationTool; icon: string; label: string }[] = [
    { id: "arrow", icon: "fa-arrow-right", label: "Arrow" },
    { id: "circle", icon: "fa-circle", label: "Circle" },
    { id: "rectangle", icon: "fa-square", label: "Rectangle" },
    { id: "text", icon: "fa-font", label: "Text" },
    { id: "freehand", icon: "fa-pencil-alt", label: "Freehand" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-muted/30">
        {/* Tool buttons */}
        <div className="flex gap-1">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              size="sm"
              variant={currentTool === tool.id ? "default" : "outline"}
              onClick={() => setCurrentTool(tool.id)}
              title={tool.label}
            >
              <i className={`fas ${tool.icon}`}></i>
            </Button>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="w-8 h-8 p-0">
              <div
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: currentColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 ${
                    currentColor === color ? "border-primary" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Stroke width */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              <div
                className="rounded-full bg-foreground"
                style={{ width: strokeWidth * 2, height: strokeWidth * 2 }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-2">
              {STROKE_WIDTHS.map((width) => (
                <button
                  key={width}
                  className={`w-8 h-8 rounded border flex items-center justify-center ${
                    strokeWidth === width ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onClick={() => setStrokeWidth(width)}
                >
                  <div
                    className="rounded-full bg-foreground"
                    style={{ width: width * 2, height: width * 2 }}
                  />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo / Clear */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleUndo}
          disabled={annotations.length === 0}
        >
          <i className="fas fa-undo mr-1"></i> Undo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          disabled={annotations.length === 0}
        >
          <i className="fas fa-trash mr-1"></i> Clear
        </Button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-black/5 flex items-center justify-center">
        {!imageLoaded ? (
          <div className="text-muted-foreground">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading image...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="border shadow-lg cursor-crosshair touch-none"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        )}
      </div>

      {/* Text input dialog */}
      {textPosition && (
        <div className="p-3 border-t bg-muted/30 flex gap-2">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddText();
              if (e.key === "Escape") setTextPosition(null);
            }}
          />
          <Button onClick={handleAddText}>Add</Button>
          <Button variant="outline" onClick={() => setTextPosition(null)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 p-3 border-t">
        <Button className="flex-1" onClick={() => onSave(annotations)}>
          <i className="fas fa-check mr-2"></i>
          Save Annotations
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Simple preview component for displaying annotated images
export function AnnotatedImagePreview({
  imageUrl,
  annotations,
  className = "",
}: {
  imageUrl: string;
  annotations: PhotoAnnotation[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Draw annotations at full scale
      annotations.forEach((annotation) => {
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const coords = annotation.coordinates;

        switch (annotation.type) {
          case "arrow":
            const headLength = 15;
            const angle = Math.atan2(coords[3] - coords[1], coords[2] - coords[0]);
            ctx.beginPath();
            ctx.moveTo(coords[0], coords[1]);
            ctx.lineTo(coords[2], coords[3]);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(coords[2], coords[3]);
            ctx.lineTo(
              coords[2] - headLength * Math.cos(angle - Math.PI / 6),
              coords[3] - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              coords[2] - headLength * Math.cos(angle + Math.PI / 6),
              coords[3] - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
            break;
          case "circle":
            const radius = Math.sqrt(
              Math.pow(coords[2] - coords[0], 2) + Math.pow(coords[3] - coords[1], 2)
            );
            ctx.beginPath();
            ctx.arc(coords[0], coords[1], radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
          case "rectangle":
            ctx.strokeRect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
            break;
          case "text":
            ctx.font = `${annotation.fontSize || 16}px sans-serif`;
            ctx.fillText(annotation.text || "", coords[0], coords[1]);
            break;
          case "freehand":
            if (coords.length < 4) return;
            ctx.beginPath();
            ctx.moveTo(coords[0], coords[1]);
            for (let i = 2; i < coords.length; i += 2) {
              ctx.lineTo(coords[i], coords[i + 1]);
            }
            ctx.stroke();
            break;
        }
      });

      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl, annotations]);

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full h-auto ${className}`}
      style={{ display: loaded ? "block" : "none" }}
    />
  );
}
