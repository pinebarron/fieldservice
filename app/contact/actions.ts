'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const company = formData.get('company') as string;
  const category = formData.get('category') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !subject || !message) {
    return { error: 'Please fill in all required fields' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('contact_submissions')
    .insert({
      name,
      email,
      phone: phone || null,
      company: company || null,
      category: category || 'general',
      subject,
      message,
      status: 'new',
    });

  if (error) {
    console.error('Error saving contact submission:', error);
    return { error: 'Failed to submit your message. Please try again.' };
  }

  // TODO: Send email notification when email is configured
  // See docs/EMAIL_SETUP.md for configuration instructions

  return { success: true };
}
