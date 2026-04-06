import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch booking details with slot and user info
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        session_type,
        user:users(id, email, name),
        slot:therapy_slots(id, date, start_time, end_time, duration_minutes, therapist_id, meeting_link)
      `
      )
      .eq('id', bookingId)
      .single();

    const booking = bookingData as any;

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Fetch therapist details
    const { data: therapist, error: therapistError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', booking.slot.therapist_id)
      .single();

    if (therapistError || !therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Format date and time
    const bookingDate = new Date(booking.slot.date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = booking.slot.start_time;

    // Send confirmation email to client and therapist
    await sendBookingConfirmationEmail({
      clientEmail: booking.user.email,
      clientName: booking.user.name || 'Client',
      therapistEmail: therapist.email,
      therapistName: therapist.name || 'Therapist',
      sessionType: booking.session_type,
      date: booking.slot.date,
      startTime: booking.slot.start_time,
      endTime: booking.slot.end_time,
      meetingLink: booking.slot.meeting_link || undefined,
    });

    return NextResponse.json(
      { message: 'Confirmation emails sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending confirmation emails:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation emails' },
      { status: 500 }
    );
  }
}
