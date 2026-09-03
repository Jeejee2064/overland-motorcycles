import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { bookingId, index = 0 } = await request.json();

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

    // Bloque seulement si ce dépôt spécifique a déjà été autorisé
    if ((booking.auth_count || 0) > index) {
      return NextResponse.json({ error: 'Deposit already authorized for this bike' }, { status: 400 });
    }

    // Every payment-confirmation return trip must carry proof it's really this booking's
    // payment — reuse the token generated at booking creation, or mint one now for
    // bookings that never went through create-paguelofacil-payment (e.g. admin-created).
    let confirmToken = booking.paguelofacil_token;
    if (!confirmToken) {
      confirmToken = crypto.randomBytes(16).toString('hex');
      await supabase.from('bookings').update({ paguelofacil_token: confirmToken }).eq('id', bookingId);
    }

    const returnUrlPlain  = `${process.env.NEXT_PUBLIC_BASE_URL}/en/pay/auth-success?bookingId=${bookingId}&index=${index}&token=${confirmToken}`;
    const returnUrlHex    = Buffer.from(returnUrlPlain).toString('hex');

    const customFields = [
      { id: 'bookingId',   nameOrLabel: 'Booking ID',   value: bookingId },
      { id: 'paymentType', nameOrLabel: 'Payment Type', value: 'AUTH' },
      { id: 'authIndex',   nameOrLabel: 'Auth Index',   value: String(index) },
    ];
    const customFieldsHex = Buffer.from(JSON.stringify(customFields)).toString('hex');

    const pagueloFacilData = {
      CCLW:       process.env.PAGUELOFACIL_CCLW,
      TX_TYPE:    'AUTH',
      CMTN:       '1000.00',
      CDSC:       `Security Deposit${booking.bike_quantity > 1 ? ` #${index + 1}` : ''} - ${booking.first_name} ${booking.last_name}`,
      RETURN_URL: returnUrlHex,
      PF_CF:      customFieldsHex,
      PARM_1:     bookingId,
      EXPIRES_IN: 3600,
    };

    // /AUTH suffix is required so PagueloFacil generates a hold (AUTH) instead
    // of capturing the funds immediately, even with TX_TYPE=AUTH in the body.
    const linkDeamonUrl = process.env.NODE_ENV === 'production'
      ? 'https://secure.paguelofacil.com/LinkDeamon.cfm/AUTH'
      : 'https://sandbox.paguelofacil.com/LinkDeamon.cfm/AUTH';

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
      return NextResponse.json({ error: data.message || 'Failed to create AUTH link' }, { status: 400 });
    }

    await supabase
      .from('bookings')
      .update({ auth_status: 'pending', auth_link_sent_at: new Date().toISOString() })
      .eq('id', bookingId);

    return NextResponse.json({ url: data.data.url });

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}