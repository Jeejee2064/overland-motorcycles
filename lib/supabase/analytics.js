// lib/supabase/analytics.js
//
// Admin analytics read. Goes through /api/admin/analytics (service-role,
// session-authenticated) instead of querying `analytics_events` directly —
// same RLS-hardening pattern as getAllBookings() in bookings.js.
export async function getAnalyticsSummary(rangeDays = 30) {
  const res  = await fetch(`/api/admin/analytics?range=${rangeDays}`);
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching analytics:', data.error);
    throw new Error(data.error || 'Failed to fetch analytics');
  }
  return data;
}
