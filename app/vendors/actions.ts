'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/geocoding';

export async function createVendor(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const vendorKey = formData.get('vendorKey') as string;
  const name = formData.get('name') as string;
  const contactName = formData.get('contactName') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const contactPhone = formData.get('contactPhone') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;

  if (!name) {
    return { error: 'Vendor name is required' };
  }

  const adminClient = createAdminClient();

  // Check for duplicate vendor key
  if (vendorKey) {
    const { data: existing } = await adminClient
      .from('vendors')
      .select('id')
      .eq('business_id', business.id)
      .eq('vendor_key', vendorKey)
      .single();

    if (existing) {
      return { error: 'A vendor with this key already exists' };
    }
  }

  const { data: vendor, error } = await adminClient
    .from('vendors')
    .insert({
      business_id: business.id,
      vendor_key: vendorKey || null,
      name,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Geocode the vendor location (non-blocking)
  if (city && state) {
    geocodeAddress({ city, state, zipCode }).then(async (geoResult) => {
      if (geoResult && vendor) {
        await adminClient
          .from('vendors')
          .update({
            lat: geoResult.lat.toString(),
            lng: geoResult.lng.toString(),
          })
          .eq('id', vendor.id);
      }
    }).catch(console.error);
  }

  revalidatePath('/vendors');
  return { success: true };
}

export async function updateVendor(id: string, formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const vendorKey = formData.get('vendorKey') as string;
  const name = formData.get('name') as string;
  const contactName = formData.get('contactName') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const contactPhone = formData.get('contactPhone') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;

  if (!name) {
    return { error: 'Vendor name is required' };
  }

  const adminClient = createAdminClient();

  // Check for duplicate vendor key (excluding current vendor)
  if (vendorKey) {
    const { data: existing } = await adminClient
      .from('vendors')
      .select('id')
      .eq('business_id', business.id)
      .eq('vendor_key', vendorKey)
      .neq('id', id)
      .single();

    if (existing) {
      return { error: 'A vendor with this key already exists' };
    }
  }

  // Get current vendor to check if location changed
  const { data: currentVendor } = await adminClient
    .from('vendors')
    .select('city, state, zip_code')
    .eq('id', id)
    .single();

  const locationChanged = currentVendor && (
    currentVendor.city !== city ||
    currentVendor.state !== state ||
    currentVendor.zip_code !== zipCode
  );

  const updateData: Record<string, unknown> = {
    vendor_key: vendorKey || null,
    name,
    contact_name: contactName || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    city: city || null,
    state: state || null,
    zip_code: zipCode || null,
  };

  // Clear GPS if location changed - will be re-geocoded
  if (locationChanged) {
    updateData.lat = null;
    updateData.lng = null;
  }

  const { error } = await adminClient
    .from('vendors')
    .update(updateData)
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  // Re-geocode if location changed (non-blocking)
  if (locationChanged && city && state) {
    geocodeAddress({ city, state, zipCode }).then(async (geoResult) => {
      if (geoResult) {
        await adminClient
          .from('vendors')
          .update({
            lat: geoResult.lat.toString(),
            lng: geoResult.lng.toString(),
          })
          .eq('id', id);
      }
    }).catch(console.error);
  }

  revalidatePath('/vendors');
  return { success: true };
}

export async function deleteVendor(id: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('vendors')
    .delete()
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/vendors');
  return { success: true };
}
