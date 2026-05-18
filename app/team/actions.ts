'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function addTeamMember(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const email = formData.get('email') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const role = formData.get('role') as string || 'technician';

  if (!email) {
    return { error: 'Email is required' };
  }

  const adminClient = createAdminClient();

  // Check if user exists by email
  let { data: existingUser } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  let memberId: string;

  if (existingUser) {
    memberId = existingUser.id;
  } else {
    // Create user record
    const { data: newUser, error: userError } = await adminClient
      .from('users')
      .insert({
        email,
        first_name: firstName || null,
        last_name: lastName || null,
      })
      .select('id')
      .single();

    if (userError) {
      return { error: `Failed to create user: ${userError.message}` };
    }
    memberId = newUser.id;
  }

  // Check if already a member
  const { data: existingMember } = await adminClient
    .from('business_members')
    .select('id')
    .eq('business_id', business.id)
    .eq('user_id', memberId)
    .single();

  if (existingMember) {
    return { error: 'This person is already a team member' };
  }

  // Add as business member
  const { error: memberError } = await adminClient
    .from('business_members')
    .insert({
      business_id: business.id,
      user_id: memberId,
      role,
    });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath('/team');
  return { success: true };
}

export async function removeTeamMember(memberId: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('business_members')
    .delete()
    .eq('id', memberId)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/team');
  return { success: true };
}
