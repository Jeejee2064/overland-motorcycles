// app/api/send-payment-link/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generatePaymentLinkEmailHTML } from '@/lib/emails/paymentLinkEmail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { bookingId, links } = await request.json();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL;
    const now  = new Date().toISOString();

    const urlLinks = (links || []).map(l => {
      let url;
      if (l.type === 'auth') {
        url = `${base}/en/pay/${bookingId}/auth?index=${l.index}`;
      } else if (l.type === 'full') {
        url = `${base}/en/pay/${bookingId}/balance?mode=full`;
      } else if (l.type === 'initial') {
        url = `${base}/en/pay/${bookingId}/balance?mode=initial`;
      } else {
        url = `${base}/en/pay/${bookingId}/balance`;
      }
      return { type: l.type, index: l.index, url };
    });

    // ── Build status update based on which link types are in this email ──
    const linkTypes = new Set((links || []).map(l => l.type));

    const statusUpdate = {
      payment_mail_sent_at: now,
    };

    if (linkTypes.has('initial')) {
      // Initial 50% down payment
      statusUpdate.payment_status = 'pending';
    }

    if (linkTypes.has('balance')) {
      // Remaining 50% balance
      statusUpdate.balance_status       = 'pending';
      statusUpdate.balance_link_sent_at = now;
    }

    if (linkTypes.has('full')) {
      // Full payment in one shot (initial + balance together)
      statusUpdate.payment_status       = 'pending';
      statusUpdate.balance_status       = 'pending';
      statusUpdate.balance_link_sent_at = now;
    }

    if (linkTypes.has('auth')) {
      // Security deposit authorization
      statusUpdate.auth_status       = 'pending';
      statusUpdate.auth_link_sent_at = now;
    }

    // Send email first — only persist to DB if it succeeds
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL,
      to:      [booking.email],
      subject: '🏍️ Action Required — Complete Your Booking',
      html:    generatePaymentLinkEmailHTML(booking, urlLinks),
    });

    await supabase
      .from('bookings')
      .update(statusUpdate)
      .eq('id', bookingId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[send-payment-link]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}