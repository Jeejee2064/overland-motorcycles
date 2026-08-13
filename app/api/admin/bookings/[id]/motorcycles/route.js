import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read assigned/available motorcycles for a booking (replaces the direct
// anon-key getBookingMotorcycles()/getAvailableMotorcyclesForEdit() calls that
// used to run from the browser in bookings-admin-helpers.js).
//   ?type=assigned                                   → currently assigned motorcycles
//   ?type=available&start_date=&end_date=&pickup_location= → open motorcycles for those dates
export async function GET(request, { params }) {
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
      .from('bookings').select('id, pickup_location').eq('id', id).single();
    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (role === 'coronado' && (booking.pickup_location || 'Panama City') !== 'Playa Coronado') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'assigned';

    if (type === 'assigned') {
      const { data, error } = await supabase
        .from('booking_motorcycles')
        .select(`id, motorcycle_id, motorcycles ( id, name )`)
        .eq('booking_id', id);
      if (error) throw error;
      return NextResponse.json({ assigned: data || [] });
    }

    // type === 'available'
    const startDate = searchParams.get('start_date');
    const endDate    = searchParams.get('end_date');
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing start_date/end_date' }, { status: 400 });
    }
    // A coronado-role admin only ever gets Coronado-stationed bikes back, regardless
    // of what pickup_location the client asks for.
    const pickupLocation = role === 'coronado'
      ? 'Playa Coronado'
      : (searchParams.get('pickup_location') || booking.pickup_location || 'Panama City');

    const { data: allMotorcycles, error: motoError } = await supabase
      .from('motorcycles').select('*').order('name', { ascending: true });
    if (motoError) throw motoError;

    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`id, booking_motorcycles ( motorcycle_id )`)
      .in('status', ['confirmed', 'paid', 'pending', 'fully paid'])
      .neq('id', id)
      .lte('start_date', endDate)
      .gte('end_date', startDate);
    if (overlapError) throw overlapError;

    const bookedIds = new Set(
      (overlappingBookings || []).flatMap(b => b.booking_motorcycles?.map(bm => bm.motorcycle_id) ?? [])
    );
    let available = (allMotorcycles || []).filter(m => !bookedIds.has(m.id));

    if (role === 'coronado') {
      // Hard filter: never offer a cross-location bike to a coronado-scoped admin.
      available = available.filter(m => m.location === 'Playa Coronado');
    } else {
      // Soft priority: bikes at the requested pickup location first, others still listed.
      available = [...available].sort((a, b) => {
        const aMatch = a.location === pickupLocation ? 0 : 1;
        const bMatch = b.location === pickupLocation ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return NextResponse.json({ available });
  } catch (err) {
    console.error('Error in GET /api/admin/bookings/[id]/motorcycles:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
