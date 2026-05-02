import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is admin using service role
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

  const { date, startTime, endTime } = await request.json();

  if (!date || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const therapistId = '00000000-0000-0000-0000-000000000000';
  const { data: existingSlot } = await supabase
    .from('therapy_slots')
    .select('id')
    .eq('date', date)
    .eq('start_time', startTime)
    .eq('therapist_id', therapistId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('therapy_slots')
    .upsert(
      [
        {
          date,
          start_time: startTime,
          end_time: endTime,
          is_available: true,
          is_blocked: false,
          therapist_id: therapistId,
        },
      ],
      {
        onConflict: 'date,start_time,therapist_id',
      }
    )
    .select();

  if (error) {
    console.error('Slot creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      data,
      message: existingSlot
        ? 'This slot already existed and was updated.'
        : 'Slot created successfully.',
      overwritten: !!existingSlot,
    },
    { status: existingSlot ? 200 : 201 }
  );
}
