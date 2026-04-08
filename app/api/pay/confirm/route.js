import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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
    const { bookingId, type, codOper, totalPaid } = await request.json();

    if (!bookingId || !type || !codOper) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const modelLabel = MODEL_LABELS[booking.motorcycle_model] || booking.motorcycle_model;

    
if (type === 'initial') {
  if (booking.payment_status === 'paid' && booking.webhook_received) {
    return NextResponse.json({ success: true });
  }
  await supabase
    .from('bookings')
    .update({
      payment_status:   'paid',
      webhook_received: true,
      status:           'confirmed',
    })
    .eq('id', bookingId);

  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL,
      to:      [booking.email],
      subject: '✅ Initial Payment Received',
      html:    `<p>Hi ${booking.first_name}, your initial payment of $${parseFloat(booking.down_payment).toFixed(2)} has been received. Your booking is now confirmed!</p>`,
    });
  } catch (e) { console.error('Initial client email error', e); }

  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL,
      to:      ['overlandmotorcycles@gmail.com'],
      subject: `💳 INITIAL PAID — ${booking.first_name} ${booking.last_name}`,
      html:    `<p>Initial payment received.<br/>Booking: ${bookingId}<br/>Amount: $${parseFloat(booking.down_payment).toFixed(2)}<br/>Transaction: ${codOper}</p>`,
    });
  } catch (e) { console.error('Initial internal email error', e); }

  return NextResponse.json({ success: true });
}
    /* ── FULL (initial + balance en un seul paiement) ── */
    if (type === 'full') {
      if (booking.paid) return NextResponse.json({ success: true });

      await supabase
        .from('bookings')
        .update({
          paid:                   true,
          payment_status:         'paid',
          webhook_received:       true,
          balance_status:         'captured',
          balance_transaction_id: codOper,
          balance_paid_at:        new Date().toISOString(),
          status:                 'confirmed',
        })
        .eq('id', bookingId);

      try {
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL,
          to:      [booking.email],
          subject: `✅ Full Payment Received — ${modelLabel}`,
          html:    `<p>Hi ${booking.first_name}, we have received your full payment of $${totalPaid}. Your booking is confirmed. See you soon!</p>`,
        });
      } catch (e) { console.error('Full payment client email error', e); }

      try {
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL,
          to:      ['overlandmotorcycles@gmail.com'],
          subject: `💰 FULL PAYMENT — ${booking.first_name} ${booking.last_name}`,
          html:    `<p>Full rental payment received.<br/>Booking: ${bookingId}<br/>Amount: $${totalPaid}<br/>Transaction: ${codOper}</p>`,
        });
      } catch (e) { console.error('Full payment internal email error', e); }

      return NextResponse.json({ success: true });
    }

    /* ── AUTH ── */
    if (type === 'auth') {
      const newAuthCount = (booking.auth_count || 0) + 1;
      const allAuthsDone = newAuthCount >= booking.bike_quantity;

      await supabase
        .from('bookings')
        .update({
          auth_count:          newAuthCount,
          auth_status:         allAuthsDone ? 'authorized' : 'pending',
          auth_transaction_id: codOper,
          auth_paid_at:        allAuthsDone ? new Date().toISOString() : booking.auth_paid_at,
        })
        .eq('id', bookingId);

      try {
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL,
          to:      [booking.email],
          subject: allAuthsDone ? '✅ Security Deposit(s) Authorized' : `✅ Security Deposit #${newAuthCount} Authorized`,
          html:    `<p>Hi ${booking.first_name}, your $1,000 security deposit${booking.bike_quantity > 1 ? ` #${newAuthCount}` : ''} has been authorized.${allAuthsDone && booking.bike_quantity > 1 ? ' All deposits are now authorized!' : ''}</p>`,
        });
      } catch (e) { console.error('Auth client email error', e); }

      try {
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL,
          to:      ['overlandmotorcycles@gmail.com'],
          subject: `🔐 AUTH ${newAuthCount}/${booking.bike_quantity} — ${booking.first_name} ${booking.last_name}`,
          html:    `<p>Auth ${newAuthCount}/${booking.bike_quantity} confirmed.<br/>Booking: ${bookingId}<br/>Transaction: ${codOper}</p>`,
        });
      } catch (e) { console.error('Auth internal email error', e); }

      const { data: fresh } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      if (allAuthsDone && fresh?.balance_status === 'captured') {
        await sendFullyPaidRecap(fresh, modelLabel, codOper, fresh.balance_transaction_id);
      }

      return NextResponse.json({ success: true });
    }

    /* ── BALANCE ── */
    if (type === 'balance') {
      if (booking.balance_status === 'captured') return NextResponse.json({ success: true });

      await supabase
        .from('bookings')
        .update({
          balance_status:         'captured',
          balance_transaction_id: codOper,
          balance_paid_at:        new Date().toISOString(),
          paid:                   true,
        })
        .eq('id', bookingId);

      try {
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL,
          to:      [booking.email],
          subject: `✅ Full Payment Received — ${modelLabel}`,
          html:    `<p>Hi ${booking.first_name}, we have received your full payment. Your booking is now complete. See you soon!</p>`,
        });
      } catch (e) { console.error('Balance client email error', e); }

      try {
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL,
          to:      ['overlandmotorcycles@gmail.com'],
          subject: `💰 BALANCE PAID — ${booking.first_name} ${booking.last_name}`,
          html:    `<p>Remaining balance paid.<br/>Booking: ${bookingId}<br/>Amount: $${totalPaid}<br/>Transaction: ${codOper}</p>`,
        });
      } catch (e) { console.error('Balance internal email error', e); }

      const allAuthsDone = (booking.auth_count || 0) >= booking.bike_quantity;
      if (allAuthsDone) {
        await sendFullyPaidRecap(booking, modelLabel, booking.auth_transaction_id, codOper);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendFullyPaidRecap(booking, modelLabel, authTransactionId, balanceTransactionId) {
  const balanceAmount = (parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2);
  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL,
      to:      ['overlandmotorcycles@gmail.com'],
      subject: `🏍️ ALL PAYMENTS CLEARED — ${booking.first_name} ${booking.last_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#111827;padding:24px;text-align:center;">
            <h1 style="color:#facc15;margin:0;font-size:22px;">All Payments Cleared ✅</h1>
          </div>
          <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">
            <h2 style="color:#111827;margin:0 0 16px;">${booking.first_name} ${booking.last_name}</h2>
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#6b7280;padding:6px 0;">Motorcycle</td><td style="font-weight:600;text-align:right;">${modelLabel}</td></tr>
              <tr><td style="color:#6b7280;padding:6px 0;">Bikes</td><td style="font-weight:600;text-align:right;">${booking.bike_quantity}</td></tr>
              <tr><td style="color:#6b7280;padding:6px 0;">Dates</td><td style="font-weight:600;text-align:right;">${booking.start_date} → ${booking.end_date}</td></tr>
              <tr><td style="color:#6b7280;padding:6px 0;">Email</td><td style="font-weight:600;text-align:right;">${booking.email}</td></tr>
              <tr><td style="color:#6b7280;padding:6px 0;">Phone</td><td style="font-weight:600;text-align:right;">${booking.phone}</td></tr>
              <tr style="border-top:2px solid #e5e7eb;">
                <td style="color:#6b7280;padding:10px 0 6px;">Initial Payment (50%)</td>
                <td style="font-weight:600;text-align:right;color:#16a34a;padding:10px 0 6px;">$${parseFloat(booking.down_payment).toFixed(2)} ✓</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Security Deposit${booking.bike_quantity > 1 ? 's' : ''} (${booking.bike_quantity} × $1,000)</td>
                <td style="font-weight:600;text-align:right;color:#16a34a;">$${(booking.bike_quantity * 1000).toFixed(2)} ✓</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Remaining Balance</td>
                <td style="font-weight:600;text-align:right;color:#16a34a;">$${balanceAmount} ✓</td>
              </tr>
              <tr style="border-top:2px solid #111827;">
                <td style="font-weight:700;padding:10px 0 0;font-size:15px;">Total Collected</td>
                <td style="font-weight:900;text-align:right;color:#111827;font-size:18px;padding:10px 0 0;">$${(parseFloat(booking.down_payment) + booking.bike_quantity * 1000 + parseFloat(balanceAmount)).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div style="padding:16px;background:#111827;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Auth TX: ${authTransactionId} | Balance TX: ${balanceTransactionId}</p>
          </div>
        </div>`,
    });
  } catch (e) { console.error('Fully paid recap error', e); }
}