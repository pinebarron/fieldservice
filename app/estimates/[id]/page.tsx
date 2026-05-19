import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { EstimateDetailClient } from './EstimateDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EstimateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user, userProfile, business } = await getUserAndBusiness();

  if (!user) {
    redirect('/login');
  }

  if (!business) {
    redirect('/onboarding');
  }

  const adminClient = createAdminClient();

  const { data: estimate } = await adminClient
    .from('estimates')
    .select('*')
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (!estimate) {
    redirect('/estimates');
  }

  const { data: lineItems } = await adminClient
    .from('estimate_line_items')
    .select('*')
    .eq('estimate_id', id)
    .order('sort_order');

  const { data: pricingItems } = await adminClient
    .from('pricing_items')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', 'true')
    .order('category');

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EstimateDetailClient
          estimate={estimate}
          lineItems={lineItems || []}
          pricingItems={pricingItems || []}
        />
      </main>
    </div>
  );
}
