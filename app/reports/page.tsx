import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { ReportsClient } from './ReportsClient';

export default async function ReportsPage() {
  const { user, userProfile, business, role } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  // Only owners and admins can access reports
  if (role !== 'owner' && role !== 'admin') {
    redirect('/schedule');
  }

  const adminClient = createAdminClient();

  // Fetch all data needed for reports
  const [
    { data: workLogs },
    { data: estimates },
    { data: properties },
    { data: formSubmissions },
    { data: formTemplates },
    { data: teamMembers },
  ] = await Promise.all([
    adminClient
      .from('work_logs')
      .select('*')
      .eq('business_id', business.id)
      .order('service_date', { ascending: false }),
    adminClient
      .from('estimates')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false }),
    adminClient
      .from('properties')
      .select('*')
      .eq('business_id', business.id),
    adminClient
      .from('form_submissions')
      .select(`
        *,
        work_logs!inner(business_id),
        form_templates(id, name, schema)
      `)
      .eq('work_logs.business_id', business.id),
    adminClient
      .from('form_templates')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', 'true'),
    adminClient
      .from('business_members')
      .select(`
        *,
        users(id, first_name, last_name, email)
      `)
      .eq('business_id', business.id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReportsClient
          workLogs={workLogs || []}
          estimates={estimates || []}
          properties={properties || []}
          formSubmissions={formSubmissions || []}
          formTemplates={formTemplates || []}
          teamMembers={teamMembers || []}
        />
      </main>
    </div>
  );
}
