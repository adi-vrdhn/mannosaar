import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
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
    .select('role')
    .eq('email', session.user.email)
    .single();

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { blockId } = await request.json();

    if (!blockId) {
      return NextResponse.json({ error: 'Block ID required' }, { status: 400 });
    }

    // Get the block schedule to know what to unblock
    const { data: blockSchedule, error: fetchError } = await supabase
      .from('block_schedules')
      .select('*')
      .eq('id', blockId)
      .single();

    if (fetchError || !blockSchedule) {
      return NextResponse.json({ error: 'Block schedule not found' }, { status: 404 });
    }

    // Delete the block schedule
    const { error } = await supabase
      .from('block_schedules')
      .delete()
      .eq('id', blockId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Unblock therapy_slots for those dates
    if (blockSchedule.block_type === 'full_day') {
      await supabase
        .from('therapy_slots')
        .update({ is_blocked: false, blocked_reason: null })
        .gte('date', blockSchedule.start_date)
        .lte('date', blockSchedule.end_date)
        .eq('blocked_reason', blockSchedule.reason || null);
    } else if (blockSchedule.block_type === 'time_range') {
      await supabase
        .from('therapy_slots')
        .update({ is_blocked: false, blocked_reason: null })
        .gte('date', blockSchedule.start_date)
        .lte('date', blockSchedule.end_date)
        .gte('start_time', blockSchedule.start_time)
        .lte('start_time', blockSchedule.end_time)
        .eq('blocked_reason', blockSchedule.reason || null);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete block schedule' },
      { status: 500 }
    );
  }
}
