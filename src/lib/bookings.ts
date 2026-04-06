import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Booking {
  id: string;
  user_id: string;
  slot_id: string;
  session_type: 'personal' | 'couple';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meeting_link?: string;
  google_calendar_event_id?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

// Create a new booking
export async function createBooking(
  userId: string,
  slotId: string,
  sessionType: 'personal' | 'couple'
) {
  // First, check if slot is still available
  const { data: slot, error: slotError } = await supabase
    .from('therapy_slots')
    .select('*')
    .eq('id', slotId)
    .eq('is_available', true)
    .eq('is_blocked', false)
    .single();

  if (slotError || !slot) {
    throw new Error('Slot is no longer available');
  }

  // Create the booking
  const { data, error } = await supabase
    .from('bookings')
    .insert([
      {
        user_id: userId,
        slot_id: slotId,
        session_type: sessionType,
        status: 'confirmed',
      },
    ])
    .select();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  // Mark slot as unavailable
  await supabase
    .from('therapy_slots')
    .update({ is_available: false })
    .eq('id', slotId);

  return data?.[0] as Booking;
}

// Get user bookings
export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      user:users(*),
      slot:therapy_slots(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }

  return data;
}

// Get all bookings (admin only)
export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      user:users(*),
      slot:therapy_slots(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all bookings:', error);
    return [];
  }

  return data;
}

// Update booking with meeting link
export async function updateBookingWithMeetingLink(
  bookingId: string,
  meetingLink: string,
  googleCalendarEventId: string
) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      meeting_link: meetingLink,
      google_calendar_event_id: googleCalendarEventId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select();

  if (error) {
    console.error('Error updating booking:', error);
    throw error;
  }

  return data?.[0] as Booking;
}

// Cancel booking (with 24-hour notice requirement)
export async function cancelBooking(
  bookingId: string,
  reason?: string
) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, slot:therapy_slots(*)')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error('Booking not found');
  }

  // Check if cancellation is within 24 hours (business rule)
  const bookingDate = new Date(booking.slot.date + ' ' + booking.slot.start_time);
  const hoursUntilBooking = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilBooking < 24) {
    throw new Error('Cancellation must be done at least 24 hours before the appointment');
  }

  // Cancel the booking
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select();

  if (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }

  // Make the slot available again
  await supabase
    .from('therapy_slots')
    .update({ is_available: true })
    .eq('id', booking.slot_id);

  return data?.[0] as Booking;
}

// Get upcoming bookings for a user
export async function getUpcomingBookings(userId: string) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:therapy_slots(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('slot.date', dateString)
    .order('slot.date', { ascending: true })
    .order('slot.start_time', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming bookings:', error);
    return [];
  }

  return data;
}

// Get past bookings for a user
export async function getPastBookings(userId: string) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:therapy_slots(*)
    `)
    .eq('user_id', userId)
    .lt('slot.date', dateString)
    .order('slot.date', { ascending: false })
    .order('slot.start_time', { ascending: false });

  if (error) {
    console.error('Error fetching past bookings:', error);
    return [];
  }

  return data;
}
