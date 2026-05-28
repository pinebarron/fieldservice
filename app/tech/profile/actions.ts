'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';

export async function updateProfileImage(imageUrl: string | null) {
  const { user, business, userId } = await getUserAndBusiness();

  if (!user || !business || !userId) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('users')
    .update({ profile_image_url: imageUrl })
    .eq('id', userId);

  if (error) {
    console.error('Update profile image error:', error);
    return { error: error.message };
  }

  revalidatePath('/tech');
  revalidatePath('/tech/profile');
  return { success: true };
}
