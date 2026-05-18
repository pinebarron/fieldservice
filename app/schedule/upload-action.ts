'use server';

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'field-uploads';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      return { error: 'No file provided' };
    }

    const supabase = getAdminClient();
    const objectId = randomUUID();
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `uploads/${objectId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { error: `Upload failed: ${error.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { error: error instanceof Error ? error.message : 'Upload failed' };
  }
}
