import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateCustomerEmailHTML } from '@/lib/emails/customerEmail';
import { generateCompanyEmailHTML } from '@/lib/emails/companyEmail';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

export async function POST(request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    /* -------------------------------------------------
       1️⃣ Fetch booking
    --------------------------------------------------*/
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    /* -------------------------------------------------
       2️⃣ Fetch assigned motorcycles
    --------------------------------------------------*/
    const { data: bookingMotorcycles } = await supabase
      .from('booking_motorcycles')
      .select('motorcycle_id, motorcycles ( id, name, model )')
      .eq('booking_id', bookingId);

    const assigned = (bookingMotorcycles || []).map(bm => bm.motorcycles).filter(Boolean);

    /* -------------------------------------------------
       3️⃣ Build email variables (same as webhook)
    --------------------------------------------------*/
    const motorcycleModel  = booking.motorcycle_model || 'Himalayan';
    const modelLabel       = MODEL_LABELS[motorcycleModel] || motorcycleModel;
    const remainingPayment = booking.total_price - booking.down_payment;

    /* -------------------------------------------------
       4️⃣ Send customer confirmation email
    --------------------------------------------------*/
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to:      [booking.email],
      subject: `🏍️ Booking Confirmed — ${modelLabel}`,
      html:    generateCustomerEmailHTML(booking, assigned, remainingPayment, modelLabel),
    });

    /* -------------------------------------------------
       5️⃣ Send admin notification email
    --------------------------------------------------*/
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to:      ['overlandmotorcycles@gmail.com'],
      subject: `🚨 NEW BOOKING (manual) — ${booking.first_name} ${booking.last_name} — ${modelLabel}`,
      html:    generateCompanyEmailHTML(booking, assigned, remainingPayment, modelLabel, false),
    });

    console.log(`✅ Confirmation email sent manually for booking ${bookingId}`);
    return NextResponse.json({ status: 'success', bookingId });

  } catch (err) {
    console.error('❌ send-confirmation-mail error:', err);
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 });
  }
}