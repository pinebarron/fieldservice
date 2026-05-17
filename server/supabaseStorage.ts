import { createClient } from '@supabase/supabase-js';
import type { Response } from 'express';
import { randomUUID } from 'crypto';

// Create Supabase client with service role key for storage operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'field-uploads';

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
  }
}

export class ObjectStorageService {
  /**
   * Get a signed upload URL for direct browser-to-storage uploads
   * Returns a URL that accepts PUT requests with the file content
   */
  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const filePath = `uploads/${objectId}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Failed to create upload URL:', error);
      throw new Error(`Failed to create upload URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get file from storage by path
   */
  async getObjectEntityFile(objectPath: string): Promise<{ data: Blob; contentType: string } | null> {
    // Normalize the path - remove leading /objects/ if present
    const normalizedPath = objectPath.replace(/^\/objects\//, '').replace(/^objects\//, '');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(normalizedPath);

    if (error) {
      console.error('Failed to download file:', error);
      return null;
    }

    return {
      data,
      contentType: data.type || 'application/octet-stream',
    };
  }

  /**
   * Download file and stream to HTTP response
   */
  async downloadObject(objectPath: string, res: Response): Promise<void> {
    const file = await this.getObjectEntityFile(objectPath);

    if (!file) {
      throw new ObjectNotFoundError();
    }

    const buffer = Buffer.from(await file.data.arrayBuffer());

    res.set({
      'Content-Type': file.contentType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    });

    res.send(buffer);
  }

  /**
   * Get public URL for an object (if bucket is public)
   */
  getPublicUrl(objectPath: string): string {
    const normalizedPath = objectPath.replace(/^\/objects\//, '').replace(/^objects\//, '');

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(normalizedPath);

    return data.publicUrl;
  }

  /**
   * Normalize an object path from various formats to a consistent /objects/... format
   * Handles:
   * - Full Supabase storage URLs
   * - Signed URLs
   * - Already-normalized paths
   */
  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a normalized path, return as-is
    if (rawPath.startsWith('/objects/')) {
      return rawPath;
    }

    // Handle Supabase storage URLs
    const supabaseUrl = process.env.SUPABASE_URL!;
    if (rawPath.includes(supabaseUrl) || rawPath.includes('supabase.co/storage')) {
      try {
        const url = new URL(rawPath);
        const pathParts = url.pathname.split('/storage/v1/object/');

        if (pathParts.length > 1) {
          // Format: /storage/v1/object/public/bucket/path or /storage/v1/object/sign/bucket/path
          const afterObject = pathParts[1];
          // Remove public/ or sign/ prefix and bucket name
          const parts = afterObject.split('/');
          // parts[0] is 'public' or 'sign', parts[1] is bucket name, rest is path
          if (parts.length >= 3) {
            const objectPath = parts.slice(2).join('/');
            return `/objects/${objectPath}`;
          }
        }

        // Fallback: try to extract path after bucket name
        const bucketIndex = url.pathname.indexOf(BUCKET_NAME);
        if (bucketIndex !== -1) {
          const pathAfterBucket = url.pathname.substring(bucketIndex + BUCKET_NAME.length + 1);
          return `/objects/${pathAfterBucket}`;
        }
      } catch {
        // URL parsing failed, continue with fallback
      }
    }

    // If it's a path without /objects/ prefix, add it
    if (!rawPath.startsWith('/')) {
      return `/objects/${rawPath}`;
    }

    return rawPath;
  }

  /**
   * Delete an object from storage
   */
  async deleteObject(objectPath: string): Promise<boolean> {
    const normalizedPath = objectPath.replace(/^\/objects\//, '').replace(/^objects\//, '');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([normalizedPath]);

    if (error) {
      console.error('Failed to delete object:', error);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const objectStorageService = new ObjectStorageService();
