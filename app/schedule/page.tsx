import { redirect } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppHeader } from '@/components/AppHeader';
import { ScheduleClient } from './ScheduleClient';

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; new?: string }>;
}) {
  const { user, userProfile, business, userId, role } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  // Redirect technicians to tech dashboard
  if (role === 'technician') {
    redirect('/tech');
  }

  const params = await searchParams;
  const selectedJobId = params.job || null;
  const openNewForm = params.new === 'true';

  const adminClient = createAdminClient();

  // Fetch work logs, form templates, properties, and team members in parallel
  const [workLogsResult, formTemplatesResult, propertiesResult, teamMembersResult] = await Promise.all([
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
        ),
        assigned_tech:users!work_logs_technician_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('business_id', business.id)
      .order('service_date', { ascending: false }),
    adminClient
      .from('form_templates')
      .select('id, name, work_type, schema')
      .eq('business_id', business.id)
      .eq('is_active', 'true'),
    adminClient
      .from('properties')
      .select('id, property_name, customer_name, location_name, city, state, zip_code')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('property_name'),
    adminClient
      .from('business_members')
      .select(`
        id,
        role,
        user_id,
        user:users(id, first_name, last_name, email)
      `)
      .eq('business_id', business.id)
  ]);

  // Include the owner in the team members list
  const { data: ownerData } = await adminClient
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('id', business.owner_id)
    .single();

  // Format team members for the UI
  const teamMembers = [
    // Include owner
    ...(ownerData ? [{
      id: 'owner',
      userId: ownerData.id,
      role: 'owner',
      user: ownerData as { id: string; first_name: string | null; last_name: string | null; email: string | null; }
    }] : []),
    // Include other team members (handle array return from Supabase)
    ...(teamMembersResult.data || []).map(member => {
      const user = Array.isArray(member.user) ? member.user[0] : member.user;
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        user: user as { id: string; first_name: string | null; last_name: string | null; email: string | null; } | null
      };
    })
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ScheduleClient
          scheduledJobs={workLogsResult.data}
          formTemplates={formTemplatesResult.data || []}
          properties={propertiesResult.data || []}
          teamMembers={teamMembers}
          business={{
            name: business.name,
            address: business.address || undefined,
            city: business.city || undefined,
            state: business.state || undefined,
            zipCode: business.zipCode || undefined,
            phone: business.phone || undefined,
            logoUrl: business.logoUrl || undefined,
          }}
          initialSelectedJobId={selectedJobId}
          openNewForm={openNewForm}
        />
      </main>
    </div>
  );
}
