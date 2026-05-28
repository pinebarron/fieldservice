'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/geocoding';

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
  let propertyId = formData.get('propertyId') as string;
  const assignedTo = formData.get('assignedTo') as string;
  const saveAsProperty = formData.get('saveAsProperty') === 'true';

  // Parse images - includes GPS data captured at shutter time
  let imageUrls: string[] = [];
  let photoMetadata: { url: string; type: string; fieldLabel?: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number }[] = [];
  if (imagesJson) {
    try {
      const images = JSON.parse(imagesJson);
      imageUrls = images.map((img: { url: string }) => img.url);
      photoMetadata = images;
    } catch (e) {
      console.error('Error parsing images:', e);
    }
  }

  if (!customerName || !workType || !locationName || !city || !state || !zipCode || !serviceDate) {
    return { error: 'All required fields must be filled' };
  }

  const adminClient = createAdminClient();

  // Create property if requested
  if (saveAsProperty && !propertyId) {
    const { data: newProperty, error: propertyError } = await adminClient
      .from('properties')
      .insert({
        business_id: business.id,
        property_name: customerName,
        customer_name: customerName,
        location_name: locationName,
        city,
        state,
        zip_code: zipCode,
        is_active: true,
      })
      .select('id')
      .single();

    if (propertyError) {
      console.error('Error creating property:', propertyError);
      // Don't fail the whole operation, just log the error
    } else if (newProperty) {
      propertyId = newProperty.id;

      // Geocode the new property (non-blocking)
      geocodeAddress({ locationName, city, state, zipCode }).then(async (geoResult) => {
        if (geoResult) {
          await adminClient
            .from('properties')
            .update({
              lat: geoResult.lat,
              lng: geoResult.lng,
            })
            .eq('id', newProperty.id);
        }
      }).catch(console.error);
    }
  }

  // Create the work log
  // Use assignedTo if provided, otherwise default to current user
  const technicianUserId = assignedTo || userId;

  const { data: workLog, error } = await adminClient
    .from('work_logs')
    .insert({
      business_id: business.id,
      technician_user_id: technicianUserId,
      property_id: propertyId || null,
      customer_name: customerName,
      work_type: workType,
      location_name: locationName,
      city,
      state,
      zip_code: zipCode,
      service_date: serviceDate,
      work_performed: workPerformed || '',
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

  // Geocode the job location (non-blocking)
  geocodeAddress({
    locationName,
    city,
    state,
    zipCode,
  }).then(async (geoResult) => {
    if (geoResult && workLog) {
      await adminClient
        .from('work_logs')
        .update({
          job_lat: geoResult.lat,
          job_lng: geoResult.lng,
          geocoded_at: new Date().toISOString(),
          geocode_source: geoResult.source,
        })
        .eq('id', workLog.id);
    }
  }).catch((err) => {
    console.error('Geocoding failed:', err);
  });

  // Save form submission if form was filled out
  let formSubmissionId: string | null = null;
  if (formTemplateId && formResponsesJson && workLog) {
    try {
      const responses = JSON.parse(formResponsesJson);
      const { data: submission } = await adminClient
        .from('form_submissions')
        .insert({
          work_log_id: workLog.id,
          template_id: formTemplateId,
          responses,
        })
        .select('id')
        .single();

      formSubmissionId = submission?.id || null;
    } catch (e) {
      console.error('Error saving form submission:', e);
    }
  }

  // Save photos to job_photos table for GPS verification tracking
  if (photoMetadata.length > 0 && workLog) {
    try {
      // Get geocoded job location for verification
      const geoResult = await geocodeAddress({ locationName, city, state, zipCode });

      const jobPhotosToInsert = photoMetadata.map((photo: any) => {
        let verificationStatus = 'pending';
        let distanceFromJob: number | null = null;
        let locationVerified = false;

        // Calculate distance if we have both photo GPS and job location
        if (photo.lat && photo.lng && geoResult) {
          const R = 6371000; // Earth's radius in meters
          const dLat = (geoResult.lat - photo.lat) * Math.PI / 180;
          const dLng = (geoResult.lng - photo.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(photo.lat * Math.PI / 180) * Math.cos(geoResult.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceFromJob = R * c;

          // Auto-verify if within 100m
          if (distanceFromJob <= 100) {
            verificationStatus = 'verified';
            locationVerified = true;
          } else {
            verificationStatus = 'mismatch';
          }
        }

        return {
          business_id: business.id,
          work_log_id: workLog.id,
          form_submission_id: formSubmissionId,
          url: photo.url,
          photo_type: photo.type || 'general',
          lat: photo.lat || null,
          lng: photo.lng || null,
          accuracy_meters: photo.accuracy || null,
          altitude_meters: photo.altitude || null,
          job_lat: geoResult?.lat || null,
          job_lng: geoResult?.lng || null,
          distance_from_job_meters: distanceFromJob,
          location_verified: locationVerified,
          verification_status: verificationStatus,
          captured_at: photo.capturedAt || new Date().toISOString(),
          captured_by: userId,
          exif_data: photo.hasExif ? { embedded: true } : null,
        };
      });

      await adminClient.from('job_photos').insert(jobPhotosToInsert);
    } catch (e) {
      console.error('Error saving to job_photos:', e);
      // Non-critical - photos are still in photo_metadata
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
  const assignedTo = formData.get('assignedTo') as string;

  // Parse images - includes GPS data captured at shutter time
  let imageUrls: string[] = [];
  let photoMetadata: { url: string; type: string; fieldLabel?: string; capturedAt: string; lat?: number; lng?: number; accuracy?: number }[] = [];
  if (imagesJson) {
    try {
      const images = JSON.parse(imagesJson);
      imageUrls = images.map((img: { url: string }) => img.url);
      photoMetadata = images;
    } catch (e) {
      console.error('Error parsing images:', e);
    }
  }

  if (!customerName || !workType || !locationName || !city || !state || !zipCode || !serviceDate) {
    return { error: 'All required fields must be filled' };
  }

  const adminClient = createAdminClient();

  const updateData: Record<string, unknown> = {
    customer_name: customerName,
    work_type: workType,
    location_name: locationName,
    city,
    state,
    zip_code: zipCode,
    service_date: serviceDate,
    work_performed: workPerformed || '',
    status,
    additional_notes: notes || null,
    image_urls: imageUrls.length > 0 ? imageUrls : null,
    photo_metadata: photoMetadata.length > 0 ? photoMetadata : null,
  };

  // Update assignedTo if provided
  if (assignedTo) {
    updateData.technician_user_id = assignedTo;
  }

  const { error } = await adminClient
    .from('work_logs')
    .update(updateData)
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
