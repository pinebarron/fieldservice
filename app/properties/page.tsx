import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { PropertiesClient } from './PropertiesClient';

export default async function PropertiesPage() {
  const { user, userProfile, business } = await getUserAndBusiness();

  if (!user) {
    redirect('/login');
  }

  if (!business) {
    redirect('/onboarding');
  }

  const adminClient = createAdminClient();
  const { data: properties } = await adminClient
    .from('properties')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PropertiesClient properties={properties} />
      </main>
    </div>
  );
}
