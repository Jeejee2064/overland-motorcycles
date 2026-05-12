import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateReturnReminderEmailHTML } from '@/lib/emails/returnReminderEmail';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    /* ─────────────────────────────────────────────
       1. Target date: tomorrow in Panama time (UTC-5)
    ───────────────────────────────────────────── */
    const nowPanama = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Panama' })
    );
    const tomorrow = new Date(nowPanama);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetStr = tomorrow.toISOString().slice(0, 10);

    console.log(`🔄 Return reminder cron — target end_date: ${targetStr}`);

    /* ─────────────────────────────────────────────
       2. Fetch bookings returning tomorrow
    ───────────────────────────────────────────── */
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('end_date', targetStr)
      .in('status', ['confirmed', 'fully paid']);

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      console.log('✅ No returns tomorrow.');
      return NextResponse.json({ status: 'ok', sent: 0 });
    }

    console.log(`📋 Found ${bookings.length} return(s) on ${targetStr}`);

    /* ─────────────────────────────────────────────
       3. Send a return reminder for each booking
    ───────────────────────────────────────────── */
    const results = [];

    for (const booking of bookings) {
      try {
        const [{ data: bookingMotorcycles }, { data: bookingRiders }] = await Promise.all([
          supabase
            .from('booking_motorcycles')
            .select('motorcycle_id, motorcycles ( id, name, model )')
            .eq('booking_id', booking.id),
          supabase
            .from('booking_riders')
            .select('first_name, last_name, email, phone')
            .eq('booking_id', booking.id)
            .order('rider_index'),
        ]);

        const assigned = (bookingMotorcycles || []).map(bm => bm.motorcycles).filter(Boolean);

        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to:      ['overlandmotorcycles@gmail.com'],
          subject: `🔄 Return Tomorrow — ${booking.first_name} ${booking.last_name} (${booking.end_date})`,
          html:    generateReturnReminderEmailHTML(booking, assigned, bookingRiders || []),
        });

        console.log(`✅ Return reminder sent for booking ${booking.id} — ${booking.first_name} ${booking.last_name}`);
        results.push({ id: booking.id, status: 'sent' });

      } catch (err) {
        console.error(`❌ Failed for booking ${booking.id}:`, err);
        results.push({ id: booking.id, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({ status: 'ok', sent: results.filter(r => r.status === 'sent').length, results });

  } catch (err) {
    console.error('❌ Return reminder cron fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
