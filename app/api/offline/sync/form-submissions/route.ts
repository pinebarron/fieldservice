import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';

export async function POST(request: NextRequest) {
  try {
    const { user, business, userId, role } = await getUserAndBusiness();

    if (!user || !business || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { workLogId, formTemplateId, responses, submittedAt } = body;

    if (!workLogId || !formTemplateId || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify the work log exists and belongs to this business
    const { data: workLog } = await adminClient
      .from('work_logs')
      .select('id, business_id, technician_user_id')
      .eq('id', workLogId)
      .eq('business_id', business.id)
      .single();

    if (!workLog) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 });
    }

    // Check permissions
    const isOwnerOrAdmin = role === 'owner' || role === 'admin';
    const isAssigned = workLog.technician_user_id === userId;

    if (!isOwnerOrAdmin && !isAssigned) {
      return NextResponse.json(
        { error: 'Not authorized to submit forms for this job' },
        { status: 403 }
      );
    }

    // Verify the form template exists
    const { data: template } = await adminClient
      .from('form_templates')
      .select('id, schema')
      .eq('id', formTemplateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 });
    }

    // Create the form submission
    const { data, error } = await adminClient
      .from('form_submissions')
      .insert({
        work_log_id: workLogId,
        template_id: formTemplateId,
        responses,
        submitted_at: submittedAt || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating form submission from offline sync:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Extract and update photo metadata on work log if present
    const allPhotos: Array<{
      url: string;
      type: string;
      fieldLabel: string;
      capturedAt: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
    }> = [];

    if (template.schema?.fields) {
      const photoFields = template.schema.fields.filter(
        (f: { type: string }) => f.type === 'photo'
      );

      for (const field of photoFields) {
        const photos = responses[field.id] as Array<{
          url: string;
          capturedAt: string;
          lat?: number;
          lng?: number;
          accuracy?: number;
        }> | undefined;

        if (photos && Array.isArray(photos)) {
          const photoType = field.photoConfig?.classification || 'general';
          allPhotos.push(
            ...photos.map((p) => ({
              url: p.url,
              type: photoType,
              fieldLabel: field.label,
              capturedAt: p.capturedAt,
              lat: p.lat,
              lng: p.lng,
              accuracy: p.accuracy,
            }))
          );
        }
      }
    }

    // Update work log photo metadata if there are photos
    if (allPhotos.length > 0) {
      const imageUrls = allPhotos.map((p) => p.url);

      await adminClient
        .from('work_logs')
        .update({
          image_urls: imageUrls,
          photo_metadata: allPhotos,
        })
        .eq('id', workLogId);
    }

    return NextResponse.json({ id: data.id, success: true });
  } catch (error) {
    console.error('Error in offline form submission sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
