'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export type FormFieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'time'
  | 'select' | 'multiselect' | 'checkbox' | 'radio'
  | 'photo' | 'signature' | 'gps';

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
};

export type FormSchema = {
  fields: FormField[];
};

export async function createFormTemplate(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const workType = formData.get('workType') as string;
  const fieldsJson = formData.get('fields') as string;

  if (!name) {
    return { error: 'Form name is required' };
  }

  let schema: FormSchema = { fields: [] };

  if (fieldsJson) {
    try {
      const fields = JSON.parse(fieldsJson);
      schema = { fields };
    } catch (e) {
      return { error: 'Invalid fields data' };
    }
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('form_templates')
    .insert({
      business_id: business.id,
      name,
      description: description || null,
      work_type: workType || null,
      schema,
      logic_rules: [],
      is_active: 'true',
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/forms');
  return { success: true };
}

export async function updateFormTemplate(id: string, formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const workType = formData.get('workType') as string;
  const fieldsJson = formData.get('fields') as string;

  let schema: FormSchema = { fields: [] };

  if (fieldsJson) {
    try {
      const fields = JSON.parse(fieldsJson);
      schema = { fields };
    } catch (e) {
      return { error: 'Invalid fields data' };
    }
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('form_templates')
    .update({
      name,
      description: description || null,
      work_type: workType || null,
      schema,
    })
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/forms');
  return { success: true };
}

export async function deleteFormTemplate(id: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('form_templates')
    .delete()
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/forms');
  return { success: true };
}
