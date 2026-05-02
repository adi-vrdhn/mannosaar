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

  const defaultTherapistId = '00000000-0000-0000-0000-000000000000';
  const normalizedSlots = slots.map((slot) => ({
    date: slot.date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    duration_minutes: slot.duration_minutes ?? 45,
    is_available: slot.is_available ?? true,
    is_blocked: slot.is_blocked ?? false,
    blocked_reason: slot.blocked_reason ?? null,
    therapist_id: slot.therapist_id ?? defaultTherapistId,
  }));

  const uniqueDates = [...new Set(normalizedSlots.map((slot) => slot.date))];
  const { data: existingSlots } = await supabase
    .from('therapy_slots')
    .select('date, start_time, therapist_id')
    .in('date', uniqueDates)
    .eq('therapist_id', defaultTherapistId);

  const existingKeys = new Set(
    (existingSlots || []).map(
      (slot) => `${slot.date}|${slot.start_time}|${slot.therapist_id}`
    )
  );

  const overwrittenCount = normalizedSlots.filter((slot) =>
    existingKeys.has(`${slot.date}|${slot.start_time}|${slot.therapist_id}`)
  ).length;
  const createdCount = normalizedSlots.length - overwrittenCount;

  const { data, error } = await supabase
    .from('therapy_slots')
    .upsert(normalizedSlots, {
      onConflict: 'date,start_time,therapist_id',
    })
    .select();

  if (error) {
    console.error('Bulk slot creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      data,
      created: createdCount,
      overwritten: overwrittenCount,
      message:
        overwrittenCount > 0
          ? `${createdCount} slot(s) created and ${overwrittenCount} existing slot(s) updated.`
          : `${createdCount} slot(s) created successfully.`,
    },
    { status: overwrittenCount > 0 ? 200 : 201 }
  );
}
