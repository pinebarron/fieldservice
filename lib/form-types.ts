// Form photo types for GPS-verified photo fields

// Photo field configuration for GPS-verified photos
export type PhotoFieldConfig = {
  gpsRequired?: boolean;           // Must capture with GPS
  verifyLocation?: boolean;        // Verify against job site
  verificationRadius?: number;     // Distance threshold in meters (default 100)
  minPhotos?: number;              // Minimum required (default 0)
  maxPhotos?: number;              // Maximum allowed (default 5)
  classification?: 'before' | 'after' | 'general';  // For reporting/comparison
};

// Document field configuration for file uploads
export type DocumentFieldConfig = {
  allowedTypes?: ('pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'image' | 'any')[];  // Allowed file types
  maxFileSize?: number;            // Max size in MB (default 10)
  minFiles?: number;               // Minimum required (default 0)
  maxFiles?: number;               // Maximum allowed (default 5)
};

// Document value - stored in form responses for document fields
export type FormDocumentValue = {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;                // Size in bytes
  uploadedAt: string;
};

// Form photo value - stored in form responses for photo fields
export type FormPhotoValue = {
  url: string;
  jobPhotoId?: string;           // Reference to job_photos record
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number;
  capturedAt: string;
  hasExif?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'mismatch';
  distanceFromJob?: number;
};

// Photo annotation type for markup
export type PhotoAnnotation = {
  id: string;
  type: 'arrow' | 'circle' | 'rectangle' | 'text' | 'freehand';
  coordinates: number[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
};

// Photo metadata type for GPS-tagged images
export type PhotoMeta = {
  url: string;
  type: 'before' | 'after' | 'general';
  lat?: number;
  lng?: number;
  address?: string;
  capturedAt: string;
  technicianName?: string;
  annotations?: PhotoAnnotation[];
};
