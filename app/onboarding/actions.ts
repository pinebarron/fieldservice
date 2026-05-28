'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { getIndustry, type IndustryId } from '@/lib/industries';

export async function createBusiness(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const businessName = formData.get('businessName') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;
  const phone = formData.get('phone') as string;
  const industry = (formData.get('industry') as IndustryId) || 'solar';

  if (!businessName) {
    return { error: 'Business name is required' };
  }

  const adminClient = createAdminClient();

  // Get or create user in the users table
  let userId = user.id;

  // First check if user exists by auth ID
  const { data: existingUserById } = await adminClient
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingUserById) {
    // Check if user exists by email
    const { data: existingUserByEmail } = await adminClient
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (existingUserByEmail) {
      // Use the existing user's ID
      userId = existingUserByEmail.id;
    } else {
      // Create new user record
      const { data: newUser, error: userError } = await adminClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
        })
        .select('id')
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return { error: `Failed to create user: ${userError.message}` };
      }
      userId = newUser.id;
    }
  }

  // Check if business already exists for this user
  const { data: existingBusiness } = await adminClient
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (existingBusiness) {
    redirect('/schedule');
  }

  // Create the business
  const { data: newBusiness, error: businessError } = await adminClient
    .from('businesses')
    .insert({
      name: businessName,
      owner_id: userId,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      phone: phone || null,
      industry: industry,
    })
    .select('id')
    .single();

  if (businessError) {
    console.error('Error creating business:', businessError);
    return { error: businessError.message };
  }

  // Seed starter templates for the selected industry
  const industryConfig = getIndustry(industry);
  if (industryConfig && newBusiness) {
    for (const template of industryConfig.starterTemplates) {
      await adminClient.from('form_templates').insert({
        business_id: newBusiness.id,
        name: template.name,
        description: template.description,
        work_type: template.workType,
        schema: {
          fields: template.fields,
          sections: template.sections || [],
        },
        logic_rules: [],
        is_active: 'true',
      });
    }

    // Seed pricing items for the selected industry
    for (const item of industryConfig.pricingItems) {
      await adminClient.from('pricing_items').insert({
        business_id: newBusiness.id,
        name: item.name,
        unit: item.unit,
        unit_price: item.defaultPrice || 0,
      });
    }
  }

  redirect('/schedule');
}
