import { redirect, notFound } from 'next/navigation';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { createAdminClient } from '@/lib/supabase/admin';
import { TechHeader } from '@/components/TechHeader';
import { TechJobDetail } from './TechJobDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TechJobPage({ params }: PageProps) {
  const { id } = await params;
  const { user, userProfile, business, userId, role } = await getUserAndBusiness();

  if (!user) redirect('/login');
  if (!business) redirect('/onboarding');

  const adminClient = createAdminClient();

  // Fetch the job with related data including property
  const { data: job } = await adminClient
    .from('work_logs')
    .select(`
      *,
      form_submissions (
        id,
        template_id,
        responses,
        submitted_at,
        form_templates (
          id,
          name,
          schema
        )
      ),
      assigned_tech:users!work_logs_technician_user_id_fkey(
        id,
        first_name,
        last_name,
        email
      ),
      property:properties(
        id,
        property_type
      )
    `)
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (!job) {
    notFound();
  }

  // Check if user can edit (assigned tech or owner/admin)
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isAssigned = job.technician_user_id === userId;
  const canEdit = isOwnerOrAdmin || isAssigned;

  // Fetch form templates for this business (for completing work orders)
  const { data: formTemplates } = await adminClient
    .from('form_templates')
    .select('id, name, work_type, schema')
    .eq('business_id', business.id)
    .eq('is_active', 'true');

  return (
    <div className="min-h-screen bg-background">
      <TechHeader user={user} userProfile={userProfile || undefined} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <TechJobDetail
          job={job}
          canEdit={canEdit}
          isAssigned={isAssigned}
          currentUserId={userId || ''}
          formTemplates={formTemplates || []}
          businessId={business.id}
        />
      </main>
    </div>
  );
}
