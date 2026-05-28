'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

// Generate a secure random invite token
function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

export async function addTeamMember(formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const email = formData.get('email') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const role = formData.get('role') as string || 'technician';
  const title = formData.get('title') as string;
  const phone = formData.get('phone') as string;

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

  // Generate invite token
  const inviteToken = generateInviteToken();

  // Add as business member with invite token
  const { data: newMember, error: memberError } = await adminClient
    .from('business_members')
    .insert({
      business_id: business.id,
      user_id: memberId,
      role,
      title: title || null,
      phone: phone || null,
      invite_token: inviteToken,
      invite_sent_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (memberError) {
    console.error('Failed to create business member:', memberError);
    // If invite columns don't exist, try without them
    if (memberError.message.includes('invite_token') || memberError.message.includes('column')) {
      const { data: fallbackMember, error: fallbackError } = await adminClient
        .from('business_members')
        .insert({
          business_id: business.id,
          user_id: memberId,
          role,
        })
        .select('id')
        .single();

      if (fallbackError) {
        return { error: fallbackError.message };
      }
      // Return success but warn about missing migration
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return {
        success: true,
        inviteUrl: `${baseUrl}/login`,
        warning: 'Invite system not configured - user should login directly',
      };
    }
    return { error: memberError.message };
  }

  // Generate the invite URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;

  revalidatePath('/team');
  return {
    success: true,
    inviteUrl,
    inviteToken,
    // Email would typically be sent here - for now return URL for manual sharing
  };
}

export async function getInviteUrl(memberId: string) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const adminClient = createAdminClient();

  // Get member's invite token and user email
  const { data: member } = await adminClient
    .from('business_members')
    .select('invite_token, invite_accepted_at, user:users(email)')
    .eq('id', memberId)
    .eq('business_id', business.id)
    .single();

  if (!member) {
    return { error: 'Member not found' };
  }

  // Handle Supabase array return
  const memberUser = Array.isArray(member.user) ? member.user[0] : member.user;

  // If already accepted, tell them to just log in
  if (member.invite_accepted_at) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return {
      success: true,
      alreadyAccepted: true,
      loginUrl: `${baseUrl}/login`,
      email: memberUser?.email || '',
      message: 'This member has already set up their account. They can log in directly.'
    };
  }

  let inviteToken = member.invite_token;

  // Generate new token if none exists
  if (!inviteToken) {
    inviteToken = generateInviteToken();
    await adminClient
      .from('business_members')
      .update({
        invite_token: inviteToken,
        invite_sent_at: new Date().toISOString(),
      })
      .eq('id', memberId);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;

  return { success: true, inviteUrl };
}

export async function updateTeamMember(memberId: string, formData: FormData) {
  const { user, business } = await getUserAndBusiness();

  if (!user || !business) {
    return { error: 'Not authenticated' };
  }

  const role = formData.get('role') as string;
  const title = formData.get('title') as string;
  const phone = formData.get('phone') as string;

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('business_members')
    .update({
      role,
      title: title || null,
      phone: phone || null,
    })
    .eq('id', memberId)
    .eq('business_id', business.id);

  if (error) {
    return { error: error.message };
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
