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
  sectionId?: string;
};

export type FormSection = {
  id: string;
  title: string;
};

export type FormSchema = {
  fields: FormField[];
  sections?: FormSection[];
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
  const sectionsJson = formData.get('sections') as string;

  if (!name) {
    return { error: 'Form name is required' };
  }

  let schema: FormSchema = { fields: [], sections: [] };

  if (fieldsJson) {
    try {
      const fields = JSON.parse(fieldsJson);
      schema.fields = fields;
    } catch (e) {
      return { error: 'Invalid fields data' };
    }
  }

  if (sectionsJson) {
    try {
      const sections = JSON.parse(sectionsJson);
      schema.sections = sections;
    } catch (e) {
      // Ignore section parse errors
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
  const sectionsJson = formData.get('sections') as string;

  let schema: FormSchema = { fields: [], sections: [] };

  if (fieldsJson) {
    try {
      const fields = JSON.parse(fieldsJson);
      schema.fields = fields;
    } catch (e) {
      return { error: 'Invalid fields data' };
    }
  }

  if (sectionsJson) {
    try {
      const sections = JSON.parse(sectionsJson);
      schema.sections = sections;
    } catch (e) {
      // Ignore section parse errors
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

const STARTER_TEMPLATE_DATA: Record<string, {
  name: string;
  description: string;
  work_type: string;
  schema: FormSchema;
}> = {
  'site-survey': {
    name: 'Site Survey',
    description: 'Initial site assessment for new installations',
    work_type: 'Inspection',
    schema: {
      sections: [
        { id: 'site', title: 'Site Information' },
        { id: 'electrical', title: 'Electrical Assessment' },
        { id: 'photos', title: 'Documentation' },
      ],
      fields: [
        { id: 'access_notes', type: 'textarea', label: 'Site Access Notes', sectionId: 'site' },
        { id: 'roof_type', type: 'select', label: 'Roof Type', sectionId: 'site', options: [
          { label: 'Composition Shingle', value: 'comp_shingle' },
          { label: 'Tile', value: 'tile' },
          { label: 'Metal', value: 'metal' },
          { label: 'Flat/TPO', value: 'flat' },
          { label: 'Other', value: 'other' },
        ]},
        { id: 'roof_age', type: 'number', label: 'Estimated Roof Age (years)', sectionId: 'site' },
        { id: 'shading', type: 'select', label: 'Shading Conditions', sectionId: 'site', options: [
          { label: 'No Shading', value: 'none' },
          { label: 'Minimal (< 10%)', value: 'minimal' },
          { label: 'Moderate (10-30%)', value: 'moderate' },
          { label: 'Significant (> 30%)', value: 'significant' },
        ]},
        { id: 'panel_capacity', type: 'number', label: 'Main Panel Capacity (Amps)', sectionId: 'electrical' },
        { id: 'panel_location', type: 'text', label: 'Panel Location', sectionId: 'electrical' },
        { id: 'meter_type', type: 'select', label: 'Meter Type', sectionId: 'electrical', options: [
          { label: 'Analog', value: 'analog' },
          { label: 'Digital', value: 'digital' },
          { label: 'Smart Meter', value: 'smart' },
        ]},
        { id: 'photo_roof', type: 'photo', label: 'Roof Photo', sectionId: 'photos' },
        { id: 'photo_panel', type: 'photo', label: 'Electrical Panel Photo', sectionId: 'photos' },
        { id: 'photo_meter', type: 'photo', label: 'Meter Photo', sectionId: 'photos' },
        { id: 'gps', type: 'gps', label: 'Site Location', sectionId: 'site' },
      ],
    },
  },
  'installation-checklist': {
    name: 'Installation Checklist',
    description: 'Track installation progress and completion',
    work_type: 'Solar Installation',
    schema: {
      sections: [
        { id: 'safety', title: 'Safety Check' },
        { id: 'install', title: 'Installation Steps' },
        { id: 'completion', title: 'Completion' },
      ],
      fields: [
        { id: 'safety_gear', type: 'checkbox', label: 'PPE worn by all workers', required: true, sectionId: 'safety' },
        { id: 'ladder_secured', type: 'checkbox', label: 'Ladder properly secured', required: true, sectionId: 'safety' },
        { id: 'area_clear', type: 'checkbox', label: 'Work area clear of hazards', required: true, sectionId: 'safety' },
        { id: 'mounting_complete', type: 'checkbox', label: 'Mounting/racking installed', sectionId: 'install' },
        { id: 'panels_installed', type: 'checkbox', label: 'Panels installed', sectionId: 'install' },
        { id: 'panel_count', type: 'number', label: 'Number of panels installed', sectionId: 'install' },
        { id: 'wiring_complete', type: 'checkbox', label: 'Wiring completed', sectionId: 'install' },
        { id: 'inverter_installed', type: 'checkbox', label: 'Inverter installed', sectionId: 'install' },
        { id: 'inverter_serial', type: 'text', label: 'Inverter Serial Number', sectionId: 'install' },
        { id: 'system_tested', type: 'checkbox', label: 'System tested and operational', sectionId: 'completion' },
        { id: 'customer_walkthrough', type: 'checkbox', label: 'Customer walkthrough completed', sectionId: 'completion' },
        { id: 'photo_completed', type: 'photo', label: 'Completed Installation Photo', sectionId: 'completion' },
        { id: 'notes', type: 'textarea', label: 'Additional Notes', sectionId: 'completion' },
      ],
    },
  },
  'service-visit': {
    name: 'Service Visit',
    description: 'Document maintenance and service calls',
    work_type: 'Solar Maintenance',
    schema: {
      sections: [
        { id: 'arrival', title: 'Arrival' },
        { id: 'work', title: 'Work Performed' },
        { id: 'departure', title: 'Departure' },
      ],
      fields: [
        { id: 'arrival_time', type: 'time', label: 'Arrival Time', sectionId: 'arrival' },
        { id: 'system_status_arrival', type: 'select', label: 'System Status on Arrival', sectionId: 'arrival', options: [
          { label: 'Operational', value: 'operational' },
          { label: 'Partial Output', value: 'partial' },
          { label: 'Not Working', value: 'down' },
        ]},
        { id: 'issue_reported', type: 'textarea', label: 'Issue Reported by Customer', sectionId: 'arrival' },
        { id: 'work_description', type: 'textarea', label: 'Work Performed', required: true, sectionId: 'work' },
        { id: 'parts_used', type: 'textarea', label: 'Parts/Materials Used', sectionId: 'work' },
        { id: 'photo_work', type: 'photo', label: 'Photo of Work', sectionId: 'work' },
        { id: 'departure_time', type: 'time', label: 'Departure Time', sectionId: 'departure' },
        { id: 'system_status_departure', type: 'select', label: 'System Status on Departure', sectionId: 'departure', options: [
          { label: 'Fully Operational', value: 'operational' },
          { label: 'Partial - Follow-up Needed', value: 'partial' },
          { label: 'Awaiting Parts', value: 'awaiting' },
        ]},
        { id: 'followup_needed', type: 'checkbox', label: 'Follow-up visit required', sectionId: 'departure' },
        { id: 'followup_notes', type: 'textarea', label: 'Follow-up Notes', sectionId: 'departure' },
      ],
    },
  },
};

export async function createStarterTemplate(templateId: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const template = STARTER_TEMPLATE_DATA[templateId];
  if (!template) {
    return { error: 'Template not found' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.from('form_templates').insert({
    business_id: business.id,
    name: template.name,
    description: template.description,
    work_type: template.work_type,
    schema: template.schema,
    logic_rules: [],
    is_active: 'true',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/forms');
  return { success: true };
}

export async function seedStarterTemplates() {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  for (const [, template] of Object.entries(STARTER_TEMPLATE_DATA)) {
    await adminClient.from('form_templates').insert({
      business_id: business.id,
      name: template.name,
      description: template.description,
      work_type: template.work_type,
      schema: template.schema,
      logic_rules: [],
      is_active: 'true',
    });
  }

  revalidatePath('/forms');
  return { success: true, count: Object.keys(STARTER_TEMPLATE_DATA).length };
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
