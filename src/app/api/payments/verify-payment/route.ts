import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createGoogleCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature, userId, userEmail, slotId, sessionType, userName, userPhone } = await request.json();

    console.log('Verify payment request:', {
      orderId,
      paymentId,
      signature: signature ? 'provided' : 'missing',
      userId,
      userEmail,
      slotId,
      sessionType,
    });

    if (!orderId || !paymentId || !signature) {
      console.error('Missing payment details:', { orderId, paymentId, signature });
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error('Razorpay key secret not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Verify payment signature
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');

    console.log('Signature verification:', {
      received: signature,
      generated: generatedSignature,
      match: generatedSignature === signature,
    });

    if (generatedSignature !== signature) {
      console.error('Invalid payment signature');
      return NextResponse.json(
        { error: 'Payment verification failed - Invalid signature' },
        { status: 400 }
      );
    }

    // Signature is valid, now create the booking
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase credentials missing:', { url: !!supabaseUrl, key: !!serviceRoleKey });
      return NextResponse.json(
        { error: 'Database service not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch slot details
    console.log('Fetching slot with ID:', slotId);
    const { data: slotData, error: slotError } = await supabase
      .from('therapy_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slotData) {
      console.error('Slot not found:', JSON.stringify(slotError, null, 2));
      return NextResponse.json(
        { error: `Slot not found: ${slotError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    console.log('Slot found:', slotData.id);

    // Create booking
    console.log('Creating booking with:', {
      user_id: userId,
      slot_id: slotId,
      session_type: sessionType,
      status: 'confirmed',
      payment_id: paymentId,
      payment_status: 'completed',
      slot_date: slotData.date,
      slot_start_time: slotData.start_time,
      slot_end_time: slotData.end_time,
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
    });

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: userId,
          slot_id: slotId,
          session_type: sessionType,
          status: 'confirmed',
          payment_id: paymentId,
          payment_status: 'completed',
          slot_date: slotData.date,
          slot_start_time: slotData.start_time,
          slot_end_time: slotData.end_time,
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
        },
      ])
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', JSON.stringify(bookingError, null, 2));
      return NextResponse.json(
        { error: `Failed to create booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    console.log('Booking created:', booking.id);

    // Generate Google Meet link and create calendar event
    console.log('🔵 Creating Google Calendar event...');
    let meetingLink = '';
    let calendarEventId = '';
    
    try {
      // For payments, we need to find the therapist. For now using a default therapist ID or admin
      const therapistId = 'default-therapist'; // This will use admin credentials as fallback
      
      console.log('🔵 Creating calendar event with:', {
        therapistId,
        clientEmail: userEmail,
        clientName: userName,
        slotDate: slotData.date,
        slotTime: slotData.start_time,
        slotEndTime: slotData.end_time,
        sessionType,
      });

      const calendarResult = await createGoogleCalendarEvent(
        therapistId,
        userEmail,
        userName,
        slotData.date,
        slotData.start_time,
        slotData.end_time,
        sessionType
      );

      console.log('✅ Calendar result:', calendarResult);

      if (calendarResult?.meetLink) {
        meetingLink = calendarResult.meetLink;
        calendarEventId = calendarResult.eventId || '';
        console.log('✅ Meeting link generated:', meetingLink);
      } else {
        console.warn('⚠️ No meeting link returned from calendar event creation');
      }

      // Update booking with meeting link and calendar event ID
      if (meetingLink || calendarEventId) {
        console.log('🔵 Updating booking with meeting link and event ID...');
        const updatePayload: any = {};
        if (meetingLink) updatePayload.meeting_link = meetingLink;
        if (calendarEventId) updatePayload.google_calendar_event_id = calendarEventId;

        const { error: updateError } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', booking.id);

        if (updateError) {
          console.error('❌ Error updating meeting link:', JSON.stringify(updateError, null, 2));
        } else {
          console.log('✅ Booking updated with meeting link:', meetingLink);
        }
      }

      // Send confirmation email
      console.log('🔵 Sending confirmation email...');
      await sendBookingConfirmationEmail({
        clientEmail: userEmail,
        clientName: userName,
        therapistEmail: process.env.EMAIL_USER || '',
        therapistName: 'Neetu Rathore',
        sessionType,
        date: slotData.date,
        startTime: slotData.start_time,
        endTime: slotData.end_time,
        meetingLink: meetingLink || '',
      });
      console.log('✅ Confirmation email sent');
    } catch (calendarError) {
      console.error('❌ Error creating calendar event:', calendarError instanceof Error ? calendarError.message : calendarError);
      console.log('⚠️ Booking created successfully even though calendar event failed. Continuing with payment completion...');
      // Don't fail the entire booking if calendar fails, just log it
    }

    // Mark slot as unavailable
    const { error: updateError } = await supabase
      .from('therapy_slots')
      .update({ is_available: false })
      .eq('id', slotId);

    if (updateError) {
      console.error('Error marking slot unavailable:', updateError);
    } else {
      console.log('Slot marked as unavailable');
    }

    // Fetch the updated booking to include meeting link
    const { data: finalBooking, error: finalError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking.id)
      .single();

    if (finalError) {
      console.error('Error fetching final booking:', finalError);
    }

    console.log('✅ Payment verification complete. Final booking:', {
      id: finalBooking?.id || booking.id,
      meeting_link: finalBooking?.meeting_link || meetingLink,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: finalBooking?.id || booking.id,
        orderId,
        paymentId,
        sessionType,
        meeting_link: finalBooking?.meeting_link || meetingLink || null,
        google_calendar_event_id: finalBooking?.google_calendar_event_id || calendarEventId || null,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to verify payment: ${errorMsg}` },
      { status: 500 }
    );
  }
}
