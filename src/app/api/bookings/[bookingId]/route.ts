'use server';

import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is admin or owner of the booking
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, id')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    // Fetch detailed booking information
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(*),
        slot:therapy_slots(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check authorization: admin can access all, users can only access their own
    const isAdmin = userData?.role === 'admin';
    const isOwner = booking.user_id === session.user.id;

    console.log('🔐 Authorization check:', {
      userId: session.user.id,
      bookingUserId: booking.user_id,
      userRole: userData?.role,
      isAdmin,
      isOwner,
    });

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Format the response
    const formattedBooking = {
      id: booking.id,
      user: {
        name: booking.user.name,
        email: booking.user.email,
        phone_number: booking.user.phone_number,
      },
      slot: {
        date: booking.slot.date,
        start_time: booking.slot.start_time,
        end_time: booking.slot.end_time,
        duration_minutes: booking.slot.duration_minutes,
      },
      session_type: booking.session_type,
      status: booking.status,
      notes: booking.notes,
      sessions_taken_before: booking.sessions_taken_before,
      payment_status: booking.payment_status,
      meeting_link: booking.meeting_link,
      meeting_links: booking.meeting_links,
      meeting_password: booking.meeting_password,
      created_at: booking.created_at,
      cancelled_at: booking.cancelled_at,
      number_of_sessions: booking.number_of_sessions,
      session_dates: booking.session_dates,
    };

    return NextResponse.json(formattedBooking);
  } catch (error) {
    console.error('❌ Get booking details error:', error);
    return NextResponse.json(
      { error: 'Failed to get booking details' },
      { status: 500 }
    );
  }
}
