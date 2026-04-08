import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch assigned motorcycles
    const { data: bookingMotorcycles } = await supabase
      .from('booking_motorcycles')
      .select('motorcycle_id, motorcycles ( id, name, model )')
      .eq('booking_id', id);

    const assigned = (bookingMotorcycles || []).map(bm => bm.motorcycles).filter(Boolean);

    return NextResponse.json({ booking, assigned });
  } catch (err) {
    console.error('Error fetching booking:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}