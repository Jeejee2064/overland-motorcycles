import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const meta = session.metadata;

    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          first_name: meta.firstName,
          last_name: meta.lastName,
          email: meta.email,
          phone: meta.phone || '',
          country: meta.country || '', // ✅ added
          start_date: meta.startDate,
          end_date: meta.endDate,
          bike_quantity: parseInt(meta.bikeQuantity),
          down_payment: parseFloat(meta.downPayment),
          total_price: parseFloat(meta.totalRentalPrice),
          deposit: parseFloat(meta.totalDeposit),
          status: 'confirmed',
          payment_status: 'paid',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ booking: data });
  } catch (error) {
    console.error('❌ verify-payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
