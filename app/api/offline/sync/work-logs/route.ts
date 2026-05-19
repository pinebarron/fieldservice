import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';

export async function POST(request: NextRequest) {
  try {
    const { user, business, userId } = await getUserAndBusiness();

    if (!user || !business || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();

    const customerName = formData.get('customerName') as string;
    const workType = formData.get('workType') as string;
    const locationName = formData.get('locationName') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;
    const serviceDate = formData.get('serviceDate') as string;
    const workPerformed = formData.get('workPerformed') as string;
    const status = (formData.get('status') as string) || 'scheduled';
    const notes = formData.get('additionalNotes') as string;
    const propertyId = formData.get('propertyId') as string;
    const imagesJson = formData.get('imageUrls') as string;
    const photoMetadataJson = formData.get('photoMetadata') as string;

    let imageUrls: string[] = [];
    let photoMetadata: unknown[] = [];

    if (imagesJson) {
      try {
        imageUrls = JSON.parse(imagesJson);
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }

    if (photoMetadataJson) {
      try {
        photoMetadata = JSON.parse(photoMetadataJson);
      } catch (e) {
        console.error('Error parsing photo metadata:', e);
      }
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
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
      console.error('Error creating work log from offline sync:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, success: true });
  } catch (error) {
    console.error('Error in offline work log sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
