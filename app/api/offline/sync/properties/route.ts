import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';

export async function POST(request: NextRequest) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();

    const propertyName = formData.get('propertyName') as string;
    const customerName = formData.get('customerName') as string;
    const locationName = formData.get('locationName') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;
    const notes = formData.get('notes') as string;

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('properties')
      .insert({
        business_id: business.id,
        property_name: propertyName,
        customer_name: customerName,
        location_name: locationName,
        city,
        state,
        zip_code: zipCode,
        notes: notes || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating property from offline sync:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, success: true });
  } catch (error) {
    console.error('Error in offline property sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
