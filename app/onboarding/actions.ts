'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

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
    redirect('/dashboard');
  }

  // Create the business
  const { error: businessError } = await adminClient
    .from('businesses')
    .insert({
      name: businessName,
      owner_id: userId,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      phone: phone || null,
    });

  if (businessError) {
    console.error('Error creating business:', businessError);
    return { error: businessError.message };
  }

  redirect('/dashboard');
}
