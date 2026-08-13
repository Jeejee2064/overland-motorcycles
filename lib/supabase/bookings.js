// lib/supabase/bookings.js
import { supabase } from './client';

/**
 * @param {string} startDate  'YYYY-MM-DD'
 * @param {string} endDate    'YYYY-MM-DD'
 * @param {string} model      'Himalayan' | 'CFMoto700'
 * @param {string|null} location  'Panama City' | 'Playa Coronado' | null (null = whole fleet, current default behavior)
 * @returns {Promise<number>}
 */
export async function checkBikesAvailableByModel(startDate, endDate, model, location = null) {
  try {
    if (!startDate || !endDate || !model) return 0;
    const fmt = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : d);
    const { data, error } = await supabase.rpc('check_bikes_available_by_model', {
      p_start_date: fmt(startDate),
      p_end_date:   fmt(endDate),
      p_model:      model,
      p_location:   location,
    });
    if (error) { console.error('checkBikesAvailableByModel error:', error); return 0; }
    return data || 0;
  } catch (err) {
    console.error('checkBikesAvailableByModel exception:', err);
    return 0;
  }
}

// ── NEW: range map filtered by model (used by calendars) ─────
/**
 * Returns an object like { '2026-03-01': 2, '2026-03-02': 1, … }
 * where the value is the number of BOOKED bikes for that model on that day.
 *
 * @param {string} model  'Himalayan' | 'CFMoto700'
 * @param {string|null} location  'Panama City' | 'Playa Coronado' | null (null = whole fleet, current default behavior)
 * @returns {Promise<Record<string, number>>}
 */
export async function checkBikesAvailabilityRangeByModel(model, location = null) {
  try {
    if (!model) return {};
    const { data, error } = await supabase.rpc(
      'check_bikes_availability_range_by_model',
      { p_model: model, p_location: location }
    );
    if (error) { console.error('checkBikesAvailabilityRangeByModel error:', error); return {}; }

    // Convert array of { date_key, booked_count } → plain object
    const map = {};
    (data || []).forEach(({ date_key, booked_count }) => {
      map[date_key] = booked_count;
    });
    return map;
  } catch (err) {
    console.error('checkBikesAvailabilityRangeByModel exception:', err);
    return {};
  }
}

/**
 * Total in-service fleet size for a given model at a given location.
 * Used to drive the Coronado calendar's dynamic bike-count legend
 * (instead of a hardcoded MAX_BIKES).
 * @param {string} model
 * @param {string} location
 * @returns {Promise<number>}
 */
export async function getFleetSize(model, location) {
  try {
    if (!model || !location) return 0;
    const { count, error } = await supabase
      .from('motorcycles')
      .select('id', { count: 'exact', head: true })
      .eq('model', model)
      .eq('location', location)
      .eq('is_available', true);
    if (error) { console.error('getFleetSize error:', error); return 0; }
    return count || 0;
  } catch (err) {
    console.error('getFleetSize exception:', err);
    return 0;
  }
}

export async function getAllMotorcycles(locationFilter = null) {
  let query = supabase
    .from('motorcycles')
    .select('*')
    .order('name', { ascending: true });

  if (locationFilter) query = query.eq('location', locationFilter);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching motorcycles:', error);
    throw error;
  }

  return data;
}

export async function getMotorcycleCalendarWithPhone(startDate = null, endDate = null, locationFilter = null) {
  let query = supabase
    .from('motorcycle_calendar')
    .select('*')
    .order('motorcycle_name', { ascending: true })
    .order('start_date', { ascending: true });

  if (startDate && endDate) {
    query = query
      .lte('start_date', endDate)
      .gte('end_date', startDate);
  }

  const { data: calendarData, error: calendarError } = await query;

  if (calendarError) {
    console.error('Error fetching motorcycle calendar:', calendarError);
    throw calendarError;
  }

  if (!calendarData || calendarData.length === 0) return [];

  const bookingIds = calendarData.map(event => event.booking_id).filter(Boolean);

  const [{ data: bookingsData }, { data: ridersData }, { data: motoAssignments }] = await Promise.all([
    supabase.from('bookings').select('id, phone, email, first_name, last_name, pickup_location').in('id', bookingIds),
    supabase.from('booking_riders').select('booking_id, rider_index, first_name, last_name, email, phone').in('booking_id', bookingIds).order('rider_index'),
    supabase.from('booking_motorcycles').select('booking_id, motorcycle_id').in('booking_id', bookingIds).order('motorcycle_id'),
  ]);

  const bookingsMap = Object.fromEntries((bookingsData || []).map(b => [b.id, b]));

  // For each booking, ordered list of motorcycle_ids (sorted by motorcycle_id)
  const bookingMotoOrder = {};
  for (const row of (motoAssignments || [])) {
    if (!bookingMotoOrder[row.booking_id]) bookingMotoOrder[row.booking_id] = [];
    bookingMotoOrder[row.booking_id].push(row.motorcycle_id);
  }

  // Map booking_id → array indexed by position: [{ name, phone, email }, ...]
  // index 0 = primary booker, index 1 = rider_index 2, etc.
  const bookingRiderInfo = {};
  for (const booking of (bookingsData || [])) {
    bookingRiderInfo[booking.id] = [{
      name:  `${booking.first_name} ${booking.last_name}`,
      phone: booking.phone || null,
      email: booking.email || null,
    }];
  }
  for (const rider of (ridersData || [])) {
    if (!bookingRiderInfo[rider.booking_id]) bookingRiderInfo[rider.booking_id] = [];
    bookingRiderInfo[rider.booking_id][rider.rider_index - 1] = {
      name:  `${rider.first_name} ${rider.last_name}`,
      phone: rider.phone || null,
      email: rider.email || null,
    };
  }

  const mergedData = calendarData.map(event => {
    const booking    = bookingsMap[event.booking_id];
    const motoOrder  = bookingMotoOrder[event.booking_id] || [];
    const motoIdx    = motoOrder.indexOf(event.motorcycle_id);
    const riders     = bookingRiderInfo[event.booking_id] || [];
    const rider      = (motoIdx >= 0 && riders[motoIdx]) ? riders[motoIdx] : (riders[0] || null);
    return {
      ...event,
      display_name:    rider?.name  || event.customer_name || null,
      phone:           rider?.phone || booking?.phone      || null,
      display_email:   rider?.email || booking?.email      || null,
      all_rider_names: riders.map(r => r?.name).filter(Boolean),
      pickup_location: booking?.pickup_location || 'Panama City',
    };
  });

  if (locationFilter) {
    return mergedData.filter(e => (e.pickup_location || 'Panama City') === locationFilter);
  }

  return mergedData;
}

export async function getAllBookings(locationFilter = null) {
  let query = supabase
    .from('bookings')
    .select('*, booking_riders(*)')
    .order('created_at', { ascending: false });

  if (locationFilter) query = query.eq('pickup_location', locationFilter);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return data;
}
