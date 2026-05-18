'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function createEstimate(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const title = formData.get('title') as string;
  const customerName = formData.get('customerName') as string;
  const customerEmail = formData.get('customerEmail') as string;
  const customerPhone = formData.get('customerPhone') as string;
  const description = formData.get('description') as string;
  const validUntil = formData.get('validUntil') as string;
  const notes = formData.get('notes') as string;

  if (!title || !customerName) {
    return { error: 'Title and customer name are required' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('estimates')
    .insert({
      business_id: business.id,
      title,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      description: description || null,
      valid_until: validUntil || null,
      notes: notes || null,
      status: 'draft',
      tax_rate: '0',
      discount_amount: '0',
    });

  if (error) {
    console.error('Error creating estimate:', error);
    return { error: error.message };
  }

  revalidatePath('/estimates');
  return { success: true };
}

export async function updateEstimateStatus(id: string, status: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('estimates')
    .update({ status })
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/estimates');
  return { success: true };
}

export async function deleteEstimate(id: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('estimates')
    .delete()
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/estimates');
  return { success: true };
}
