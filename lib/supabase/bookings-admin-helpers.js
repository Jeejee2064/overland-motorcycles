// Additional helper functions for admin booking management
//
// These now go through /api/admin/bookings/[id]/motorcycles (service-role,
// session-authenticated) instead of querying Supabase directly with the anon
// key from the browser — direct anon access to `bookings`/`booking_motorcycles`
// was removed as part of RLS hardening (that data includes customer PII).

/**
 * Get motorcycles assigned to a specific booking
 */
export async function getBookingMotorcycles(bookingId) {
  const res  = await fetch(`/api/admin/bookings/${bookingId}/motorcycles?type=assigned`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch booking motorcycles');
  return data.assigned || [];
}

/**
 * Get available motorcycles for a date range, excluding current booking's motorcycles.
 *
 * `strict` is accepted for backward compatibility but no longer trusted from the
 * client — the server derives Coronado-strict vs. Panama-soft filtering from the
 * admin's verified session role instead.
 */
export async function getAvailableMotorcyclesForEdit(startDate, endDate, currentBookingId, pickupLocation, strict = false) {
  const params = new URLSearchParams({ type: 'available', start_date: startDate, end_date: endDate });
  if (pickupLocation) params.set('pickup_location', pickupLocation);

  const res  = await fetch(`/api/admin/bookings/${currentBookingId}/motorcycles?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch available motorcycles');
  return data.available || [];
}
