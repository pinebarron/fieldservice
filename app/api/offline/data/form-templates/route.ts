import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';

export async function GET() {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch all active form templates for this business
    const { data: templates, error } = await adminClient
      .from('form_templates')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', 'true')
      .order('name');

    if (error) {
      console.error('Error fetching form templates for offline:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      templates: templates || [],
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in offline form templates fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
