import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';

export async function GET() {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('properties')
      .select('*')
      .eq('business_id', business.id)
      .order('property_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to camelCase for client
    const transformed = data?.map(prop => ({
      id: prop.id,
      businessId: prop.business_id,
      propertyName: prop.property_name,
      customerName: prop.customer_name,
      locationName: prop.location_name,
      city: prop.city,
      state: prop.state,
      zipCode: prop.zip_code,
      status: prop.status,
      notes: prop.notes,
      createdAt: prop.created_at,
      updatedAt: prop.updated_at,
    })) || [];

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching properties for offline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
