import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createGoogleCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmationEmail } from '@/lib/email';

// Generate a random 6-digit meeting password
function generateMeetingPassword(): string {
  return Math.random().toString().substring(2, 8);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, slotId, sessionType } = await request.json();
    console.log('📝 Booking request received:', { 
      userId, 
      slotId, 
      sessionType,
      sessionUserId: session.user?.id,
      sessionEmail: session.user?.email 
    });

    if (!userId || !slotId || !sessionType) {
      console.error('❌ Missing required fields:', { userId, slotId, sessionType });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch slot details to get date/time and therapist info
    console.log('🔵 Fetching slot:', slotId);
    const { data: slotData, error: slotError } = await supabase
      .from('therapy_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slotData) {
      console.error('❌ Slot not found:', slotError);
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 400 }
      );
    }
    console.log('✅ Slot found:', slotData);

    // Fetch client/booking user details
    console.log('🔵 Fetching user:', userId);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }
    console.log('✅ User found:', userData);

    const meetingPassword = generateMeetingPassword();

    // Check if slot is already booked (prevent race condition)
    console.log('🔵 Checking if slot is still available...');
    const { data: slotCheck, error: checkError } = await supabase
      .from('therapy_slots')
      .select('is_available, id')
      .eq('id', slotId)
      .single();

    if (checkError || !slotCheck?.is_available) {
      console.error('❌ Slot no longer available:', checkError);
      return NextResponse.json(
        { error: 'Slot is no longer available. Please refresh and select another slot.' },
        { status: 409 }
      );
    }

    // First create the booking in database
    console.log('🔵 Creating booking...');
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: userId,
          user_name: userData.name || 'Client',
          user_email: userData.email,
          user_phone: userData.phone || userData.phone_number || '',
          slot_id: slotId,
          slot_date: slotData.date,
          slot_start_time: slotData.start_time,
          slot_end_time: slotData.end_time,
          session_type: sessionType,
          status: 'confirmed',
          meeting_password: meetingPassword,
        },
      ])
      .select();

    if (bookingError) {
      console.error('❌ Booking creation error:', bookingError);
      return NextResponse.json({ error: bookingError.message }, { status: 400 });
    }

    const booking = bookingData[0];
    console.log('✅ Booking created:', booking);

    // NOW mark the slot as unavailable to prevent other bookings
    console.log('🔵 Marking slot as unavailable...');
    const { error: slotUpdateError } = await supabase
      .from('therapy_slots')
      .update({ is_available: false })
      .eq('id', slotId);

    if (slotUpdateError) {
      console.warn('⚠️ Failed to update slot availability:', slotUpdateError);
      // Don't fail the booking if this fails, but log it
    } else {
      console.log('✅ Slot marked as unavailable');
    }

    // Now create Google Calendar event using the therapist's Google credentials
    // (based on who created the slot, not who is booking)
    let meetLink = null;
    try {
      console.log('🔵 Creating Google Calendar event...');
      const googleEvent = await createGoogleCalendarEvent(
        slotData.therapist_id,
        userData.email,
        userData.name || 'Client',
        slotData.date,
        slotData.start_time,
        slotData.end_time,
        sessionType
      );

      console.log('✅ Google Calendar event response:', googleEvent);
      meetLink = googleEvent.meetLink;

      // Update booking with Google Meet link
      if (meetLink) {
        console.log('✅ Updating booking with meet link:', meetLink);
        await supabase
          .from('bookings')
          .update({ meeting_link: meetLink })
          .eq('id', booking.id);

        booking.meeting_link = meetLink;
      } else {
        console.warn('⚠️ No meet link returned from Google Calendar event');
      }
    } catch (googleError) {
      const errorMsg = googleError instanceof Error ? googleError.message : 'Unknown error';
      console.error('❌ Google Calendar integration error (detailed):', {
        error: errorMsg,
        stack: googleError instanceof Error ? googleError.stack : 'No stack trace',
      });
      // Don't fail the booking if Google Calendar fails
    }

    // Send confirmation emails to client and therapist
    try {
      // Fetch therapist details
      const { data: therapistData } = await supabase
        .from('users')
        .select('*')
        .eq('id', slotData.therapist_id)
        .single();

      if (therapistData?.email) {
        await sendBookingConfirmationEmail({
          clientEmail: userData.email,
          clientName: userData.name || 'Client',
          therapistEmail: therapistData.email,
          therapistName: therapistData.name || 'Therapist',
          sessionType,
          date: slotData.date,
          startTime: slotData.start_time,
          endTime: slotData.end_time,
          meetingLink: meetLink,
          meetingPassword: booking.meeting_password,
        });
      }
    } catch (emailError) {
      console.warn('⚠️ Email sending error (non-blocking):', emailError);
      // Don't fail the booking if email fails
    }

    console.log('✅ Booking API returning:', { booking });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('❌ Create booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
