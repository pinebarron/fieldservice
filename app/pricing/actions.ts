'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function createPricingItem(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const unit = formData.get('unit') as string;
  const unitPrice = formData.get('unitPrice') as string;

  if (!name || !unitPrice) {
    return { error: 'Name and price are required' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('pricing_items')
    .insert({
      business_id: business.id,
      name,
      category: category || 'General',
      description: description || null,
      unit: unit || 'each',
      unit_price: unitPrice,
      is_active: 'true',
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/pricing');
  return { success: true };
}

export async function deletePricingItem(id: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('pricing_items')
    .delete()
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/pricing');
  return { success: true };
}
