# Email Setup for Customer Scorecards

This document outlines how to configure email sending for the customer scorecard feature.

## Current State

- Scorecard links are generated and copied to clipboard
- Manual sending via text/email by the user
- No automated email sending

## Prerequisites

### 1. Choose an Email Provider

| Provider | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Resend** | 3,000/month | Modern API, great DX, built for Next.js | Newer service |
| **SendGrid** | 100/day | Established, reliable | More complex setup |
| **Postmark** | 100/month | Best deliverability | Smaller free tier |
| **AWS SES** | 62,000/month (with EC2) | Cheapest at scale | Most complex setup |

**Recommendation:** Resend for simplicity and Next.js integration.

### 2. Add Customer Email Field

Add migration to capture customer email:

```sql
-- Migration: 0XX_customer_email.sql
ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
```

Update forms to capture email:
- `components/WorkLogForm.tsx` - Add email input
- `components/PropertyForm.tsx` - Add email input

## Implementation Steps

### Step 1: Install Email Package

```bash
npm install resend
```

### Step 2: Configure Environment Variables

Add to `.env.local` and Vercel environment variables:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**Note:** You'll need to verify your domain with Resend to send from your own email address. Otherwise, use their test domain for development.

### Step 3: Create Email Service

Create `lib/email.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendScorecardEmailParams {
  to: string;
  customerName: string;
  businessName: string;
  workType: string;
  serviceDate: string;
  feedbackUrl: string;
}

export async function sendScorecardEmail({
  to,
  customerName,
  businessName,
  workType,
  serviceDate,
  feedbackUrl,
}: SendScorecardEmailParams) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Crewatt <noreply@crewatt.com>',
    to,
    subject: `How did we do? - ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">${businessName}</h1>
          </div>

          <p>Hi ${customerName},</p>

          <p>Thank you for choosing ${businessName}! We recently completed <strong>${workType}</strong> service for you on ${serviceDate}.</p>

          <p>We'd love to hear about your experience. Your feedback helps us improve and serve you better.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${feedbackUrl}" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Rate Your Experience
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">This survey takes less than 1 minute to complete.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            Powered by <a href="https://crewatt.com" style="color: #16a34a;">Crewatt</a>
          </p>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Email send error:', error);
    throw new Error(error.message);
  }

  return data;
}
```

### Step 4: Update Send Scorecard Action

Modify `app/tech/actions.ts` to send email:

```typescript
import { sendScorecardEmail } from '@/lib/email';

export async function sendScorecard(jobId: string) {
  // ... existing code to generate token ...

  // After generating token, send email if customer email exists
  if (job.customer_email) {
    try {
      await sendScorecardEmail({
        to: job.customer_email,
        customerName: job.customer_name,
        businessName: business.name,
        workType: job.work_type,
        serviceDate: job.service_date,
        feedbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${token}`,
      });
    } catch (emailError) {
      console.error('Failed to send scorecard email:', emailError);
      // Don't fail the whole operation - link still works
    }
  }

  // ... rest of function ...
}
```

### Step 5: Add Environment Variable for App URL

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 6: Update UI

In `TechJobDetail.tsx`, update the button to show "Send Scorecard" instead of "Generate Link" when customer email is available, and "Generate Link" as fallback.

## Testing

1. Create a Resend account at https://resend.com
2. Get your API key from the dashboard
3. Use Resend's test domain initially (no domain verification needed)
4. Send test emails to your own address

## Domain Verification (Production)

To send from your own domain:

1. Go to Resend dashboard → Domains
2. Add your domain (e.g., `crewatt.com`)
3. Add the DNS records they provide (SPF, DKIM, etc.)
4. Wait for verification (usually minutes)
5. Update `EMAIL_FROM` to use your domain

## Cost Estimates

| Monthly Emails | Resend Cost |
|----------------|-------------|
| 0 - 3,000 | Free |
| 3,000 - 50,000 | $20/month |
| 50,000 - 100,000 | $40/month |

## Future Enhancements

- [ ] Email templates in database (customizable per business)
- [ ] SMS option via Twilio
- [ ] Automated sending X hours after job completion
- [ ] Follow-up reminder if no response in 3 days
- [ ] Unsubscribe handling
