'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function validateInviteToken(token: string) {
  if (!token) {
    return { error: 'No invite token provided' };
  }

  const adminClient = createAdminClient();

  // Find the invite
  const { data: member } = await adminClient
    .from('business_members')
    .select(`
      id,
      role,
      invite_accepted_at,
      user:users(id, email, first_name, last_name),
      business:businesses(id, name)
    `)
    .eq('invite_token', token)
    .single();

  if (!member) {
    return { error: 'Invalid invite token' };
  }

  if (member.invite_accepted_at) {
    return { error: 'This invite has already been accepted' };
  }

  // Handle both single object and array returns from Supabase
  const user = Array.isArray(member.user) ? member.user[0] : member.user;
  const business = Array.isArray(member.business) ? member.business[0] : member.business;

  return {
    success: true,
    invite: {
      memberId: member.id,
      role: member.role,
      email: user?.email || '',
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      businessName: business?.name || '',
      userId: user?.id || '',
    }
  };
}

export async function acceptInvite(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  if (!token || !password) {
    return { error: 'Token and password are required' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const adminClient = createAdminClient();

  // Find the invite
  const { data: member } = await adminClient
    .from('business_members')
    .select(`
      id,
      invite_accepted_at,
      user:users(id, email, first_name, last_name)
    `)
    .eq('invite_token', token)
    .single();

  if (!member) {
    return { error: 'Invalid invite token' };
  }

  if (member.invite_accepted_at) {
    return { error: 'This invite has already been accepted' };
  }

  // Handle both single object and array returns from Supabase
  const memberUser = Array.isArray(member.user) ? member.user[0] : member.user;
  const email = memberUser?.email;
  if (!email) {
    return { error: 'User email not found' };
  }

  // Check if a Supabase Auth user already exists with this email
  const { data: existingAuthUsers } = await adminClient.auth.admin.listUsers();
  const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === email);

  if (existingAuthUser) {
    // User already has an auth account - just mark invite as accepted and sign them in
    await adminClient
      .from('business_members')
      .update({
        invite_accepted_at: new Date().toISOString(),
        invite_token: null, // Clear the token
      })
      .eq('id', member.id);

    // Update user profile if names provided
    if (firstName || lastName) {
      await adminClient
        .from('users')
        .update({
          first_name: firstName || memberUser?.first_name,
          last_name: lastName || memberUser?.last_name,
        })
        .eq('id', memberUser?.id);
    }

    return {
      success: true,
      message: 'Account already exists. Please log in with your existing credentials.',
      redirect: '/login'
    };
  }

  // Create Supabase Auth user with the provided password
  const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm since they came via invite
    user_metadata: {
      first_name: firstName || memberUser?.first_name,
      last_name: lastName || memberUser?.last_name,
    }
  });

  if (authError) {
    console.error('Auth user creation error:', authError);
    return { error: `Failed to create account: ${authError.message}` };
  }

  // Update the users table with the auth user ID if different
  if (newAuthUser?.user && memberUser?.id !== newAuthUser.user.id) {
    // Update the user record ID to match the auth ID
    await adminClient
      .from('users')
      .update({
        id: newAuthUser.user.id,
        first_name: firstName || memberUser?.first_name,
        last_name: lastName || memberUser?.last_name,
      })
      .eq('id', memberUser?.id);

    // Update the business_members reference
    await adminClient
      .from('business_members')
      .update({
        user_id: newAuthUser.user.id,
      })
      .eq('id', member.id);
  } else {
    // Just update the name
    await adminClient
      .from('users')
      .update({
        first_name: firstName || memberUser?.first_name,
        last_name: lastName || memberUser?.last_name,
      })
      .eq('id', memberUser?.id);
  }

  // Mark invite as accepted
  await adminClient
    .from('business_members')
    .update({
      invite_accepted_at: new Date().toISOString(),
      invite_token: null, // Clear the token
    })
    .eq('id', member.id);

  // Sign in the user
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return {
      success: true,
      message: 'Account created! Please log in.',
      redirect: '/login'
    };
  }

  return {
    success: true,
    redirect: '/tech'
  };
}
