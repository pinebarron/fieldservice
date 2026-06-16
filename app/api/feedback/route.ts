import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, ratings, comment } = body;

    if (!token || !ratings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ratings
    const { quality, professionalism, value, timeliness } = ratings;
    if (
      !Number.isInteger(quality) || quality < 1 || quality > 5 ||
      !Number.isInteger(professionalism) || professionalism < 1 || professionalism > 5 ||
      !Number.isInteger(value) || value < 1 || value > 5 ||
      !Number.isInteger(timeliness) || timeliness < 1 || timeliness > 5
    ) {
      return NextResponse.json(
        { error: 'Invalid ratings. All ratings must be between 1 and 5.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Find work order by token
    const { data: workOrder, error: fetchError } = await adminClient
      .from('work_logs')
      .select('id, feedback_submitted_at')
      .eq('feedback_token', token)
      .single();

    if (fetchError || !workOrder) {
      return NextResponse.json(
        { error: 'Invalid or expired feedback link' },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (workOrder.feedback_submitted_at) {
      return NextResponse.json(
        { error: 'Feedback has already been submitted' },
        { status: 400 }
      );
    }

    // Save feedback
    const feedbackResponse = {
      quality,
      professionalism,
      value,
      timeliness,
      comment: comment || null,
    };

    const { error: updateError } = await adminClient
      .from('work_logs')
      .update({
        feedback_response: feedbackResponse,
        feedback_submitted_at: new Date().toISOString(),
      })
      .eq('id', workOrder.id);

    if (updateError) {
      console.error('Error saving feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
