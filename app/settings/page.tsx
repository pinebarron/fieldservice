import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { AppHeader } from '@/components/AppHeader';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const { user, userProfile, business } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your business profile and branding
          </p>
        </div>

        <SettingsClient
          business={{
            id: business.id,
            name: business.name,
            address: business.address,
            city: business.city,
            state: business.state,
            zip_code: business.zip_code,
            phone: business.phone,
            logo_url: business.logo_url,
            brand_color: business.brand_color,
          }}
          userEmail={user.email || ''}
          userProfile={userProfile ? {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
          } : null}
        />
      </main>
    </div>
  );
}
