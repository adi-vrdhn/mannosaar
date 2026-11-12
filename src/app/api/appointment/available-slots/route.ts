import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithNetworkRetry } from '@/lib/supabase/retry-fetch';
import { getServiceById, sessionEndTime } from '@/lib/services';
import { overlaps, slotEndInstant, slotInstant } from '@/lib/whatsapp/core';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns';
import {
  getCurrentComparableTimestamp,
  getCurrentDateString,
  getCurrentTimeInMinutes,
  isSlotAfterLeadTime,
  isSlotInTheFuture,
} from '@/lib/time';

const MINIMUM_BOOKING_LEAD_MINUTES = 4 * 60;

interface SlotRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_blocked: boolean;
  therapist_id: string;
}

function expandBlockedDates(
  ranges: Array<{ start_date: string; end_date: string }>
) {
  const blockedDates = new Set<string>();

  for (const range of ranges) {
    const days = eachDayOfInterval({
      start: parseISO(range.start_date),
      end: parseISO(range.end_date),
    });

    for (const day of days) {
      blockedDates.add(format(day, 'yyyy-MM-dd'));
    }
  }

  return blockedDates;
}

function isMissingReservationsTable(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === 'PGRST205' || error.code === '42P01')
    && error.message?.includes('booking_reservations'));
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const monthParam = searchParams.get('month');
    const service = getServiceById(searchParams.get('type'));
    if (!service) return NextResponse.json({ error: 'Invalid session type' }, { status: 400 });

    const currentDateString = getCurrentDateString();
    const currentTimeMinutes = getCurrentTimeInMinutes();
    const currentComparableTimestamp = getCurrentComparableTimestamp();
    const startDate = dateParam
      ? dateParam
      : monthParam
        ? format(startOfMonth(parseISO(monthParam)), 'yyyy-MM-dd')
        : currentDateString;
    const endDate = dateParam
      ? dateParam
      : monthParam
        ? format(endOfMonth(parseISO(monthParam)), 'yyyy-MM-dd')
        : currentDateString;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: fetchWithNetworkRetry },
      }
    );

    const rangeStart = slotInstant(startDate, '00:00:00');
    const rangeEnd = new Date(Date.parse(slotInstant(endDate, '00:00:00')) + 86400_000).toISOString();
    const [{ data: slots, error: slotsError }, { data: bookings, error: bookingsError }, { data: blockedRanges, error: blockedError }, { data: reservations, error: reservationError }] =
      await Promise.all([
        supabase
          .from('therapy_slots')
          .select('id, date, start_time, end_time, is_available, is_blocked, therapist_id')
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('is_available', true)
          .eq('is_blocked', false)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('bookings')
          .select('slot_id,slot_date,slot_start_time,slot_end_time,session_type,session_dates,slot:therapy_slots(therapist_id)')
          .eq('status', 'confirmed'),
        supabase
          .from('block_schedules')
          .select('start_date, end_date')
          .lte('start_date', endDate)
          .gte('end_date', startDate),
        supabase.from('booking_reservations').select('therapist_id,span,hold:booking_holds(status,expires_at)').overlaps('span', `[${rangeStart},${rangeEnd})`),
      ]);

    const reservationsUnavailable = isMissingReservationsTable(reservationError);
    if (slotsError || bookingsError || blockedError || (reservationError && !reservationsUnavailable)) {
      console.error('Error fetching appointment slots:', {
        slotsError,
        bookingsError,
        blockedError,
        reservationError,
      });
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      );
    }

    const bookedSlotIds = new Set((bookings || []).map((booking) => booking.slot_id));
    const blockedDates = expandBlockedDates(blockedRanges || []);
    const occupied = (reservations || []).flatMap(reservation => {
      const hold = Array.isArray(reservation.hold) ? reservation.hold[0] : reservation.hold;
      if (hold && (hold.status !== 'ACTIVE' || Date.parse(hold.expires_at) <= Date.now())) return [];
      const [start, end] = String(reservation.span).slice(1, -1).split(',').map(value => value.replaceAll('"', ''));
      return [{ therapistId: reservation.therapist_id, start, end }];
    });

    for (const booking of bookings || []) {
      const slotRelation = Array.isArray(booking.slot) ? booking.slot[0] : booking.slot;
      const therapistId = slotRelation?.therapist_id;
      if (!therapistId) continue;
      const dates = Array.isArray(booking.session_dates) && booking.session_dates.length
        ? booking.session_dates as Array<{ date: string; start_time: string; end_time?: string }>
        : [{ date: booking.slot_date, start_time: booking.slot_start_time, end_time: booking.slot_end_time }];
      for (const entry of dates) {
        if (!entry.date || !entry.start_time) continue;
        const endTime = entry.end_time || sessionEndTime(entry.start_time, booking.session_type);
        if (!endTime) continue;
        occupied.push({ therapistId, start: slotInstant(entry.date, entry.start_time), end: slotEndInstant(entry.date, entry.start_time, endTime) });
      }
    }

    const filteredSlots = (slots || [])
      .filter((slot: SlotRow) => !bookedSlotIds.has(slot.id))
      .filter((slot: SlotRow) => {
        const endTime = sessionEndTime(slot.start_time, service.id);
        if (!endTime) return false;
        const span = { start: slotInstant(slot.date, slot.start_time), end: slotEndInstant(slot.date, slot.start_time, endTime) };
        return !occupied.some(reservation => reservation.therapistId === slot.therapist_id && overlaps(span, reservation));
      })
      .filter((slot: SlotRow) => !blockedDates.has(slot.date))
      .filter((slot: SlotRow) => slot.date >= currentDateString)
      .filter((slot: SlotRow) =>
        isSlotInTheFuture(
          slot.date,
          slot.start_time,
          currentDateString,
          currentTimeMinutes
        )
      )
      .filter((slot: SlotRow) =>
        isSlotAfterLeadTime(
          slot.date,
          slot.start_time,
          MINIMUM_BOOKING_LEAD_MINUTES,
          currentComparableTimestamp
        )
      )
      .map((slot: SlotRow) => ({ ...slot, end_time: sessionEndTime(slot.start_time, service.id)! }));

    const availableDates = Array.from(
      new Set(filteredSlots.map((slot: SlotRow) => slot.date))
    ).sort();

    return NextResponse.json({
      availableDates,
      bookingReady: true,
      slots: dateParam
        ? filteredSlots.filter((slot: SlotRow) => slot.date === dateParam)
        : filteredSlots,
    });
  } catch (error) {
    console.error('Error loading available appointment slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
