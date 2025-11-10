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

    // 1️⃣ Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const meta = session.metadata;
    const startDate = new Date(meta.startDate);
    const endDate = new Date(meta.endDate);

    // 2️⃣ Create the booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          first_name: meta.firstName,
          last_name: meta.lastName,
          email: meta.email,
          phone: meta.phone || '',
          country: meta.country || '',
          start_date: meta.startDate,
          end_date: meta.endDate,
          bike_quantity: parseInt(meta.bikeQuantity),
          down_payment: parseFloat(meta.downPayment),
          total_price: parseFloat(meta.totalRentalPrice),
          deposit: parseFloat(meta.totalDeposit),
          status: 'confirmed',
          payment_status: 'paid',
          paid: true,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent
        },
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 3️⃣ Get all confirmed bookings that overlap the requested period
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        booking_motorcycles (
          motorcycle_id
        )
      `)
      .in('status', ['confirmed', 'paid', 'pending']);

    if (overlapError) throw overlapError;

    // 4️⃣ Extract IDs of motorcycles already booked during this period
    const bookedMotorcycleIds = new Set();

    for (const b of overlappingBookings) {
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);

      const overlaps =
        startDate <= bEnd && endDate >= bStart; // basic date overlap logic

      if (overlaps && b.booking_motorcycles?.length) {
        for (const bm of b.booking_motorcycles) {
          bookedMotorcycleIds.add(bm.motorcycle_id);
        }
      }
    }

    // 5️⃣ Fetch motorcycles that are NOT booked in this range
    const { data: allMotorcycles, error: motoError } = await supabase
      .from('motorcycles')
      .select('*')
      .order('id', { ascending: true });

    if (motoError) throw motoError;

    const availableMotorcycles = allMotorcycles.filter(
      (m) => !bookedMotorcycleIds.has(m.id)
    );

    if (availableMotorcycles.length < booking.bike_quantity) {
      return NextResponse.json({
        booking,
        warning: 'Not enough motorcycles available for this date range'
      });
    }

    // 6️⃣ Assign motorcycles to booking
    const assigned = availableMotorcycles.slice(0, booking.bike_quantity);

    for (let moto of assigned) {
      const { error: assignError } = await supabase
        .from('booking_motorcycles')
        .insert({
          booking_id: booking.id,
          motorcycle_id: moto.id
        });

      if (assignError) {
        console.error('Error inserting booking_motorcycles:', assignError);
        return NextResponse.json({
          booking,
          warning: 'Booking created, but failed to assign motorcycles'
        });
      }
    }

    // ✅ Done
    return NextResponse.json({ booking, assignedMotorcycles: assigned });

  } catch (error) {
    console.error('❌ verify-payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
