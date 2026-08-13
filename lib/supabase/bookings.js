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

// Powers the admin calendar. Goes through /api/admin/motorcycle-calendar
// (service-role, session-authenticated) — it merges booking/rider contact
// details (phone, email, name) into the calendar, which is customer PII the
// anon key no longer has table access to (RLS hardening).
export async function getMotorcycleCalendarWithPhone(startDate = null, endDate = null, locationFilter = null) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate)   params.set('end_date', endDate);
  if (locationFilter) params.set('location', locationFilter);

  const res  = await fetch(`/api/admin/motorcycle-calendar?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching motorcycle calendar:', data.error);
    throw new Error(data.error || 'Failed to fetch motorcycle calendar');
  }
  return data.calendar || [];
}

// Admin bookings list. Goes through /api/admin/bookings (service-role,
// session-authenticated) instead of querying `bookings` directly with the
// anon key — same RLS-hardening reason as above.
export async function getAllBookings(locationFilter = null) {
  const params = new URLSearchParams();
  if (locationFilter) params.set('location', locationFilter);

  const res  = await fetch(`/api/admin/bookings?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching bookings:', data.error);
    throw new Error(data.error || 'Failed to fetch bookings');
  }
  return data.bookings || [];
}
