import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { bookingId, meetingLink, meetingPassword, googleCalendarEventId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      );
    }

    if (!meetingLink) {
      return NextResponse.json(
        { error: 'Missing meeting link' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('Updating booking with Zoom details:', {
      bookingId,
      meetingLink,
      meetingPassword: meetingPassword ? '***' : 'not provided',
    });

    const { data, error } = await supabase
      .from('bookings')
      .update({
        meeting_link: meetingLink,
        meeting_password: meetingPassword,
        ...(googleCalendarEventId && { google_calendar_event_id: googleCalendarEventId }),
      })
      .eq('id', bookingId)
      .select();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json(
        { error: `Failed to update booking: ${error.message}` },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      console.warn('No booking found with ID:', bookingId);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('Booking updated successfully with Zoom link');
    return NextResponse.json({ success: true, booking: data[0] }, { status: 200 });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
