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
 * Update booking details (all editable fields)
 */
export async function updateBookingDetails(bookingId, updates) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Exception in updateBookingDetails:', err);
    throw err;
  }
}

/**
 * Remove a motorcycle assignment from a booking
 */
export async function removeMotorcycleFromBooking(bookingId, motorcycleId) {
  try {
    const { error } = await supabase
      .from('booking_motorcycles')
      .delete()
      .eq('booking_id', bookingId)
      .eq('motorcycle_id', motorcycleId);

    if (error) {
      console.error('Error removing motorcycle:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Exception in removeMotorcycleFromBooking:', err);
    throw err;
  }
}

/**
 * Add a motorcycle to a booking
 */
export async function addMotorcycleToBooking(bookingId, motorcycleId) {
  try {
    const { data, error } = await supabase
      .from('booking_motorcycles')
      .insert({
        booking_id: bookingId,
        motorcycle_id: motorcycleId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding motorcycle:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Exception in addMotorcycleToBooking:', err);
    throw err;
  }
}

/**
 * Get available motorcycles for a date range, excluding current booking's motorcycles
 */
export async function getAvailableMotorcyclesForEdit(startDate, endDate, currentBookingId) {
  try {
    // Get all motorcycles
    const { data: allMotorcycles, error: motoError } = await supabase
      .from('motorcycles')
      .select('*')
      .order('name', { ascending: true });

    if (motoError) throw motoError;

    // Get overlapping bookings (excluding current booking)
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        booking_motorcycles (
          motorcycle_id
        )
      `)
      .in('status', ['confirmed', 'paid', 'pending', 'fully paid'])
      .neq('id', currentBookingId);

    if (overlapError) throw overlapError;

    // Find booked motorcycle IDs
    const bookedMotorcycleIds = new Set();
    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);

    for (const booking of overlappingBookings) {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);

      // Check if dates overlap
      const overlaps = requestStart <= bookingEnd && requestEnd >= bookingStart;

      if (overlaps && booking.booking_motorcycles?.length) {
        booking.booking_motorcycles.forEach(bm => {
          bookedMotorcycleIds.add(bm.motorcycle_id);
        });
      }
    }

    // Filter available motorcycles
    const availableMotorcycles = allMotorcycles.filter(
      m => !bookedMotorcycleIds.has(m.id)
    );

    return availableMotorcycles;
  } catch (err) {
    console.error('Exception in getAvailableMotorcyclesForEdit:', err);
    throw err;
  }
}

/**
 * Update a single motorcycle assignment for a booking slot
 */
export async function updateSingleMotorcycleAssignment(bookingId, oldAssignmentId, newMotorcycleId) {
  try {
    // If there's an old assignment, delete it
    if (oldAssignmentId) {
      const { error: deleteError } = await supabase
        .from('booking_motorcycles')
        .delete()
        .eq('id', oldAssignmentId);

      if (deleteError) throw deleteError;
    }

    // If a new motorcycle is selected (not empty), create the assignment
    if (newMotorcycleId && newMotorcycleId !== '') {
      const { error: insertError } = await supabase
        .from('booking_motorcycles')
        .insert({
          booking_id: bookingId,
          motorcycle_id: newMotorcycleId
        });

      if (insertError) throw insertError;
    }

    return true;
  } catch (err) {
    console.error('Exception in updateSingleMotorcycleAssignment:', err);
    throw err;
  }
}

/**
 * Replace all motorcycles for a booking
 */
export async function replaceBookingMotorcycles(bookingId, motorcycleIds) {
  try {
    // First, remove all existing assignments
    const { error: deleteError } = await supabase
      .from('booking_motorcycles')
      .delete()
      .eq('booking_id', bookingId);

    if (deleteError) throw deleteError;

    // Then, add new assignments
    if (motorcycleIds.length > 0) {
      const assignments = motorcycleIds.map(motorcycleId => ({
        booking_id: bookingId,
        motorcycle_id: motorcycleId
      }));

      const { error: insertError } = await supabase
        .from('booking_motorcycles')
        .insert(assignments);

      if (insertError) throw insertError;
    }

    return true;
  } catch (err) {
    console.error('Exception in replaceBookingMotorcycles:', err);
    throw err;
  }
}