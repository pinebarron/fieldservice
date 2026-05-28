'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function checkIn(jobId: string, lat: number | null, lng: number | null) {
  const { user, business, userId, role } = await getUserAndBusiness();

  if (!user || !business || !userId) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  // Verify the job exists and belongs to this business
  const { data: job } = await adminClient
    .from('work_logs')
    .select('*')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  // Check if tech is assigned to this job (or if they're owner/admin)
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isAssigned = job.technician_user_id === userId;

  if (!isOwnerOrAdmin && !isAssigned) {
    return { error: 'You are not assigned to this job' };
  }

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: 'in-progress',
    check_in_time: now,
    start_time: now.split('T')[1].substring(0, 5), // HH:mm format
  };

  // Only add location if available
  if (lat !== null && lng !== null) {
    updateData.check_in_lat = lat.toString();
    updateData.check_in_lng = lng.toString();
  }

  const { error } = await adminClient
    .from('work_logs')
    .update(updateData)
    .eq('id', jobId)
    .eq('business_id', business.id);

  if (error) {
    console.error('Check-in error:', error);
    return { error: error.message };
  }

  revalidatePath('/tech');
  revalidatePath(`/tech/job/${jobId}`);
  revalidatePath('/schedule');
  return { success: true };
}

export async function checkOut(jobId: string, lat: number | null, lng: number | null) {
  const { user, business, userId, role } = await getUserAndBusiness();

  if (!user || !business || !userId) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  // Verify the job exists and belongs to this business
  const { data: job } = await adminClient
    .from('work_logs')
    .select('*')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  // Check if tech is assigned to this job (or if they're owner/admin)
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isAssigned = job.technician_user_id === userId;

  if (!isOwnerOrAdmin && !isAssigned) {
    return { error: 'You are not assigned to this job' };
  }

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    status: 'completed',
    check_out_time: now,
    end_time: now.split('T')[1].substring(0, 5), // HH:mm format
  };

  // Only add location if available
  if (lat !== null && lng !== null) {
    updateData.check_out_lat = lat.toString();
    updateData.check_out_lng = lng.toString();
  }

  const { error } = await adminClient
    .from('work_logs')
    .update(updateData)
    .eq('id', jobId)
    .eq('business_id', business.id);

  if (error) {
    console.error('Check-out error:', error);
    return { error: error.message };
  }

  revalidatePath('/tech');
  revalidatePath(`/tech/job/${jobId}`);
  revalidatePath('/schedule');
  return { success: true };
}

export async function updateJobNotes(jobId: string, workPerformed: string, notes: string) {
  const { user, business, userId, role } = await getUserAndBusiness();

  if (!user || !business || !userId) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  // Verify the job exists and belongs to this business
  const { data: job } = await adminClient
    .from('work_logs')
    .select('*')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  // Check if tech is assigned to this job (or if they're owner/admin)
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isAssigned = job.technician_user_id === userId;

  if (!isOwnerOrAdmin && !isAssigned) {
    return { error: 'You are not assigned to this job' };
  }

  const { error } = await adminClient
    .from('work_logs')
    .update({
      work_performed: workPerformed,
      additional_notes: notes || null,
    })
    .eq('id', jobId)
    .eq('business_id', business.id);

  if (error) {
    console.error('Update notes error:', error);
    return { error: error.message };
  }

  revalidatePath('/tech');
  revalidatePath(`/tech/job/${jobId}`);
  revalidatePath('/schedule');
  return { success: true };
}

export async function saveFormSubmission(
  jobId: string,
  templateId: string,
  responses: Record<string, unknown>,
  existingSubmissionId?: string
) {
  const { user, business, userId, role } = await getUserAndBusiness();

  if (!user || !business || !userId) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  // Verify the job exists and belongs to this business
  const { data: job } = await adminClient
    .from('work_logs')
    .select('*')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .single();

  if (!job) {
    return { error: 'Job not found' };
  }

  // Check if tech is assigned to this job (or if they're owner/admin)
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isAssigned = job.technician_user_id === userId;

  if (!isOwnerOrAdmin && !isAssigned) {
    return { error: 'You are not assigned to this job' };
  }

  // Get the form template to identify photo fields
  const { data: formTemplate } = await adminClient
    .from('form_templates')
    .select('schema')
    .eq('id', templateId)
    .single();

  // Extract photos from responses and build photo_metadata
  const allPhotos: { url: string; type: string; fieldLabel: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number }[] = [];

  if (formTemplate?.schema?.fields) {
    const photoFields = formTemplate.schema.fields.filter((f: any) => f.type === 'photo');

    for (const field of photoFields) {
      const photos = responses[field.id] as { url: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number }[] | undefined;
      if (photos && Array.isArray(photos)) {
        const photoType = field.photoConfig?.classification || 'general';
        allPhotos.push(...photos.map(p => ({
          url: p.url,
          type: photoType,
          fieldLabel: field.label,
          capturedAt: p.capturedAt,
          lat: p.lat,
          lng: p.lng,
          accuracy: p.accuracy,
        })));
      }
    }
  }

  if (existingSubmissionId) {
    // Update existing submission
    const { error } = await adminClient
      .from('form_submissions')
      .update({
        responses,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', existingSubmissionId);

    if (error) {
      console.error('Update form submission error:', error);
      return { error: error.message };
    }
  } else {
    // Create new submission
    const { error } = await adminClient
      .from('form_submissions')
      .insert({
        work_log_id: jobId,
        template_id: templateId,
        responses,
        submitted_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Create form submission error:', error);
      return { error: error.message };
    }
  }

  // Update work_log photo metadata if there are photos
  if (allPhotos.length > 0) {
    const imageUrls = allPhotos.map(p => p.url);

    const { error: photoError } = await adminClient
      .from('work_logs')
      .update({
        image_urls: imageUrls,
        photo_metadata: allPhotos,
      })
      .eq('id', jobId);

    if (photoError) {
      console.error('Update photo metadata error:', photoError);
      // Don't fail the whole operation for this
    }
  }

  revalidatePath('/tech');
  revalidatePath(`/tech/job/${jobId}`);
  revalidatePath('/schedule');
  return { success: true };
}
