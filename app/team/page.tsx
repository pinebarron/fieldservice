import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { TeamClient } from './TeamClient';

export default async function TeamPage() {
  const { user, userProfile, business, role } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  // Redirect technicians to tech dashboard
  if (role === 'technician') {
    redirect('/tech');
  }

  const adminClient = createAdminClient();
  const { data: members } = await adminClient
    .from('business_members')
    .select(`id, role, title, phone, invite_accepted_at, user:users(id, email, first_name, last_name, profile_image_url)`)
    .eq('business_id', business.id);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TeamClient members={members} />
      </main>
    </div>
  );
}
