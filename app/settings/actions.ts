'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function updateBusinessInfo(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;
  const phone = formData.get('phone') as string;
  const brandColor = formData.get('brandColor') as string;

  if (!name) {
    return { error: 'Business name is required' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('businesses')
    .update({
      name,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      phone: phone || null,
      brand_color: brandColor || null,
    })
    .eq('id', business.id);

  if (error) {
    console.error('Error updating business:', error);
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateBusinessLogo(logoUrl: string | null) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('businesses')
    .update({ logo_url: logoUrl })
    .eq('id', business.id);

  if (error) {
    console.error('Error updating logo:', error);
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}
