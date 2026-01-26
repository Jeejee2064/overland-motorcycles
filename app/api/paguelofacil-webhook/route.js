import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    console.log('🔥 PAGUELOFACIL WEBHOOK HIT');

    const contentType = request.headers.get('content-type') || '';
    let payload = {};
    let rawBody = '';

    // ===============================
    // 1️⃣ Parse payload (JSON + legacy)
    // ===============================
    if (contentType.includes('application/json')) {
      payload = await request.json();
      rawBody = JSON.stringify(payload);
    } else {
      rawBody = await request.text();
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params.entries());
    }

    console.log('📥 Webhook payload:', payload);

    // ===============================
    // 2️⃣ Normalize fields (doc-safe)
    // ===============================
    const bookingId =
      payload.PARM_1 ||
      payload.parm_1 ||
      payload.orderId ||
      null;

    const transactionId =
      payload.codOper ||
      payload.Oper ||
      null;

    const status =
      payload.status ??
      (payload.Estado === 'Aprobada' ? 1 : 0);

    const totalPay =
      Number(payload.totalPay || payload.TotalPagado || 0);

    const isApproved = Number(status) === 1 && totalPay > 0;

    if (!bookingId) {
      console.error('❌ Missing bookingId (PARM_1)');
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // ===============================
    // 3️⃣ Fetch booking + idempotency
    // ===============================
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, webhook_received')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      console.error('❌ Booking not found:', bookingId);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.webhook_received) {
      console.log('⚠️ Duplicate webhook ignored:', bookingId);
      return NextResponse.json({ status: 'already_processed' });
    }

    // ===============================
    // 4️⃣ Update booking (FAST)
    // ===============================
    await supabase
      .from('bookings')
      .update({
        payment_status: isApproved ? 'paid' : 'failed',
        status: isApproved ? 'confirmed' : 'failed',
        webhook_received: true,
        paguelofacil_transaction_id: transactionId,
        paguelofacil_raw_webhook: rawBody,
      })
      .eq('id', bookingId);

    console.log(
      isApproved
        ? '✅ Payment approved'
        : '❌ Payment failed',
      bookingId
    );

    // ===============================
    // 5️⃣ Respond FAST (PF requirement)
    // ===============================
    return NextResponse.json({
      ok: true,
      bookingId,
      transactionId,
      approved: isApproved,
    });

  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
