import { createClient } from './server';
import { createAdminClient } from './admin';

export type UserRole = 'owner' | 'admin' | 'manager' | 'technician';

export async function getUserAndBusiness() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, userProfile: null, business: null, userId: null, role: null as UserRole | null };
  }

  const adminClient = createAdminClient();

  // Find user in users table - first by auth ID, then by email
  let userId = user.id;
  let userProfile = null;

  const { data: userById } = await adminClient
    .from('users')
    .select('id, first_name, last_name, profile_image_url')
    .eq('id', user.id)
    .single();

  if (userById) {
    userId = userById.id;
    userProfile = {
      firstName: userById.first_name,
      lastName: userById.last_name,
      profileImageUrl: userById.profile_image_url,
    };
  } else {
    // Check by email
    const { data: userByEmail } = await adminClient
      .from('users')
      .select('id, first_name, last_name, profile_image_url')
      .eq('email', user.email)
      .single();

    if (userByEmail) {
      userId = userByEmail.id;
      userProfile = {
        firstName: userByEmail.first_name,
        lastName: userByEmail.last_name,
        profileImageUrl: userByEmail.profile_image_url,
      };
    }
  }

  // First try: user is business owner
  let { data: business } = await adminClient
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .single();

  let role: UserRole = 'owner';

  // Second try: user is a team member
  if (!business) {
    const { data: membership } = await adminClient
      .from('business_members')
      .select('*, business:businesses(*)')
      .eq('user_id', userId)
      .single();

    if (membership) {
      business = membership.business;
      role = membership.role as UserRole; // 'technician', 'manager', 'admin'
    }
  }

  return { user, userProfile, business, userId, role };
}
