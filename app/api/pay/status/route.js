import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');
  const type      = searchParams.get('type');

  if (!bookingId || !type) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('auth_status, balance_status')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: type === 'auth' ? booking.auth_status : booking.balance_status,
  });
}
