'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/app/schedule/upload-action';
import type { FormDocumentValue, DocumentFieldConfig } from '@/lib/form-types';

interface FormFieldDefinition {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  documentConfig?: DocumentFieldConfig;
}

interface FormDocumentFieldProps {
  field: FormFieldDefinition;
  value: FormDocumentValue[];
  onChange: (documents: FormDocumentValue[]) => void;
  disabled?: boolean;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': 'fa-file-pdf',
  'application/msword': 'fa-file-word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
  'application/vnd.ms-excel': 'fa-file-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fa-file-excel',
  'image/jpeg': 'fa-file-image',
  'image/png': 'fa-file-image',
  'image/gif': 'fa-file-image',
  'image/webp': 'fa-file-image',
};

const FILE_TYPE_COLORS: Record<string, string> = {
  'application/pdf': 'text-red-500',
  'application/msword': 'text-blue-500',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text-blue-500',
  'application/vnd.ms-excel': 'text-green-500',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'text-green-500',
  'image/jpeg': 'text-purple-500',
  'image/png': 'text-purple-500',
  'image/gif': 'text-purple-500',
  'image/webp': 'text-purple-500',
};

function getFileIcon(mimeType: string): string {
  return FILE_TYPE_ICONS[mimeType] || 'fa-file';
}

function getFileColor(mimeType: string): string {
  return FILE_TYPE_COLORS[mimeType] || 'text-gray-500';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAcceptedTypes(allowedTypes?: ('pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'image' | 'any')[]): string {
  if (!allowedTypes || allowedTypes.includes('any')) return '*/*';

  const mimeTypes: string[] = [];

  if (allowedTypes.includes('pdf')) mimeTypes.push('application/pdf');
  if (allowedTypes.includes('doc')) mimeTypes.push('application/msword');
  if (allowedTypes.includes('docx')) mimeTypes.push('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  if (allowedTypes.includes('xls')) mimeTypes.push('application/vnd.ms-excel');
  if (allowedTypes.includes('xlsx')) mimeTypes.push('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  if (allowedTypes.includes('image')) mimeTypes.push('image/*');

  return mimeTypes.join(',');
}

export function FormDocumentField({ field, value, onChange, disabled = false }: FormDocumentFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = field.documentConfig || {};
  const maxFiles = config.maxFiles ?? 5;
  const minFiles = config.minFiles ?? 0;
  const maxFileSize = (config.maxFileSize ?? 10) * 1024 * 1024; // Convert MB to bytes
  const allowedTypes = config.allowedTypes ?? ['any'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const newDocuments: FormDocumentValue[] = [];

      for (let i = 0; i < files.length && value.length + newDocuments.length < maxFiles; i++) {
        const file = files[i];

        // Check file size
        if (file.size > maxFileSize) {
          setError(`File "${file.name}" exceeds max size of ${config.maxFileSize ?? 10}MB`);
          continue;
        }

        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadImage(formData);
        if (result.error) throw new Error(result.error);
        if (!result.url) throw new Error('No URL returned');

        newDocuments.push({
          url: result.url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      onChange([...value, ...newDocuments]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDocument = (index: number) => {
    const newDocuments = [...value];
    newDocuments.splice(index, 1);
    onChange(newDocuments);
  };

  const canAddMore = value.length < maxFiles;
  const hasMinFiles = value.length >= minFiles;

  return (
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
        accept={getAcceptedTypes(allowedTypes)}
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || !canAddMore}
      />

      {/* Document list */}
      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((doc, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30 group"
            >
              <div className={`w-8 h-8 flex items-center justify-center ${getFileColor(doc.fileType)}`}>
                <i className={`fas ${getFileIcon(doc.fileType)} text-lg`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.fileSize)}
                </p>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                <i className="fas fa-external-link-alt"></i>
              </a>
              <button
                type="button"
                onClick={() => removeDocument(index)}
                disabled={disabled}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/30 rounded p-4 text-center text-muted-foreground text-sm">
          <i className="fas fa-file-upload text-lg mb-1 block"></i>
          No documents uploaded
        </div>
      )}

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading || !canAddMore}
        className="w-full"
      >
        <i className="fas fa-upload mr-2"></i>
        {uploading ? uploadProgress || 'Uploading...' : 'Upload Document'}
      </Button>

      {/* Document count and requirements */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {value.length} / {maxFiles} documents
          {minFiles > 0 && !hasMinFiles && (
            <span className="text-destructive ml-2">
              (min {minFiles} required)
            </span>
          )}
        </span>
        <span>Max {config.maxFileSize ?? 10}MB per file</span>
      </div>

      {/* Allowed types hint */}
      {!allowedTypes.includes('any') && (
        <p className="text-xs text-muted-foreground">
          <i className="fas fa-info-circle mr-1"></i>
          Accepted: {allowedTypes.map(t => t.toUpperCase()).join(', ')}
        </p>
      )}
    </div>
  );
}
