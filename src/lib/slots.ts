import { createClient } from '@supabase/supabase-js';
import {
  getCurrentDateString,
  getCurrentTimeInMinutes,
  isSlotInTheFuture,
} from '@/lib/time';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
  is_blocked: boolean;
  blocked_reason?: string;
  created_at: string;
}

// Get all available slots for a specific date (excluding booked slots)
export async function getAvailableSlots(date: string) {
  const { data: slots, error } = await supabase
    .from('therapy_slots')
    .select('*')
    .eq('date', date)
    .eq('is_available', true)
    .eq('is_blocked', false)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching slots:', error);
    return [];
  }

  // Filter out booked slots
  const bookedSlotIds = await getBookedSlotIds();
  const currentDateString = getCurrentDateString();
  const currentTimeMinutes = getCurrentTimeInMinutes();
  const availableSlots = (slots || []).filter(
    slot =>
      !bookedSlotIds.includes(slot.id) &&
      isSlotInTheFuture(
        slot.date,
        slot.start_time,
        currentDateString,
        currentTimeMinutes
      )
  );

  return availableSlots as Slot[];
}

// Get slots for a date range (useful for calendar view)
export async function getSlotsByDateRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('therapy_slots')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching slots range:', error);
    return [];
  }

  return data as Slot[];
}

// Get all booked slot IDs (for filtering)
export async function getBookedSlotIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('slot_id')
    .eq('status', 'confirmed');

  if (error) {
    console.error('Error fetching booked slots:', error);
    return [];
  }

  return data?.map(booking => booking.slot_id) || [];
}

// Get booked slots with booking details
export async function getBookedSlots(therapistId?: string) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      user:users(id, full_name, email),
      slot:therapy_slots(id, date, start_time, end_time, duration_minutes, therapist_id)
    `)
    .eq('status', 'confirmed');

  if (therapistId) {
    // If therapistId is provided, filter by therapist via slot
    query = query.filter('slot.therapist_id', 'eq', therapistId);
  }

  const { data, error } = await query.order('slot.date', { ascending: true });

  if (error) {
    console.error('Error fetching booked slots:', error);
    return [];
  }

  return data || [];
}

// Get upcoming booked sessions for a therapist
export async function getTherapistUpcomingSessions(therapistId: string) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  // First get all bookings with slot info
  const { data: allBookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      user:users(id, full_name, email, phone),
      slot:therapy_slots(id, date, start_time, end_time, duration_minutes, therapist_id)
    `)
    .eq('status', 'confirmed')
    .gte('slot.date', dateString)
    .order('slot.date', { ascending: true })
    .order('slot.start_time', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming sessions:', error);
    return [];
  }

  // Filter by therapist_id (from the slot)
  const filteredSessions = (allBookings || []).filter(
    (booking: any) => booking.slot?.therapist_id === therapistId
  );

  return filteredSessions || [];
}

// Create new slot (admin only)
export async function createSlot(
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number = 45
) {
  const { data, error } = await supabase
    .from('therapy_slots')
    .upsert(
      [
        {
          date,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          is_available: true,
          is_blocked: false,
          therapist_id: '00000000-0000-0000-0000-000000000000',
        },
      ],
      {
        onConflict: 'date,start_time,therapist_id',
      }
    )
    .select();

  if (error) {
    console.error('Error creating slot:', error);
    throw error;
  }

  return data?.[0] as Slot;
}

// Update slot availability
export async function updateSlotAvailability(slotId: string, isAvailable: boolean) {
  const { data, error } = await supabase
    .from('therapy_slots')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq('id', slotId)
    .select();

  if (error) {
    console.error('Error updating slot availability:', error);
    throw error;
  }

  return data?.[0] as Slot;
}

// Block slot (admin)
export async function blockSlot(slotId: string, reason?: string) {
  const { data, error } = await supabase
    .from('therapy_slots')
    .update({
      is_blocked: true,
      blocked_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .select();

  if (error) {
    console.error('Error blocking slot:', error);
    throw error;
  }

  return data?.[0] as Slot;
}

// Unblock slot
export async function unblockSlot(slotId: string) {
  const { data, error } = await supabase
    .from('therapy_slots')
    .update({
      is_blocked: false,
      blocked_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .select();

  if (error) {
    console.error('Error unblocking slot:', error);
    throw error;
  }

  return data?.[0] as Slot;
}

// Create block schedule (block multiple slots at once)
export async function createBlockSchedule(
  startDate: string,
  endDate: string,
  blockType: 'full_day' | 'time_range',
  startTime?: string,
  endTime?: string,
  reason?: string,
  createdBy?: string
) {
  const { data, error } = await supabase
    .from('block_schedules')
    .insert([
      {
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        block_type: blockType,
        reason,
        created_by: createdBy || '00000000-0000-0000-0000-000000000000',
      },
    ])
    .select();

  if (error) {
    console.error('Error creating block schedule:', error);
    throw error;
  }

  // Apply blocking to all matching slots
  if (blockType === 'full_day') {
    const { error: blockError } = await supabase
      .from('therapy_slots')
      .update({
        is_blocked: true,
        blocked_reason: reason || 'Blocked period',
        updated_at: new Date().toISOString(),
      })
      .gte('date', startDate)
      .lte('date', endDate);

    if (blockError) {
      console.error('Error blocking slots:', blockError);
    }
  } else if (blockType === 'time_range' && startTime && endTime) {
    // Block specific time range across dates
    const { error: blockError } = await supabase
      .from('therapy_slots')
      .update({
        is_blocked: true,
        blocked_reason: reason || 'Blocked time range',
        updated_at: new Date().toISOString(),
      })
      .gte('date', startDate)
      .lte('date', endDate)
      .gte('start_time', startTime)
      .lt('end_time', endTime);

    if (blockError) {
      console.error('Error blocking time range:', blockError);
    }
  }

  return data?.[0];
}

// Delete block schedule
export async function deleteBlockSchedule(blockScheduleId: string) {
  const { error } = await supabase
    .from('block_schedules')
    .delete()
    .eq('id', blockScheduleId);

  if (error) {
    console.error('Error deleting block schedule:', error);
    throw error;
  }
}

// Get all block schedules
export async function getBlockSchedules() {
  const { data, error } = await supabase
    .from('block_schedules')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching block schedules:', error);
    return [];
  }

  return data;
}
