import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is admin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .single();

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const blockData = await request.json();

    // Add the created_by field from the authenticated user
    const blockDataWithUser = {
      ...blockData,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('block_schedules')
      .insert([blockDataWithUser])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If it's a full day block, mark all therapy_slots for those dates as blocked
    if (blockDataWithUser.block_type === 'full_day') {
      const { error: slotsError } = await supabase
        .from('therapy_slots')
        .update({ is_blocked: true, blocked_reason: blockDataWithUser.reason || null })
        .gte('date', blockDataWithUser.start_date)
        .lte('date', blockDataWithUser.end_date);

      if (slotsError) {
        console.error('Error blocking slots:', slotsError);
        // Still return success for block_schedule creation, but log the slot blocking error
      }
    } else if (blockDataWithUser.block_type === 'time_range') {
      // For time range, mark only slots within the time range as blocked
      const { error: slotsError } = await supabase
        .from('therapy_slots')
        .update({ is_blocked: true, blocked_reason: blockDataWithUser.reason || null })
        .gte('date', blockDataWithUser.start_date)
        .lte('date', blockDataWithUser.end_date)
        .gte('start_time', blockDataWithUser.start_time)
        .lte('start_time', blockDataWithUser.end_time);

      if (slotsError) {
        console.error('Error blocking time range slots:', slotsError);
        // Still return success for block_schedule creation
      }
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating block schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create block schedule' },
      { status: 500 }
    );
  }
}
