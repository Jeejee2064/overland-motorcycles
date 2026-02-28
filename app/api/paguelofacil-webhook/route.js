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
    const data = await request.json();
    console.log('📥 PaguéloFácil webhook received:', JSON.stringify(data, null, 2));

    /* -------------------------------------------------
       1️⃣ Extract fields
    --------------------------------------------------*/
    const {
      status,
      codOper,
      messageSys,
      totalPay,
      email,
      customFields = {},
    } = data;

    const bookingId      = customFields['Booking ID'];
    const securityToken  = customFields['Security Token'];

    if (!bookingId || !securityToken) {
      console.error('❌ Missing booking ID or token', customFields);
      return NextResponse.json({ error: 'Missing booking ID or token' }, { status: 400 });
    }

    /* -------------------------------------------------
       2️⃣ Fetch booking + validate token
    --------------------------------------------------*/
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('paguelofacil_token', securityToken)
      .single();

    if (fetchError || !booking) {
      console.error('❌ Booking not found or token mismatch');
      return NextResponse.json({ error: 'Invalid booking' }, { status: 404 });
    }

    /* -------------------------------------------------
       3️⃣ Idempotency guard
    --------------------------------------------------*/
    if (booking.webhook_received) {
      console.log('⚠️ Webhook already processed:', bookingId);
      return NextResponse.json({ status: 'already_processed' });
    }

    /* -------------------------------------------------
       4️⃣ Declined payment
    --------------------------------------------------*/
    const approved = status === 1 || status === '1';

    if (!approved) {
      await supabase
        .from('bookings')
        .update({
          status:                       'failed',
          payment_status:               'failed',
          webhook_received:             true,
          pending_verification:         false,
          paguelofacil_transaction_id:  codOper,
        })
        .eq('id', bookingId);

      return NextResponse.json({ status: 'payment_failed', message: messageSys });
    }

    /* -------------------------------------------------
       5️⃣ Confirm booking
    --------------------------------------------------*/
    await supabase
      .from('bookings')
      .update({
        status:                       'confirmed',
        payment_status:               'paid',
        paid:                         false,   // remaining paid at pickup
        webhook_received:             true,
        pending_verification:         false,
        paguelofacil_transaction_id:  codOper,
      })
      .eq('id', bookingId);

    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    /* -------------------------------------------------
       6️⃣ Model-aware motorcycle assignment
    --------------------------------------------------*/
    const motorcycleModel = updatedBooking.motorcycle_model || 'Himalayan';
    const startDate       = new Date(updatedBooking.start_date);
    const endDate         = new Date(updatedBooking.end_date);

    // Find all motorcycle IDs already booked for the overlapping period
    // (for ANY model — we don't want to double-assign the same physical bike)
    const { data: overlappingBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        booking_motorcycles ( motorcycle_id )
      `)
      .in('status', ['confirmed', 'paid']);

    const bookedMotorcycleIds = new Set();

    overlappingBookings?.forEach(b => {
      if (b.id === bookingId) return;

      const bStart = new Date(b.start_date);
      const bEnd   = new Date(b.end_date);

      if (startDate <= bEnd && endDate >= bStart) {
        b.booking_motorcycles?.forEach(m => bookedMotorcycleIds.add(m.motorcycle_id));
      }
    });

    // Fetch only motorcycles matching the booked model
    const { data: modelMotorcycles } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('model', motorcycleModel)
      .eq('is_available', true)
      .order('name');

    const available = (modelMotorcycles || []).filter(
      m => !bookedMotorcycleIds.has(m.id)
    );

    const assigned = available.slice(0, updatedBooking.bike_quantity);

    if (assigned.length < updatedBooking.bike_quantity) {
      // Log the shortage but don't fail the webhook — payment already went through.
      // Admin email will flag this.
      console.error(
        `⚠️ Only ${assigned.length} of ${updatedBooking.bike_quantity} ${motorcycleModel} bikes could be assigned for booking ${bookingId}`
      );
    }

    for (const moto of assigned) {
      await supabase.from('booking_motorcycles').insert({
        booking_id:    bookingId,
        motorcycle_id: moto.id,
      });
    }

    /* -------------------------------------------------
       7️⃣ Emails
    --------------------------------------------------*/
    const remainingPayment = updatedBooking.total_price - updatedBooking.down_payment;
    const modelLabel       = MODEL_LABELS[motorcycleModel] || motorcycleModel;
    const shortageWarning  = assigned.length < updatedBooking.bike_quantity;

    try {
      await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to:      [updatedBooking.email],
        subject: `🏍️ Booking Confirmed — ${modelLabel}`,
        html:    generateCustomerEmailHTML(updatedBooking, assigned, remainingPayment, modelLabel),
      });
    } catch (e) {
      console.error('❌ Customer email failed', e);
    }

    try {
      await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to:      ['overlandmotorcycles@gmail.com'],
        subject: `🚨 NEW BOOKING — ${updatedBooking.first_name} ${updatedBooking.last_name} — ${modelLabel}${shortageWarning ? ' ⚠️ BIKE SHORTAGE' : ''}`,
        html:    generateCompanyEmailHTML(updatedBooking, assigned, remainingPayment, modelLabel, shortageWarning),
      });
    } catch (e) {
      console.error('❌ Admin email failed', e);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ status: 'success', bookingId, transactionId: codOper });

  } catch (err) {
    console.error('❌ Webhook fatal error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}



