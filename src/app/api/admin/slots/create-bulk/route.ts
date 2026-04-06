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

  const { slots } = await request.json();

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: 'Missing or invalid slots array' }, { status: 400 });
  }

  // Check for duplicates before inserting
  const { data: existingSlots } = await supabase
    .from('therapy_slots')
    .select('date, start_time, end_time')
    .in(
      'date',
      [...new Set(slots.map((s) => s.date))]
    );

  const existingSet = new Set(
    (existingSlots || []).map((s) => `${s.date}|${s.start_time}|${s.end_time}`)
  );

  const newSlots = slots.filter((s) => {
    const key = `${s.date}|${s.start_time}|${s.end_time}`;
    return !existingSet.has(key);
  });

  if (newSlots.length === 0) {
    return NextResponse.json(
      { error: 'All slots already exist', skipped: slots.length },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('therapy_slots')
    .insert(newSlots)
    .select();

  if (error) {
    console.error('Bulk slot creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      data,
      created: newSlots.length,
      skipped: slots.length - newSlots.length,
    },
    { status: 201 }
  );
}
