import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { TechHeader } from '@/components/TechHeader';
import { TechDashboard } from './TechDashboard';

export default async function TechPage() {
  const { user, userProfile, business, userId, role } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  // Owners/admins can view tech dashboard but are usually on admin pages
  // Technicians will always land here

  const adminClient = createAdminClient();

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];

  // Fetch all work logs for the business
  const { data: allJobs } = await adminClient
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
      ),
      assigned_tech:users!work_logs_technician_user_id_fkey(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('business_id', business.id)
    .order('service_date', { ascending: true });

  // Filter for today's jobs
  const todaysJobs = allJobs?.filter(job => job.service_date === today) || [];

  // Get upcoming jobs (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const upcomingJobs = allJobs?.filter(job =>
    job.service_date > today && job.service_date <= nextWeekStr
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <TechHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TechDashboard
          todaysJobs={todaysJobs}
          upcomingJobs={upcomingJobs}
          allJobs={allJobs || []}
          currentUserId={userId || ''}
          userProfile={userProfile}
          role={role || 'technician'}
        />
      </main>
    </div>
  );
}
