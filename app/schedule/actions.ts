'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function createWorkLog(formData: FormData) {
  const { user, business, userId } = await getUserAndBusiness();

  if (!user || !business || !userId) {
    return { error: 'Not authenticated' };
  }

  const customerName = formData.get('customerName') as string;
  const workType = formData.get('workType') as string;
  const locationName = formData.get('locationName') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;
  const serviceDate = formData.get('serviceDate') as string;
  const workPerformed = formData.get('workPerformed') as string;
  const status = formData.get('status') as string || 'scheduled';
  const notes = formData.get('notes') as string;
  const formTemplateId = formData.get('formTemplateId') as string;
  const formResponsesJson = formData.get('formResponses') as string;
  const imagesJson = formData.get('images') as string;
  const propertyId = formData.get('propertyId') as string;

  // Parse images - includes GPS data captured at shutter time
  let imageUrls: string[] = [];
  let photoMetadata: { url: string; type: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number }[] = [];
  if (imagesJson) {
    try {
      const images = JSON.parse(imagesJson);
      imageUrls = images.map((img: { url: string }) => img.url);
      photoMetadata = images;
    } catch (e) {
      console.error('Error parsing images:', e);
    }
  }

  if (!customerName || !workType || !locationName || !city || !state || !zipCode || !serviceDate || !workPerformed) {
    return { error: 'All required fields must be filled' };
  }

  const adminClient = createAdminClient();

  // Create the work log
  const { data: workLog, error } = await adminClient
    .from('work_logs')
    .insert({
      business_id: business.id,
      technician_user_id: userId,
      property_id: propertyId || null,
      customer_name: customerName,
      work_type: workType,
      location_name: locationName,
      city,
      state,
      zip_code: zipCode,
      service_date: serviceDate,
      work_performed: workPerformed,
      status,
      additional_notes: notes || null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      photo_metadata: photoMetadata.length > 0 ? photoMetadata : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating work log:', error);
    return { error: error.message };
  }

  // Save form submission if form was filled out
  if (formTemplateId && formResponsesJson && workLog) {
    try {
      const responses = JSON.parse(formResponsesJson);
      await adminClient
        .from('form_submissions')
        .insert({
          work_log_id: workLog.id,
          template_id: formTemplateId,
          responses,
        });
    } catch (e) {
      console.error('Error saving form submission:', e);
    }
  }

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateWorkLogStatus(id: string, status: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('work_logs')
    .update({ status })
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateWorkLog(id: string, formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const customerName = formData.get('customerName') as string;
  const workType = formData.get('workType') as string;
  const locationName = formData.get('locationName') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;
  const serviceDate = formData.get('serviceDate') as string;
  const workPerformed = formData.get('workPerformed') as string;
  const status = formData.get('status') as string || 'scheduled';
  const notes = formData.get('notes') as string;
  const imagesJson = formData.get('images') as string;

  // Parse images - includes GPS data captured at shutter time
  let imageUrls: string[] = [];
  let photoMetadata: { url: string; type: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number }[] = [];
  if (imagesJson) {
    try {
      const images = JSON.parse(imagesJson);
      imageUrls = images.map((img: { url: string }) => img.url);
      photoMetadata = images;
    } catch (e) {
      console.error('Error parsing images:', e);
    }
  }

  if (!customerName || !workType || !locationName || !city || !state || !zipCode || !serviceDate || !workPerformed) {
    return { error: 'All required fields must be filled' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('work_logs')
    .update({
      customer_name: customerName,
      work_type: workType,
      location_name: locationName,
      city,
      state,
      zip_code: zipCode,
      service_date: serviceDate,
      work_performed: workPerformed,
      status,
      additional_notes: notes || null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      photo_metadata: photoMetadata.length > 0 ? photoMetadata : null,
    })
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    console.error('Error updating work log:', error);
    return { error: error.message };
  }

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteWorkLog(id: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  // Delete form submissions first
  await adminClient
    .from('form_submissions')
    .delete()
    .eq('work_log_id', id);

  const { error } = await adminClient
    .from('work_logs')
    .delete()
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/schedule');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getFormTemplates() {
  const { business } = await getUserAndBusiness();

  if (!business) {
    return [];
  }

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('form_templates')
    .select('id, name, work_type, schema')
    .eq('business_id', business.id)
    .eq('is_active', 'true');

  return data || [];
}
