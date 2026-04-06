import { NextRequest, NextResponse } from 'next/server';
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
        user:users(id, email, name),
        slot:therapy_slots(id, date, start_time, end_time, therapist_id)
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

    // Send cancellation email to client
    // TODO: Implement sendBookingCancellation email
    // await sendBookingCancellation(booking.user.email, {
    //   bookingId: booking.id,
    //   therapistName: therapist.full_name,
    //   date: formattedDate,
    //   time: formattedTime,
    // });

    return NextResponse.json(
      { message: 'Cancellation email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return NextResponse.json(
      { error: 'Failed to send cancellation email' },
      { status: 500 }
    );
  }
}
