import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();

    const updates: Record<string, unknown> = {};

    // Only include fields that were provided
    const fields = [
      ['customerName', 'customer_name'],
      ['workType', 'work_type'],
      ['locationName', 'location_name'],
      ['city', 'city'],
      ['state', 'state'],
      ['zipCode', 'zip_code'],
      ['serviceDate', 'service_date'],
      ['workPerformed', 'work_performed'],
      ['status', 'status'],
      ['additionalNotes', 'additional_notes'],
    ];

    for (const [formKey, dbKey] of fields) {
      const value = formData.get(formKey);
      if (value !== null) {
        updates[dbKey] = value;
      }
    }

    const imagesJson = formData.get('imageUrls') as string;
    if (imagesJson) {
      try {
        updates.image_urls = JSON.parse(imagesJson);
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }

    const photoMetadataJson = formData.get('photoMetadata') as string;
    if (photoMetadataJson) {
      try {
        updates.photo_metadata = JSON.parse(photoMetadataJson);
      } catch (e) {
        console.error('Error parsing photo metadata:', e);
      }
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('work_logs')
      .update(updates)
      .eq('id', id)
      .eq('business_id', business.id);

    if (error) {
      console.error('Error updating work log from offline sync:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in offline work log update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
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
      console.error('Error deleting work log from offline sync:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in offline work log delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
