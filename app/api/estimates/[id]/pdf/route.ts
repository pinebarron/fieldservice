import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function estimateNum(id: string) {
  return 'EST-' + id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function n(v: string | number | null | undefined) {
  const x = parseFloat(String(v ?? '0'));
  return isNaN(x) ? 0 : x;
}

function fmt(v: number) {
  return '$' + v.toFixed(2);
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
  return rgb(0.18, 0.35, 0.24); // default forest green
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

    const items = lineItems || [];

    // Calculate totals
    const subtotal = items.reduce((sum, li) => sum + n(li.quantity) * n(li.unit_price), 0);
    const discount = n(estimate.discount_amount);
    const taxRate = n(estimate.tax_rate);
    const tax = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + tax;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const brandColor = hexToRgb(business.brand_color || '#2d5a3d');
    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.95, 0.95);

    let y = height - 50;

    // Header background
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: brandColor,
    });

    // Business name
    page.drawText(business.name, {
      x: 50,
      y: height - 45,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Estimate number
    page.drawText(`Estimate ${estimateNum(estimate.id)}`, {
      x: 50,
      y: height - 65,
      size: 10,
      font: font,
      color: rgb(1, 1, 1),
    });

    y = height - 120;

    // Customer Information section
    page.drawText('Customer Information', {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: brandColor,
    });
    y -= 20;

    page.drawText(`Name: ${estimate.customer_name}`, {
      x: 50,
      y,
      size: 10,
      font: font,
      color: black,
    });
    y -= 15;

    if (estimate.customer_email) {
      page.drawText(`Email: ${estimate.customer_email}`, {
        x: 50,
        y,
        size: 10,
        font: font,
        color: black,
      });
      y -= 15;
    }

    if (estimate.customer_phone) {
      page.drawText(`Phone: ${estimate.customer_phone}`, {
        x: 50,
        y,
        size: 10,
        font: font,
        color: black,
      });
      y -= 15;
    }

    y -= 15;

    // Estimate Details section
    page.drawText('Estimate Details', {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: brandColor,
    });
    y -= 20;

    page.drawText(`Title: ${estimate.title}`, {
      x: 50,
      y,
      size: 10,
      font: font,
      color: black,
    });
    y -= 15;

    if (estimate.description) {
      page.drawText(`Description: ${estimate.description.substring(0, 80)}${estimate.description.length > 80 ? '...' : ''}`, {
        x: 50,
        y,
        size: 10,
        font: font,
        color: black,
      });
      y -= 15;
    }

    page.drawText(`Status: ${estimate.status}`, {
      x: 50,
      y,
      size: 10,
      font: font,
      color: black,
    });
    y -= 30;

    // Line Items section
    page.drawText('Line Items', {
      x: 50,
      y,
      size: 12,
      font: fontBold,
      color: brandColor,
    });
    y -= 25;

    // Table header
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: 495,
      height: 20,
      color: lightGray,
    });

    page.drawText('Description', { x: 55, y, size: 9, font: fontBold, color: black });
    page.drawText('Qty', { x: 320, y, size: 9, font: fontBold, color: black });
    page.drawText('Price', { x: 380, y, size: 9, font: fontBold, color: black });
    page.drawText('Total', { x: 470, y, size: 9, font: fontBold, color: black });
    y -= 25;

    // Line items
    if (items.length === 0) {
      page.drawText('No line items', {
        x: 55,
        y,
        size: 9,
        font: font,
        color: gray,
      });
      y -= 20;
    } else {
      for (const item of items) {
        const lineTotal = n(item.quantity) * n(item.unit_price);
        const desc = (item.description || '').substring(0, 40);

        page.drawText(desc, { x: 55, y, size: 9, font: font, color: black });
        page.drawText(String(item.quantity), { x: 320, y, size: 9, font: font, color: black });
        page.drawText(fmt(n(item.unit_price)), { x: 380, y, size: 9, font: font, color: black });
        page.drawText(fmt(lineTotal), { x: 470, y, size: 9, font: font, color: black });
        y -= 18;
      }
    }

    y -= 20;

    // Totals
    const totalsX = 380;

    page.drawText('Subtotal:', { x: totalsX, y, size: 10, font: font, color: black });
    page.drawText(fmt(subtotal), { x: 470, y, size: 10, font: font, color: black });
    y -= 15;

    if (discount > 0) {
      page.drawText('Discount:', { x: totalsX, y, size: 10, font: font, color: black });
      page.drawText('-' + fmt(discount), { x: 470, y, size: 10, font: font, color: rgb(0.09, 0.64, 0.29) });
      y -= 15;
    }

    if (taxRate > 0) {
      page.drawText(`Tax (${taxRate}%):`, { x: totalsX, y, size: 10, font: font, color: black });
      page.drawText(fmt(tax), { x: 470, y, size: 10, font: font, color: black });
      y -= 15;
    }

    // Total line
    page.drawLine({
      start: { x: totalsX, y: y + 5 },
      end: { x: 545, y: y + 5 },
      thickness: 1,
      color: brandColor,
    });
    y -= 5;

    page.drawText('Total:', { x: totalsX, y, size: 14, font: fontBold, color: brandColor });
    page.drawText(fmt(total), { x: 470, y, size: 14, font: fontBold, color: brandColor });

    // Footer
    page.drawLine({
      start: { x: 50, y: 50 },
      end: { x: 545, y: 50 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText(business.name, {
      x: 50,
      y: 35,
      size: 9,
      font: font,
      color: gray,
    });

    if (business.phone) {
      page.drawText(business.phone, {
        x: 50,
        y: 22,
        size: 9,
        font: font,
        color: gray,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const filename = `${business.name.replace(/[^a-z0-9]/gi, '_')}_Estimate_${estimateNum(estimate.id)}.pdf`;

    return new NextResponse(pdfBytes, {
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
