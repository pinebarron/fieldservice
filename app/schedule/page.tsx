import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { ScheduleClient } from './ScheduleClient';

export default async function SchedulePage() {
  const { user, userProfile, business } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  const adminClient = createAdminClient();

  // Fetch work logs with form submissions and form templates in parallel
  const [workLogsResult, formTemplatesResult] = await Promise.all([
    adminClient
      .from('work_logs')
      .select(`
        *,
        form_submissions (
          id,
          template_id,
          responses,
          submitted_at,
          form_templates (
            name,
            schema
          )
        )
      `)
      .eq('business_id', business.id)
      .order('service_date', { ascending: false }),
    adminClient
      .from('form_templates')
      .select('id, name, work_type, schema')
      .eq('business_id', business.id)
      .eq('is_active', 'true')
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ScheduleClient
          scheduledJobs={workLogsResult.data}
          formTemplates={formTemplatesResult.data || []}
        />
      </main>
    </div>
  );
}
