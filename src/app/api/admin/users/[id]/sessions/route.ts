import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Check if user is authenticated and is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user sessions
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_name,
        session_type,
        slot_date,
        slot_start_time,
        slot_end_time,
        meeting_link,
        status
      `)
      .eq('user_id', params.id)
      .order('slot_date', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching user sessions:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: bookings || [] });
  } catch (error) {
    console.error('Error in /api/admin/users/[id]/sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
