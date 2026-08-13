import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// List all bookings (+ riders) for the admin dashboard. Replaces the direct
// anon-key `getAllBookings()` call that used to run from the browser — RLS
// hardening means the client no longer has table-level SELECT on `bookings`.
export async function GET(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid, role } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // A coronado-role admin only ever sees Coronado bookings — enforced here
    // from the verified session, never from a client-supplied query param.
    let query = supabase
      .from('bookings')
      .select('*, booking_riders(*)')
      .order('created_at', { ascending: false });

    if (role === 'coronado') {
      query = query.eq('pickup_location', 'Playa Coronado');
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/bookings:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin manual "Add Booking" flow — server-side port of what used to run directly
// against the anon Supabase client in AdminDashboardClient.jsx's handleAddBooking.
// Same availability/assignment logic as the webhook (Phase 1F): hard location filter
// for Coronado, soft priority-with-fallback for Panama City, 'fully paid' counted
// as occupying capacity.
export async function POST(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid, role } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isCoronado = role === 'coronado';

    const { newBooking, riders = [] } = await request.json();
    if (!newBooking) {
      return NextResponse.json({ error: 'Missing booking data' }, { status: 400 });
    }

    // Coronado-role admins can only ever create Coronado bookings — enforced
    // server-side regardless of what the client sent.
    const pickupLocation = isCoronado ? 'Playa Coronado' : (newBooking.pickup_location || 'Panama City');

    if (pickupLocation === 'Playa Coronado' && newBooking.motorcycle_model === 'CFMoto700') {
      return NextResponse.json({ error: 'CF Moto 700 is not available for pickup in Playa Coronado.' }, { status: 400 });
    }

    const startDate = new Date(newBooking.start_date);
    const endDate   = new Date(newBooking.end_date);

    // 1. Which motorcycles of this model are already committed to an overlapping booking
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`id, start_date, end_date, booking_motorcycles ( motorcycle_id )`)
      .in('status', ['confirmed', 'paid', 'pending', 'fully paid']);
    if (overlapError) throw overlapError;

    const bookedMotorcycleIds = new Set();
    for (const b of overlappingBookings) {
      const bStart   = new Date(b.start_date);
      const bEnd     = new Date(b.end_date);
      const overlaps = startDate <= bEnd && endDate >= bStart;
      if (overlaps && b.booking_motorcycles?.length) {
        for (const bm of b.booking_motorcycles) bookedMotorcycleIds.add(bm.motorcycle_id);
      }
    }

    const { data: modelMotorcycles, error: motoError } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('model', newBooking.motorcycle_model)
      .eq('is_available', true)
      .order('name');
    if (motoError) throw motoError;

    const available = (modelMotorcycles || []).filter(m => !bookedMotorcycleIds.has(m.id));
    const needed    = newBooking.motorcycle_model === 'CFMoto700' ? 1 : newBooking.bike_quantity;

    // Coronado: hard filter, never falls back cross-location. Panama City: soft
    // priority (tries its own bikes first, falls back to Coronado if needed).
    const pool = isCoronado
      ? available.filter(m => m.location === 'Playa Coronado')
      : available;

    if (pool.length < needed) {
      const modelLabel = newBooking.motorcycle_model === 'CFMoto700' ? 'CF Moto 700' : 'Himalayan';
      const scope = isCoronado ? ' at Playa Coronado' : '';
      return NextResponse.json(
        { error: `Not enough ${modelLabel} bikes available${scope} (needed ${needed}, available ${pool.length}).` },
        { status: 400 }
      );
    }

    // 2. Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        first_name:       newBooking.first_name,
        last_name:        newBooking.last_name,
        email:            newBooking.email,
        phone:            newBooking.phone,
        country:          newBooking.country,
        start_date:       newBooking.start_date,
        end_date:         newBooking.end_date,
        bike_quantity:    needed,
        motorcycle_model: newBooking.motorcycle_model || 'Himalayan',
        pickup_location:  pickupLocation,
        total_price:      newBooking.total_price,
        down_payment:     newBooking.down_payment,
        deposit:          newBooking.deposit,
        special_requests: newBooking.special_requests || null,
        hear_about_us:    newBooking.hear_about_us || null,
        status:           newBooking.status || 'confirmed',
        payment_status:   newBooking.payment_status || 'confirmed',
        auth_status:      newBooking.auth_status || null,
        balance_status:   newBooking.balance_status || null,
        paid:             false,
      }])
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking: ' + bookingError.message }, { status: 500 });
    }

    // 3. Assign motorcycles (only if the booking is being created as already confirmed)
    if (newBooking.status === 'confirmed') {
      const assigned = isCoronado
        ? pool.slice(0, needed)
        : [...available].sort((a, b) => {
            const aMatch = a.location === pickupLocation ? 0 : 1;
            const bMatch = b.location === pickupLocation ? 0 : 1;
            return aMatch - bMatch;
          }).slice(0, needed);

      for (const moto of assigned) {
        const { error: assignError } = await supabase
          .from('booking_motorcycles')
          .insert({ booking_id: booking.id, motorcycle_id: moto.id });
        if (assignError) throw new Error('Failed to assign motorcycles: ' + assignError.message);
      }
    }

    // 4. Additional riders
    const validRiders = (riders || []).filter(r => r.first_name && r.last_name);
    if (validRiders.length > 0) {
      const { error: ridersError } = await supabase
        .from('booking_riders')
        .insert(validRiders.map((r, i) => ({
          booking_id:  booking.id,
          rider_index: i + 2,
          first_name:  r.first_name,
          last_name:   r.last_name,
          email:       r.email || null,
          phone:       r.phone || null,
        })));
      if (ridersError) console.error('Error inserting riders:', ridersError);
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error('Error in POST /api/admin/bookings:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
