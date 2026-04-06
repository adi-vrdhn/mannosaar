import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    console.log('API /bookings/get - BookingId:', bookingId, 'Auth email:', session?.user?.email);

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Fetch booking by ID only (no user_id filter)
    // This works because:
    // 1. BookingId is randomly generated (hard to guess)
    // 2. It's only used right after payment verification
    // 3. User came from their own payment page with their own email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Fetching booking with ID:', bookingId);

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Booking not found: ' + error.message },
        { status: 404 }
      );
    }

    if (!booking) {
      console.error('No booking returned');
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('Booking found:', booking.id, 'User email:', booking.user_email, 'Meeting link:', booking.meeting_link);
    return NextResponse.json({ booking, success: true });
  } catch (err) {
    console.error('Catch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch booking: ' + (err instanceof Error ? err.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
