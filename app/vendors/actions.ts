'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function createVendor(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const contactName = formData.get('contactName') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const contactPhone = formData.get('contactPhone') as string;
  const notes = formData.get('notes') as string;

  if (!name) {
    return { error: 'Vendor name is required' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('vendors')
    .insert({
      business_id: business.id,
      name,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      notes: notes || null,
      status: 'active',
    });

  if (error) {
    return { error: error.message };
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
