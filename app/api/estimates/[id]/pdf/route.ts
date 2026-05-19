import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { EstimatePDF } from '@/components/EstimatePDF';

function estimateNum(id: string) {
  return 'EST-' + id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    // Fetch estimate
    const { data: estimate, error: estimateError } = await adminClient
      .from('estimates')
      .select('*')
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Fetch line items
    const { data: lineItems } = await adminClient
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', id)
      .order('sort_order');

    // Generate PDF
    const pdfElement = React.createElement(EstimatePDF, {
      estimate,
      lineItems: (lineItems || []).map(li => ({
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unitPrice: li.unit_price,
      })),
      business: {
        name: business.name,
        address: business.address,
        city: business.city,
        state: business.state,
        zip_code: business.zip_code,
        phone: business.phone,
        logo_url: business.logo_url,
        brand_color: business.brand_color,
      },
    });
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    const filename = `${business.name.replace(/[^a-z0-9]/gi, '_')}_Estimate_${estimateNum(estimate.id)}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
