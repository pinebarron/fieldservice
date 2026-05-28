import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { TechHeader } from '@/components/TechHeader';
import { TechProfileClient } from './TechProfileClient';

export default async function TechProfilePage() {
  const { user, userProfile, business, role } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  // Only technicians and team members should access this
  if (role === 'owner') {
    redirect('/settings');
  }

  return (
    <div className="min-h-screen bg-background">
      <TechHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <TechProfileClient
          user={{
            email: user.email || '',
            firstName: userProfile?.firstName || null,
            lastName: userProfile?.lastName || null,
            profileImageUrl: userProfile?.profileImageUrl || null,
          }}
          business={{
            name: business.name,
            address: business.address,
            city: business.city,
            state: business.state,
            zipCode: business.zip_code,
            phone: business.phone,
            logoUrl: business.logo_url,
          }}
          role={role || 'technician'}
        />
      </main>
    </div>
  );
}
