import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import sgMail from '@sendgrid/mail';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { EstimatePDF } from '@/components/EstimatePDF';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

function n(v: string | number | null | undefined) {
  const x = parseFloat(String(v ?? '0'));
  return isNaN(x) ? 0 : x;
}

function fmt(v: number) {
  return `$${v.toFixed(2)}`;
}

function estimateNum(id: string) {
  return 'EST-' + id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { customMessage } = await request.json().catch(() => ({}));

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

    if (!estimate.customer_email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // Fetch line items
    const { data: lineItems } = await adminClient
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', id)
      .order('sort_order');

    // Calculate totals for email
    const items = lineItems || [];
    const subtotal = items.reduce((sum, li) => sum + n(li.quantity) * n(li.unit_price), 0);
    const discount = n(estimate.discount_amount);
    const tax = (subtotal - discount) * (n(estimate.tax_rate) / 100);
    const total = subtotal - discount + tax;

    // Generate PDF
    const pdfElement = React.createElement(EstimatePDF, {
      estimate,
      lineItems: items.map(li => ({
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

    // Build email HTML
    const brandColor = business.brand_color || '#2d5a3d';
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${business.name}</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Estimate ${estimateNum(estimate.id)}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi ${estimate.customer_name},
              </p>

              ${customMessage ? `<p style="margin: 0 0 20px 0; font-size: 15px; color: #555; line-height: 1.6;">${customMessage}</p>` : ''}

              <p style="margin: 0 0 30px 0; font-size: 15px; color: #555; line-height: 1.6;">
                Please find attached your estimate for <strong>${estimate.title}</strong>.
              </p>

              <!-- Estimate Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Estimate Summary</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Subtotal</td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${fmt(subtotal)}</td>
                      </tr>
                      ${discount > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Discount</td>
                        <td style="padding: 8px 0; color: #16a34a; font-size: 14px; text-align: right;">-${fmt(discount)}</td>
                      </tr>
                      ` : ''}
                      ${n(estimate.tax_rate) > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Tax (${estimate.tax_rate}%)</td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${fmt(tax)}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0 0 0; color: #333; font-size: 18px; font-weight: 600; border-top: 2px solid #e5e7eb;">Total</td>
                        <td style="padding: 12px 0 0 0; color: ${brandColor}; font-size: 18px; font-weight: 600; text-align: right; border-top: 2px solid #e5e7eb;">${fmt(total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${estimate.valid_until ? `
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
                <strong>Valid until:</strong> ${new Date(estimate.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              ` : ''}

              <p style="margin: 0; font-size: 14px; color: #666;">
                If you have any questions, please don't hesitate to reach out.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #666;">
                <strong style="color: ${brandColor};">${business.name}</strong><br>
                ${business.phone ? `${business.phone}<br>` : ''}
                ${[business.address, business.city, business.state, business.zip_code].filter(Boolean).join(', ')}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email
    const msg = {
      to: estimate.customer_email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `Estimate from ${business.name}: ${estimate.title}`,
      html: emailHtml,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `${business.name.replace(/[^a-z0-9]/gi, '_')}_Estimate_${estimateNum(estimate.id)}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    await sgMail.send(msg);

    // Update estimate status to 'sent' if it was draft
    if (estimate.status === 'draft') {
      await adminClient
        .from('estimates')
        .update({ status: 'sent' })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending estimate email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
