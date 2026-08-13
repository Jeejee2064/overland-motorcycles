import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Swap a single motorcycle assignment slot on a booking (replaces
// updateSingleMotorcycleAssignment, used by BookingDetailModal's edit mode).
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid, role } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings').select('*').eq('id', id).single();
    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (role === 'coronado' && (booking.pickup_location || 'Panama City') !== 'Playa Coronado') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { oldAssignmentId, newMotorcycleId } = await request.json();

    // Coronado-role admins can only ever assign a Coronado-stationed motorcycle —
    // mirrors the hard filter enforced elsewhere (create/webhook/add-booking).
    if (newMotorcycleId) {
      const { data: moto } = await supabase
        .from('motorcycles').select('location').eq('id', newMotorcycleId).single();
      if (role === 'coronado' && moto?.location !== 'Playa Coronado') {
        return NextResponse.json({ error: 'Not authorized to assign this motorcycle' }, { status: 403 });
      }
    }

    if (oldAssignmentId) {
      const { error: deleteError } = await supabase
        .from('booking_motorcycles').delete().eq('id', oldAssignmentId);
      if (deleteError) throw deleteError;
    }

    if (newMotorcycleId) {
      const { error: insertError } = await supabase
        .from('booking_motorcycles')
        .insert({ booking_id: id, motorcycle_id: newMotorcycleId });
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in PATCH /api/admin/bookings/[id]/motorcycles:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
