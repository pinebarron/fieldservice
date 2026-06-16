import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { FeedbackForm } from './FeedbackForm';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function FeedbackPage({ params }: PageProps) {
  const { token } = await params;

  const adminClient = createAdminClient();

  // Find work order by feedback token
  const { data: workOrder } = await adminClient
    .from('work_logs')
    .select(`
      id,
      customer_name,
      work_type,
      service_date,
      feedback_response,
      feedback_submitted_at,
      business_id,
      businesses (
        name,
        logo_url
      )
    `)
    .eq('feedback_token', token)
    .single();

  if (!workOrder) {
    notFound();
  }

  // Handle Supabase returning array or single object
  const business = Array.isArray(workOrder.businesses)
    ? workOrder.businesses[0]
    : workOrder.businesses;

  const alreadySubmitted = !!workOrder.feedback_submitted_at;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-center">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business?.name || 'Company'} className="h-10" />
          ) : (
            <img src="/icons/crewatt-logo-primary.svg" alt="Crewatt" className="h-10" />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <FeedbackForm
          token={token}
          workOrder={{
            customerName: workOrder.customer_name,
            workType: workOrder.work_type,
            serviceDate: workOrder.service_date,
          }}
          businessName={business?.name || 'Our Team'}
          alreadySubmitted={alreadySubmitted}
          existingResponse={workOrder.feedback_response as any}
        />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Powered by <a href="https://crewatt.com" className="text-primary hover:underline">Crewatt</a>
        </div>
      </footer>
    </div>
  );
}
