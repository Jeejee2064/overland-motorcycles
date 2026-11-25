// app/api/contact-notification/route.js
// Sends the admin an email with the full content of a new contact-form message.
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #FACC15; padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0; color: #1F2937;">📩 New contact message</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px;">
          <p><strong>Name:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
          <p><strong>Phone:</strong> ${esc(phone) || '—'}</p>
          <p><strong>Message:</strong></p>
          <div style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-left: 4px solid #FACC15; border-radius: 6px;">${esc(message)}</div>
        </div>
      </div>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: ['overlandmotorcycles@gmail.com'],
      replyTo: email,
      subject: `📩 New message from ${name}`,
      html,
    });

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    console.error('❌ contact-notification error:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
