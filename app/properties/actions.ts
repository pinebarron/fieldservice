'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function createProperty(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const propertyName = formData.get('propertyName') as string;
  const customerName = formData.get('customerName') as string;
  const locationName = formData.get('locationName') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;
  const notes = formData.get('notes') as string;

  if (!propertyName || !customerName || !locationName || !city || !state || !zipCode) {
    return { error: 'All required fields must be filled' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
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
    });

  if (error) {
    console.error('Error creating property:', error);
    return { error: error.message };
  }

  revalidatePath('/properties');
  return { success: true };
}

export async function deleteProperty(id: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/properties');
  return { success: true };
}
