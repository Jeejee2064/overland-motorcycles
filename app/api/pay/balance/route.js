import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { bookingId, mode = 'balance' } = await request.json();
    // mode: 'balance' = remaining 50%, 'full' = total, 'initial' = down_payment only

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.balance_status === 'captured' && booking.paid) {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    let amount, desc, paymentType;

    if (mode === 'full') {
      amount      = parseFloat(booking.total_price).toFixed(2);
      desc        = `Full Payment - ${booking.first_name} ${booking.last_name}`;
      paymentType = 'FULL';
    } else if (mode === 'initial') {
      amount      = parseFloat(booking.down_payment).toFixed(2);
      desc        = `Initial Payment (50%) - ${booking.first_name} ${booking.last_name}`;
      paymentType = 'INITIAL';
    } else {
      amount      = (parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2);
      desc        = `Remaining Balance - ${booking.first_name} ${booking.last_name}`;
      paymentType = 'BALANCE';
    }

    const returnUrlPlain = `${process.env.NEXT_PUBLIC_BASE_URL}/en/pay/balance-success?bookingId=${bookingId}&mode=${mode}`;
    const returnUrlHex   = Buffer.from(returnUrlPlain).toString('hex');

    const customFields = [
      { id: 'bookingId',   nameOrLabel: 'Booking ID',   value: bookingId },
      { id: 'paymentType', nameOrLabel: 'Payment Type', value: paymentType },
    ];
    const customFieldsHex = Buffer.from(JSON.stringify(customFields)).toString('hex');

    const pagueloFacilData = {
      CCLW:       process.env.PAGUELOFACIL_CCLW,
      CMTN:       amount,
      CDSC:       desc,
      RETURN_URL: returnUrlHex,
      PF_CF:      customFieldsHex,
      PARM_1:     bookingId,
      EXPIRES_IN: 3600,
    };

    const linkDeamonUrl = process.env.NODE_ENV === 'production'
      ? 'https://secure.paguelofacil.com/LinkDeamon.cfm'
      : 'https://sandbox.paguelofacil.com/LinkDeamon.cfm';

    const formBody = Object.keys(pagueloFacilData)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(pagueloFacilData[key])}`)
      .join('&');

    const response = await fetch(linkDeamonUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
      body:    formBody,
    });

    const data = await response.json();

    if (!data.success || !data.data?.url) {
      return NextResponse.json({ error: data.message || 'Failed to create link' }, { status: 400 });
    }

    // ← seul changement : update différent selon le mode
    if (mode === 'initial') {
      await supabase
        .from('bookings')
        .update({ payment_status: 'pending' })
        .eq('id', bookingId);
    } else {
      await supabase
        .from('bookings')
        .update({ balance_status: 'pending', balance_link_sent_at: new Date().toISOString() })
        .eq('id', bookingId);
    }

    return NextResponse.json({ url: data.data.url });

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}