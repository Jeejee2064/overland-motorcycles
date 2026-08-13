import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Whitelist of booking fields any admin (full or coronado-scoped) is allowed to write
// through this generic endpoint — covers what used to be three separate client-side
// helpers (updateBookingPayment, updateBookingStatus, updateBookingDetails).
const ALLOWED_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'country',
  'start_date', 'end_date', 'bike_quantity', 'motorcycle_model', 'pickup_location',
  'total_price', 'down_payment', 'deposit', 'special_requests', 'hear_about_us',
  'status', 'payment_status', 'webhook_received',
  'auth_status', 'auth_count', 'balance_status', 'balance_paid_at',
  'paid',
];

async function getSession(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

async function loadScopedBooking(id, role) {
  const { data: booking, error } = await supabase.from('bookings').select('*').eq('id', id).single();
  if (error || !booking) return { booking: null, forbidden: false };
  if (role === 'coronado' && (booking.pickup_location || 'Panama City') !== 'Playa Coronado') {
    return { booking: null, forbidden: true };
  }
  return { booking, forbidden: false };
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const { valid, role } = await getSession(request);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking } = await loadScopedBooking(id, role);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // A coronado-role admin can never move a booking off Playa Coronado.
    if (role === 'coronado' && 'pickup_location' in updates && updates.pickup_location !== 'Playa Coronado') {
      return NextResponse.json({ error: 'Not authorized to change pickup location' }, { status: 403 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    return NextResponse.json({ booking: data });
  } catch (err) {
    console.error('Error in PATCH /api/admin/bookings/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const { valid, role } = await getSession(request);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking } = await loadScopedBooking(id, role);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/admin/bookings/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
