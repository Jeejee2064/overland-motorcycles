import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateBookingReminderEmailHTML } from '@/lib/emails/bookingReminderEmail';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    /* ─────────────────────────────────────────────
       1. Compute the target date: today + 2 days
          in Panama time (UTC-5, no DST)
    ───────────────────────────────────────────── */
    const nowPanama = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Panama' })
    );
    const targetDate = new Date(nowPanama);
    targetDate.setDate(targetDate.getDate() + 2);
    const targetStr = targetDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

    console.log(`🕐 Cron running for target date: ${targetStr}`);

    /* ─────────────────────────────────────────────
       2. Fetch bookings starting on the target date
          that are confirmed or fully paid
    ───────────────────────────────────────────── */
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('start_date', targetStr)
      .in('status', ['confirmed', 'fully paid']);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      console.log('✅ No bookings starting in 2 days.');
      return NextResponse.json({ status: 'ok', sent: 0 });
    }

    console.log(`📋 Found ${bookings.length} booking(s) starting on ${targetStr}`);

    /* ─────────────────────────────────────────────
       3. Send a reminder email for each booking
    ───────────────────────────────────────────── */
    const results = [];

    for (const booking of bookings) {
      try {
        // Fetch assigned motorcycles for this booking
        const { data: bookingMotorcycles } = await supabase
          .from('booking_motorcycles')
          .select('motorcycle_id, motorcycles ( id, name, model )')
          .eq('booking_id', booking.id);

        const assigned = (bookingMotorcycles || [])
          .map(bm => bm.motorcycles)
          .filter(Boolean);

        // Compute duration_days if not stored
        const start = new Date(booking.start_date + 'T00:00:00');
        const end   = new Date(booking.end_date   + 'T00:00:00');
        const duration_days = Math.ceil((end - start) / 86400000) + 1;

        const bookingWithDuration = { ...booking, duration_days };

        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to:      ['overlandmotorcycles@gmail.com'],
          subject: `⏰ Pickup Tomorrow+1 — ${booking.first_name} ${booking.last_name} (${booking.start_date})`,
          html:    generateBookingReminderEmailHTML(bookingWithDuration, assigned),
        });

        console.log(`✅ Reminder sent for booking ${booking.id} — ${booking.first_name} ${booking.last_name}`);
        results.push({ id: booking.id, status: 'sent' });

      } catch (err) {
        console.error(`❌ Failed to send reminder for booking ${booking.id}:`, err);
        results.push({ id: booking.id, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({ status: 'ok', sent: results.filter(r => r.status === 'sent').length, results });

  } catch (err) {
    console.error('❌ Cron job fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}