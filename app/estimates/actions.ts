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

  const { data, error } = await adminClient
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
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating estimate:', error);
    return { error: error.message };
  }

  revalidatePath('/estimates');
  return { success: true, id: data.id };
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

  // Delete line items first
  await adminClient
    .from('estimate_line_items')
    .delete()
    .eq('estimate_id', id);

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

export async function getEstimateWithLineItems(id: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { data: estimate, error } = await adminClient
    .from('estimates')
    .select('*')
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (error || !estimate) {
    return { error: error?.message || 'Estimate not found' };
  }

  const { data: lineItems } = await adminClient
    .from('estimate_line_items')
    .select('*')
    .eq('estimate_id', id)
    .order('sort_order');

  return { estimate, lineItems: lineItems || [] };
}

export async function updateEstimate(id: string, data: {
  title?: string;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  description?: string | null;
  status?: string;
  validUntil?: string | null;
  notes?: string | null;
  taxRate?: string;
  discountAmount?: string;
  lineItems?: Array<{
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    sortOrder: string;
  }>;
}) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  // Update estimate
  const { lineItems, ...estimateData } = data;

  const updatePayload: Record<string, unknown> = {};
  if (estimateData.title !== undefined) updatePayload.title = estimateData.title;
  if (estimateData.customerName !== undefined) updatePayload.customer_name = estimateData.customerName;
  if (estimateData.customerEmail !== undefined) updatePayload.customer_email = estimateData.customerEmail;
  if (estimateData.customerPhone !== undefined) updatePayload.customer_phone = estimateData.customerPhone;
  if (estimateData.description !== undefined) updatePayload.description = estimateData.description;
  if (estimateData.status !== undefined) updatePayload.status = estimateData.status;
  if (estimateData.validUntil !== undefined) updatePayload.valid_until = estimateData.validUntil;
  if (estimateData.notes !== undefined) updatePayload.notes = estimateData.notes;
  if (estimateData.taxRate !== undefined) updatePayload.tax_rate = estimateData.taxRate;
  if (estimateData.discountAmount !== undefined) updatePayload.discount_amount = estimateData.discountAmount;

  const { error: updateError } = await adminClient
    .from('estimates')
    .update(updatePayload)
    .eq('id', id)
    .eq('business_id', business.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Update line items if provided
  if (lineItems !== undefined) {
    // Delete existing line items
    await adminClient
      .from('estimate_line_items')
      .delete()
      .eq('estimate_id', id);

    // Insert new line items
    if (lineItems.length > 0) {
      const { error: lineItemsError } = await adminClient
        .from('estimate_line_items')
        .insert(lineItems.map((item, index) => ({
          estimate_id: id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          sort_order: String(index),
        })));

      if (lineItemsError) {
        return { error: lineItemsError.message };
      }
    }
  }

  revalidatePath('/estimates');
  revalidatePath(`/estimates/${id}`);
  return { success: true };
}

export async function getPricingItems() {
  const { business } = await getUserAndBusiness();

  if (!business) {
    return [];
  }

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('pricing_items')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', 'true')
    .order('category', { ascending: true });

  return data || [];
}
