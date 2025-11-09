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
    const [sy, sm, sd] = b.start_date.split('-').map(Number);
    const [ey, em, ed] = b.end_date.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    const days = eachDayOfInterval({ start, end });

    days.forEach((d) => {
      const key = format(new Date(d), 'yyyy-MM-dd');
      availability[key] = (availability[key] || 0) + b.bike_quantity;
    });
  });

  console.log('Availability map built:', availability);
  return availability;
}

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

// ✅ UPDATED: Create booking without motorcycle assignment (Stripe will confirm later)
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

    // Create the booking with payment_status field
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
        payment_status: bookingData.payment_status || 'pending',
        paid: false
      }])
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw new Error('Failed to create booking: ' + bookingError.message);
    }

    console.log('Booking created (pending payment):', booking);

    // ⚠️ DON'T assign motorcycles yet - wait for Stripe payment confirmation
    // The webhook will call assignMotorcyclesToBooking() after payment

    return booking;
  } catch (err) {
    console.error('Exception in createBooking:', err);
    throw err;
  }
}

// ✅ NEW: Function to assign motorcycles after payment (called by webhook)
export async function assignMotorcyclesToBooking(bookingId, startDate, endDate, quantity) {
  try {
    console.log(`Assigning ${quantity} motorcycles to booking ${bookingId}`);

    const { data: assignResult, error: assignError } = await supabase.rpc('assign_motorcycles_to_booking', {
      p_booking_id: bookingId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_quantity: quantity
    });

    if (assignError) {
      console.error('Error assigning motorcycles:', assignError);
      throw new Error('Failed to assign motorcycles: ' + assignError.message);
    }

    console.log('Motorcycles assigned successfully to booking:', bookingId);
    return assignResult;
  } catch (err) {
    console.error('Exception assigning motorcycles:', err);
    throw err;
  }
}

// ✅ UPDATED: Mark booking as paid and assign motorcycles
export async function markBookingAsPaid(bookingId, stripePaymentIntentId, stripeSessionId) {
  try {
    // 1. Get booking details first
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
      throw fetchError;
    }

    // 2. Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        paid: true,
        status: 'confirmed',
        payment_status: 'down_payment_received',
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_session_id: stripeSessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking payment:', updateError);
      throw updateError;
    }

    // 3. Assign motorcycles now that payment is confirmed
    await assignMotorcyclesToBooking(
      bookingId,
      booking.start_date,
      booking.end_date,
      booking.bike_quantity
    );

    console.log('Booking marked as paid and motorcycles assigned:', bookingId);
    return updatedBooking;
  } catch (error) {
    console.error('Error in markBookingAsPaid:', error);
    throw error;
  }
}

// ✅ NEW: Update booking with Stripe session info
export async function updateBookingWithStripeSession(bookingId, sessionId, paymentIntentId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking with Stripe session:', error);
    throw error;
  }

  return data;
}

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

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, phone')
    .in('id', bookingIds);

  if (bookingsError) {
    console.error('Error fetching booking phones:', bookingsError);
    throw bookingsError;
  }

  const bookingsMap = Object.fromEntries(bookingsData.map(b => [b.id, b.phone]));

  const mergedData = calendarData.map(event => ({
    ...event,
    phone: bookingsMap[event.booking_id] || null,
  }));

  return mergedData;
}

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

export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }

  return data;
}

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