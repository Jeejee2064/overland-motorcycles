// Additional helper functions for admin booking management
import { supabase } from '@/lib/supabase/client';

/**
 * Get motorcycles assigned to a specific booking
 */
export async function getBookingMotorcycles(bookingId) {
  try {
    const { data, error } = await supabase
      .from('booking_motorcycles')
      .select(`
        id,
        motorcycle_id,
        motorcycles (
          id,
          name
        )
      `)
      .eq('booking_id', bookingId);

    if (error) {
      console.error('Error fetching booking motorcycles:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getBookingMotorcycles:', err);
    throw err;
  }
}

/**
 * Get available motorcycles for a date range, excluding current booking's motorcycles
 */
export async function getAvailableMotorcyclesForEdit(startDate, endDate, currentBookingId, pickupLocation, strict = false) {
  try {
    const { data: allMotorcycles, error: motoError } = await supabase
      .from('motorcycles')
      .select('*')
      .order('name', { ascending: true });

    if (motoError) throw motoError;

    // Push date overlap to Supabase — avoids JS timezone bugs entirely
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`id, booking_motorcycles ( motorcycle_id )`)
      .in('status', ['confirmed', 'paid', 'pending', 'fully paid'])
      .neq('id', currentBookingId)
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    if (overlapError) throw overlapError;

    const bookedIds = new Set(
      overlappingBookings.flatMap(b =>
        b.booking_motorcycles?.map(bm => bm.motorcycle_id) ?? []
      )
    );

    const available = allMotorcycles.filter(m => !bookedIds.has(m.id));

    if (!pickupLocation) return available;

    // Mode strict (ex. session Coronado) : on exclut purement et simplement
    // les motos d'un autre lieu, jamais de repli croisé.
    if (strict) return available.filter(m => m.location === pickupLocation);

    // Priorité souple : les motos du lieu de pickup demandé apparaissent en
    // premier dans la liste, sans jamais exclure les autres.
    return [...available].sort((a, b) => {
      const aMatch = a.location === pickupLocation ? 0 : 1;
      const bMatch = b.location === pickupLocation ? 0 : 1;
      return aMatch - bMatch;
    });
  } catch (err) {
    console.error('Exception in getAvailableMotorcyclesForEdit:', err);
    throw err;
  }
}