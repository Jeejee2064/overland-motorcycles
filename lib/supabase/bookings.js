// lib/supabase/bookings.js
import { supabase } from './client';
import { eachDayOfInterval, format } from 'date-fns';


export async function checkBikesAvailabilityRange() {
  const { data, error } = await supabase
    .from('bookings')
    .select('start_date, end_date, bike_quantity, status')
    .in('status', ['confirmed', 'paid']);

  if (error) throw error;

  const availability = {};

  data.forEach((b) => {
    // Normalize to midnight UTC to avoid timezone drift
 // Parse date parts manually — safest for pure dates
const [sy, sm, sd] = b.start_date.split('-').map(Number);
const [ey, em, ed] = b.end_date.split('-').map(Number);
const start = new Date(sy, sm - 1, sd);
const end = new Date(ey, em - 1, ed);


    const days = eachDayOfInterval({ start, end });

    days.forEach((d) => {
      // Always generate yyyy-MM-dd in local time
      const key = format(new Date(d), 'yyyy-MM-dd');
      availability[key] = (availability[key] || 0) + b.bike_quantity;
    });
  });

  console.log('Availability map built:', availability);
  return availability;
}



// Get available motorcycles for a date range
export async function getAvailableMotorcycles(startDate, endDate) {
  try {
    const { data, error } = await supabase.rpc('get_available_motorcycles', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error('Error getting available motorcycles:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception getting available motorcycles:', err);
    return [];
  }
}

export async function checkBikesAvailable(startDate, endDate) {
  try {
    const { data, error } = await supabase.rpc('check_bikes_available', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error('Error checking availability:', error);
      return 0;
    }

    console.log(`Available bikes for ${startDate} to ${endDate}: ${data}`);
    return data || 0;
  } catch (err) {
    console.error('Exception checking availability:', err);
    return 0;
  }
}
// Create a booking with automatic motorcycle assignment
export async function createBooking(bookingData) {
  try {
    console.log('Creating booking with data:', bookingData);

    // Check availability first
    const available = await checkBikesAvailable(
      bookingData.start_date,
      bookingData.end_date
    );

    console.log(`Available bikes: ${available}, Needed: ${bookingData.bike_quantity}`);

    if (available < bookingData.bike_quantity) {
      throw new Error(`Only ${available} motorcycle(s) available for the selected dates`);
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        first_name: bookingData.first_name,
        last_name: bookingData.last_name,
        email: bookingData.email,
        phone: bookingData.phone,
        country: bookingData.country,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        bike_quantity: bookingData.bike_quantity,
        total_price: bookingData.total_price,
        down_payment: bookingData.down_payment,
        deposit: bookingData.deposit,
        special_requests: bookingData.special_requests || null,
        hear_about_us: bookingData.hear_about_us || null,
        status: bookingData.status || 'pending',
        paid: bookingData.paid || false
      }])
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw new Error('Failed to create booking: ' + bookingError.message);
    }

    console.log('Booking created:', booking);

    // Assign motorcycles to the booking
    try {
      const { data: assignResult, error: assignError } = await supabase.rpc('assign_motorcycles_to_booking', {
        p_booking_id: booking.id,
        p_start_date: bookingData.start_date,
        p_end_date: bookingData.end_date,
        p_quantity: bookingData.bike_quantity
      });

      if (assignError) {
        console.error('Error assigning motorcycles:', assignError);
        // Rollback: delete the booking
        await supabase.from('bookings').delete().eq('id', booking.id);
        throw new Error('Failed to assign motorcycles. Please try again.');
      }

      console.log('Motorcycles assigned successfully');
    } catch (assignErr) {
      console.error('Exception assigning motorcycles:', assignErr);
      // Rollback: delete the booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      throw new Error('Failed to assign motorcycles: ' + assignErr.message);
    }

    return booking;
  } catch (err) {
    console.error('Exception in createBooking:', err);
    throw err;
  }
}

// Get all motorcycles
export async function getAllMotorcycles() {
  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching motorcycles:', error);
    throw error;
  }

  return data;
}

export async function getMotorcycleCalendarWithPhone(startDate = null, endDate = null) {
  // 1️⃣ Fetch calendar
  let query = supabase
    .from('motorcycle_calendar')
    .select('*')
    .order('motorcycle_name', { ascending: true })
    .order('start_date', { ascending: true });

  if (startDate && endDate) {
    query = query
      .lte('start_date', endDate) // starts before month ends
      .gte('end_date', startDate); // ends after month starts
  }

  const { data: calendarData, error: calendarError } = await query;

  if (calendarError) {
    console.error('Error fetching motorcycle calendar:', calendarError);
    throw calendarError;
  }

  if (!calendarData || calendarData.length === 0) return [];

  // 2️⃣ Fetch phones for related booking_ids
  const bookingIds = calendarData.map(event => event.booking_id).filter(Boolean);

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, phone')
    .in('id', bookingIds);

  if (bookingsError) {
    console.error('Error fetching booking phones:', bookingsError);
    throw bookingsError;
  }

  // 3️⃣ Merge phones into calendar data
  const bookingsMap = Object.fromEntries(bookingsData.map(b => [b.id, b.phone]));

  const mergedData = calendarData.map(event => ({
    ...event,
    phone: bookingsMap[event.booking_id] || null, // attach phone
  }));

  return mergedData;
}


// Get bookings with assigned motorcycles
export async function getAllBookingsWithMotorcycles() {
  const { data, error } = await supabase
    .from('bookings_with_motorcycles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings with motorcycles:', error);
    throw error;
  }

  return data;
}

// Update booking after Stripe payment
export async function markBookingAsPaid(bookingId, stripePaymentIntentId, stripeSessionId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      paid: true,
      status: 'confirmed',
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_session_id: stripeSessionId
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking payment:', error);
    throw error;
  }

  return data;
}

// Get all bookings (for admin dashboard)
export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return data;
}

// Get booking by ID with motorcycle assignments
export async function getBookingById(id) {
  const { data, error } = await supabase
    .from('bookings_with_motorcycles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }

  return data;
}

// Update booking status
export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }

  return data;
}

// Delete a booking (motorcycles will be auto-unassigned due to CASCADE)
export async function deleteBooking(id) {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }

  return true;
}

// Get bookings for a specific date range
export async function getBookingsByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .neq('status', 'cancelled')
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching bookings by date range:', error);
    throw error;
  }

  return data;
}

export async function updateMotorcycleAvailability(motorcycleId, isAvailable) {
  const { data, error } = await supabase
    .from('motorcycles')
    .update({ is_available: isAvailable })
    .eq('id', motorcycleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating motorcycle availability:', error);
    throw error;
  }

  return data;
}
