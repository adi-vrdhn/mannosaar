import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addDays } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view available slots' },
        { status: 403 }
      );
    }

    // Fetch available slots from next 30 days
    const today = new Date();
    const thirtyDaysLater = addDays(today, 30);

    const { data: slots, error } = await supabase
      .from('therapy_slots')
      .select('id, date, start_time, end_time')
      .eq('is_available', true)
      .eq('is_blocked', false)
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', thirtyDaysLater.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching available slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { slots: slots || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
