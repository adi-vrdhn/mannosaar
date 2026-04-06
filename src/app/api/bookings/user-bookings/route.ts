import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to fetch bookings (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user details (including role)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return NextResponse.json({ bookings: [], error: 'User not found' }, { status: 200 });
    }

    console.log('🔍 Fetching bookings for user:', userData.id, 'role:', userData.role);

    let query = supabase
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .order('slot_date', { ascending: false });

    // If user is NOT admin/therapist, only show their own bookings
    if (userData.role !== 'admin' && userData.role !== 'therapist') {
      query = query.eq('user_id', userData.id);
      console.log('👤 User role - showing only own bookings');
    } else {
      console.log('👨‍💼 Admin/Therapist role - showing all client bookings');
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({
        bookings: [],
        error: bookingsError.message,
      }, { status: 200 });
    }

    console.log('✅ Bookings fetched:', {
      count: bookings?.length || 0,
      role: userData.role,
      bookings: bookings?.map(b => ({ id: b.id, user_id: b.user_id, slot_date: b.slot_date, status: b.status }))
    });

    return NextResponse.json({ 
      bookings: bookings || [],
      count: bookings?.length || 0,
      role: userData.role
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error in user-bookings API:', error);
    return NextResponse.json(
      { error: 'Internal server error', bookings: [] },
      { status: 500 }
    );
  }
}
