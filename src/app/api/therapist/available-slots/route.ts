import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { addDays } from 'date-fns';
import {
  getCurrentDateString,
  isSlotInTheFuture,
} from '@/lib/time';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view available slots' },
        { status: 403 }
      );
    }

    // Fetch available slots from next 30 days
    const currentDateString = getCurrentDateString();
    const thirtyDaysLater = addDays(new Date(), 30);
    const thirtyDaysLaterString = thirtyDaysLater.toISOString().split('T')[0];

    const { data: slots, error } = await supabase
      .from('therapy_slots')
      .select('id, date, start_time, end_time')
      .eq('is_available', true)
      .eq('is_blocked', false)
      .gte('date', currentDateString)
      .lte('date', thirtyDaysLaterString)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching available slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      );
    }

    const filteredSlots = (slots || []).filter((slot) =>
      isSlotInTheFuture(slot.date, slot.start_time, currentDateString)
    );

    return NextResponse.json({ slots: filteredSlots }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
