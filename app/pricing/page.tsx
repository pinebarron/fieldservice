import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { PricingClient } from './PricingClient';

export default async function PricingPage() {
  const { user, userProfile, business } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  const adminClient = createAdminClient();
  const { data: pricingItems } = await adminClient
    .from('pricing_items')
    .select('*')
    .eq('business_id', business.id)
    .order('category', { ascending: true });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PricingClient pricingItems={pricingItems} />
      </main>
    </div>
  );
}
