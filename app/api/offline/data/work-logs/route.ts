import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';

export async function GET(request: NextRequest) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('work_logs')
      .select('*')
      .eq('business_id', business.id)
      .order('service_date', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to camelCase for client
    const transformed = data?.map(log => ({
      id: log.id,
      businessId: log.business_id,
      propertyId: log.property_id,
      technicianUserId: log.technician_user_id,
      customerName: log.customer_name,
      workType: log.work_type,
      locationName: log.location_name,
      city: log.city,
      state: log.state,
      zipCode: log.zip_code,
      serviceDate: log.service_date,
      startTime: log.start_time,
      endTime: log.end_time,
      workPerformed: log.work_performed,
      additionalNotes: log.additional_notes,
      status: log.status,
      technicianUserIds: log.technician_user_ids,
      imageUrls: log.image_urls,
      photoMetadata: log.photo_metadata,
      scheduledStartTime: log.scheduled_start_time,
      scheduledEndTime: log.scheduled_end_time,
      createdAt: log.created_at,
      updatedAt: log.updated_at,
    })) || [];

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching work logs for offline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
