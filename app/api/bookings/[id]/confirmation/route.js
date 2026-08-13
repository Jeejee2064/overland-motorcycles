import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public, unauthenticated by design — reached right after the PagueloFácil
// redirect using the booking's UUID (unguessable, effectively a capability
// token). Replaces the direct anon-key `select('*')` that used to run from
// Booking/success/page.jsx. Deliberately returns only what the success page
// renders — no paguelofacil_token/transaction IDs, no other booking's data
// reachable (single row by primary key).
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, first_name, last_name, email, start_date, end_date, motorcycle_model, pickup_location, bike_quantity, down_payment, status, webhook_received')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error('Error in GET /api/bookings/[id]/confirmation:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
