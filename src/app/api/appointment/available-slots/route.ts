import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns';

interface SlotRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_blocked: boolean;
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const monthParam = searchParams.get('month');

    const today = new Date();
    const startDate = dateParam
      ? dateParam
      : monthParam
        ? format(startOfMonth(parseISO(monthParam)), 'yyyy-MM-dd')
        : format(today, 'yyyy-MM-dd');
    const endDate = dateParam
      ? dateParam
      : monthParam
        ? format(endOfMonth(parseISO(monthParam)), 'yyyy-MM-dd')
        : format(today, 'yyyy-MM-dd');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ data: slots, error: slotsError }, { data: bookings, error: bookingsError }, { data: blockedRanges, error: blockedError }] =
      await Promise.all([
        supabase
          .from('therapy_slots')
          .select('id, date, start_time, end_time, is_available, is_blocked')
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('is_available', true)
          .eq('is_blocked', false)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('bookings')
          .select('slot_id')
          .eq('status', 'confirmed'),
        supabase
          .from('block_schedules')
          .select('start_date, end_date')
          .lte('start_date', endDate)
          .gte('end_date', startDate),
      ]);

    if (slotsError || bookingsError || blockedError) {
      console.error('Error fetching appointment slots:', {
        slotsError,
        bookingsError,
        blockedError,
      });
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      );
    }

    const bookedSlotIds = new Set((bookings || []).map((booking) => booking.slot_id));
    const blockedDates = expandBlockedDates(blockedRanges || []);
    const todayString = format(today, 'yyyy-MM-dd');
    const currentTime = format(today, 'HH:mm');

    const filteredSlots = (slots || [])
      .filter((slot: SlotRow) => !bookedSlotIds.has(slot.id))
      .filter((slot: SlotRow) => !blockedDates.has(slot.date))
      .filter((slot: SlotRow) => slot.date >= todayString)
      .filter((slot: SlotRow) =>
        slot.date !== todayString || slot.start_time.slice(0, 5) > currentTime
      );

    const availableDates = Array.from(
      new Set(filteredSlots.map((slot: SlotRow) => slot.date))
    ).sort();

    return NextResponse.json({
      availableDates,
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
