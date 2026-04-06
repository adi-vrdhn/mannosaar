import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface BlockSlotRequest {
  slots: Array<{
    date: string;
    time: string;
  }>;
  reason?: string;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  const { slots, reason } = (await request.json()) as BlockSlotRequest;

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: 'No slots provided' }, { status: 400 });
  }

  try {
    // Parse each slot and block it
    const slotUpdates = slots.map((slot) => {
      const [startTime, endTime] = slot.time.split(' - ');
      return {
        date: slot.date,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
      };
    });

    // Update each slot to mark as blocked
    const blockedSlots: string[] = [];
    
    for (const slotUpdate of slotUpdates) {
      const { data: slot, error: fetchError } = await supabase
        .from('therapy_slots')
        .select('id')
        .eq('date', slotUpdate.date)
        .eq('start_time', slotUpdate.start_time)
        .eq('end_time', slotUpdate.end_time)
        .single();

      if (!fetchError && slot) {
        const { error: updateError } = await supabase
          .from('therapy_slots')
          .update({
            is_blocked: true,
            blocked_reason: reason || null,
          })
          .eq('id', slot.id);

        if (!updateError) {
          blockedSlots.push(slot.id);
        }
      }
    }

    if (blockedSlots.length === 0) {
      return NextResponse.json(
        { error: 'No slots found to block' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: `Successfully blocked ${blockedSlots.length} slot(s)`,
        blockedSlots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Block slots error:', error);
    return NextResponse.json(
      { error: 'Failed to block slots: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
