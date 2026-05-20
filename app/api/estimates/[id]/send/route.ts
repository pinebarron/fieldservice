import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import sgMail from '@sendgrid/mail';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

function n(v: string | number | null | undefined) {
  const x = parseFloat(String(v ?? '0'));
  return isNaN(x) ? 0 : x;
}

function fmt(v: number) {
  return '$' + v.toFixed(2);
}

function estimateNum(id: string) {
  return 'EST-' + id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return rgb(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }
  return rgb(0.18, 0.35, 0.24);
}

async function generatePDF(estimate: any, items: any[], business: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const brandColor = hexToRgb(business.brand_color || '#2d5a3d');
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.95, 0.95, 0.95);

  const subtotal = items.reduce((sum: number, li: any) => sum + n(li.quantity) * n(li.unit_price), 0);
  const discount = n(estimate.discount_amount);
  const taxRate = n(estimate.tax_rate);
  const tax = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + tax;

  let y = height - 50;

  // Header
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: brandColor });
  page.drawText(business.name, { x: 50, y: height - 45, size: 22, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`Estimate ${estimateNum(estimate.id)}`, { x: 50, y: height - 65, size: 10, font, color: rgb(1, 1, 1) });

  y = height - 120;

  // Customer
  page.drawText('Customer Information', { x: 50, y, size: 12, font: fontBold, color: brandColor });
  y -= 20;
  page.drawText(`Name: ${estimate.customer_name}`, { x: 50, y, size: 10, font, color: black });
  y -= 15;
  if (estimate.customer_email) {
    page.drawText(`Email: ${estimate.customer_email}`, { x: 50, y, size: 10, font, color: black });
    y -= 15;
  }
  if (estimate.customer_phone) {
    page.drawText(`Phone: ${estimate.customer_phone}`, { x: 50, y, size: 10, font, color: black });
    y -= 15;
  }
  y -= 15;

  // Details
  page.drawText('Estimate Details', { x: 50, y, size: 12, font: fontBold, color: brandColor });
  y -= 20;
  page.drawText(`Title: ${estimate.title}`, { x: 50, y, size: 10, font, color: black });
  y -= 15;
  if (estimate.description) {
    page.drawText(`Description: ${estimate.description.substring(0, 80)}`, { x: 50, y, size: 10, font, color: black });
    y -= 15;
  }
  page.drawText(`Status: ${estimate.status}`, { x: 50, y, size: 10, font, color: black });
  y -= 30;

  // Line Items
  page.drawText('Line Items', { x: 50, y, size: 12, font: fontBold, color: brandColor });
  y -= 25;

  page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 20, color: lightGray });
  page.drawText('Description', { x: 55, y, size: 9, font: fontBold, color: black });
  page.drawText('Qty', { x: 320, y, size: 9, font: fontBold, color: black });
  page.drawText('Price', { x: 380, y, size: 9, font: fontBold, color: black });
  page.drawText('Total', { x: 470, y, size: 9, font: fontBold, color: black });
  y -= 25;

  if (items.length === 0) {
    page.drawText('No line items', { x: 55, y, size: 9, font, color: gray });
    y -= 20;
  } else {
    for (const item of items) {
      const lineTotal = n(item.quantity) * n(item.unit_price);
      page.drawText((item.description || '').substring(0, 40), { x: 55, y, size: 9, font, color: black });
      page.drawText(String(item.quantity), { x: 320, y, size: 9, font, color: black });
      page.drawText(fmt(n(item.unit_price)), { x: 380, y, size: 9, font, color: black });
      page.drawText(fmt(lineTotal), { x: 470, y, size: 9, font, color: black });
      y -= 18;
    }
  }

  y -= 20;
  const totalsX = 380;

  page.drawText('Subtotal:', { x: totalsX, y, size: 10, font, color: black });
  page.drawText(fmt(subtotal), { x: 470, y, size: 10, font, color: black });
  y -= 15;

  if (discount > 0) {
    page.drawText('Discount:', { x: totalsX, y, size: 10, font, color: black });
    page.drawText('-' + fmt(discount), { x: 470, y, size: 10, font, color: rgb(0.09, 0.64, 0.29) });
    y -= 15;
  }

  if (taxRate > 0) {
    page.drawText(`Tax (${taxRate}%):`, { x: totalsX, y, size: 10, font, color: black });
    page.drawText(fmt(tax), { x: 470, y, size: 10, font, color: black });
    y -= 15;
  }

  page.drawLine({ start: { x: totalsX, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 1, color: brandColor });
  y -= 5;
  page.drawText('Total:', { x: totalsX, y, size: 14, font: fontBold, color: brandColor });
  page.drawText(fmt(total), { x: 470, y, size: 14, font: fontBold, color: brandColor });

  // Footer
  page.drawLine({ start: { x: 50, y: 50 }, end: { x: 545, y: 50 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
  page.drawText(business.name, { x: 50, y: 35, size: 9, font, color: gray });
  if (business.phone) {
    page.drawText(business.phone, { x: 50, y: 22, size: 9, font, color: gray });
  }

  return pdfDoc.save();
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

    const { data: lineItems } = await adminClient
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', id)
      .order('sort_order');

    const items = lineItems || [];

    const subtotal = items.reduce((sum, li) => sum + n(li.quantity) * n(li.unit_price), 0);
    const discount = n(estimate.discount_amount);
    const tax = (subtotal - discount) * (n(estimate.tax_rate) / 100);
    const total = subtotal - discount + tax;

    const pdfBytes = await generatePDF(estimate, items, business);
    const pdfBuffer = Buffer.from(pdfBytes);

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
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${business.name}</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Estimate ${estimateNum(estimate.id)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Hi ${estimate.customer_name},</p>
              ${customMessage ? `<p style="margin: 0 0 20px 0; font-size: 15px; color: #555; line-height: 1.6;">${customMessage}</p>` : ''}
              <p style="margin: 0 0 30px 0; font-size: 15px; color: #555; line-height: 1.6;">Please find attached your estimate for <strong>${estimate.title}</strong>.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Estimate Summary</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Subtotal</td>
                        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${fmt(subtotal)}</td>
                      </tr>
                      ${discount > 0 ? `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Discount</td><td style="padding: 8px 0; color: #16a34a; font-size: 14px; text-align: right;">-${fmt(discount)}</td></tr>` : ''}
                      ${n(estimate.tax_rate) > 0 ? `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Tax (${estimate.tax_rate}%)</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${fmt(tax)}</td></tr>` : ''}
                      <tr>
                        <td style="padding: 12px 0 0 0; color: #333; font-size: 18px; font-weight: 600; border-top: 2px solid #e5e7eb;">Total</td>
                        <td style="padding: 12px 0 0 0; color: ${brandColor}; font-size: 18px; font-weight: 600; text-align: right; border-top: 2px solid #e5e7eb;">${fmt(total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${estimate.valid_until ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #666;"><strong>Valid until:</strong> ${new Date(estimate.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''}
              <p style="margin: 0; font-size: 14px; color: #666;">If you have any questions, please don't hesitate to reach out.</p>
            </td>
          </tr>
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
</html>`;

    await sgMail.send({
      to: estimate.customer_email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `Estimate from ${business.name}: ${estimate.title}`,
      html: emailHtml,
      attachments: [{
        content: pdfBuffer.toString('base64'),
        filename: `${business.name.replace(/[^a-z0-9]/gi, '_')}_Estimate_${estimateNum(estimate.id)}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment' as const,
      }],
    });

    if (estimate.status === 'draft') {
      await adminClient.from('estimates').update({ status: 'sent' }).eq('id', id);
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
