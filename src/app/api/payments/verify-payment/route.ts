import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createGoogleCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmationEmail } from '@/lib/email';

interface SessionDateWithSlot {
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      orderId,
      paymentId,
      signature,
      userId,
      userEmail,
      slotId, // for single bookings
      sessionType,
      userName,
      userPhone,
      bundle, // for bundle bookings
      sessionDates, // for bundle bookings
    } = await request.json();

    console.log('Verify payment request:', {
      orderId,
      paymentId,
      signature: signature ? 'provided' : 'missing',
      userId,
      userEmail,
      slotId,
      bundle,
      isBundleBooking: !!sessionDates && sessionDates.length > 0,
      sessionType,
    });

    if (!orderId || !paymentId || !signature) {
      console.error('Missing payment details:', { orderId, paymentId, signature });
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
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
      console.error('Supabase credentials missing');
      return NextResponse.json(
        { error: 'Database service not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Determine if this is a bundle or single booking
    const isBundleBooking = sessionDates && sessionDates.length > 0;
    let slotDataForCalendar: any = null;
    let bookingPayload: any = {
      user_id: userId,
      session_type: sessionType,
      status: 'confirmed',
      payment_id: paymentId,
      payment_status: 'completed',
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
    };

    if (isBundleBooking) {
      // Bundle booking
      console.log('🔵 Processing bundle booking with', sessionDates.length, 'sessions');
      bookingPayload.number_of_sessions = sessionDates.length;
      // Convert camelCase to snake_case for database storage
      bookingPayload.session_dates = sessionDates.map((session: any) => ({
        date: session.date,
        slot_id: session.slotId,
        start_time: session.startTime,
        end_time: session.endTime,
      }));
      // Use first session's date/time for slot_date fields (for backward compatibility)
      if (sessionDates[0]) {
        bookingPayload.slot_id = sessionDates[0].slotId;
        bookingPayload.slot_date = sessionDates[0].date;
        bookingPayload.slot_start_time = sessionDates[0].startTime;
        bookingPayload.slot_end_time = sessionDates[0].endTime;
      }
    } else {
      // Single booking
      console.log('🔵 Fetching slot with ID:', slotId);
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

      console.log('✅ Slot found:', slotData.id);
      slotDataForCalendar = slotData;

      bookingPayload.slot_id = slotId;
      bookingPayload.slot_date = slotData.date;
      bookingPayload.slot_start_time = slotData.start_time;
      bookingPayload.slot_end_time = slotData.end_time;
    }

    // Create booking
    console.log('🔵 Creating booking...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingPayload])
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', JSON.stringify(bookingError, null, 2));
      return NextResponse.json(
        { error: `Failed to create booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Booking created:', booking.id);

    // Generate Google Meet links and create calendar events
    console.log('🔵 Creating Google Calendar events...');
    const meetingLinks: string[] = [];
    const calendarTherapistId = 'default-therapist'; // Uses admin credentials as fallback

    try {
      if (isBundleBooking) {
        // Create calendar event for each session in bundle
        for (const [index, session] of sessionDates.entries()) {
          try {
            console.log(`🔵 Creating calendar event for session ${index + 1}/${sessionDates.length}...`);
            const calendarResult = await createGoogleCalendarEvent(
              calendarTherapistId,
              userEmail,
              userName,
              session.date,
              session.startTime,
              session.endTime,
              sessionType
            );

            if (calendarResult?.meetLink) {
              meetingLinks.push(calendarResult.meetLink);
              console.log(`✅ Meeting link ${index + 1} generated:`, calendarResult.meetLink);
            }
          } catch (sessionError) {
            console.warn(`❌ Failed to create calendar event for session ${index + 1}:`, sessionError);
            // Continue with next session even if this one fails
          }
        }
      } else {
        // Single booking - create one calendar event
        const calendarResult = await createGoogleCalendarEvent(
          calendarTherapistId,
          userEmail,
          userName,
          slotDataForCalendar.date,
          slotDataForCalendar.start_time,
          slotDataForCalendar.end_time,
          sessionType
        );

        console.log('✅ Calendar result:', calendarResult);

        if (calendarResult?.meetLink) {
          meetingLinks.push(calendarResult.meetLink);
          console.log('✅ Meeting link generated:', calendarResult.meetLink);
        } else {
          console.warn('⚠️ No meeting link returned from calendar event creation');
        }
      }

      // Update booking with meeting links
      if (meetingLinks.length > 0) {
        console.log('🔵 Updating booking with meeting links...');
        const updatePayload: any = {};

        if (isBundleBooking && meetingLinks.length > 1) {
          // Store all meeting links as JSON array for bundle
          updatePayload.meeting_links = meetingLinks;
          updatePayload.meeting_link = meetingLinks[0]; // Also store first link in meeting_link for backward compatibility
        } else {
          // Single booking or bundle with only one link
          updatePayload.meeting_link = meetingLinks[0];
        }

        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', booking.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating meeting links:', JSON.stringify(updateError, null, 2));
        } else {
          console.log('✅ Booking updated with meeting links:', updatedBooking);
          // Update the booking with the returned updated data
          Object.assign(booking, updatedBooking);
        }
      }

      // Send confirmation email (single email for all sessions)
      console.log('🔵 Sending confirmation email...');
      const emailDate = isBundleBooking
        ? `${sessionDates.length} sessions scheduled`
        : slotDataForCalendar.date;
      const emailStartTime = isBundleBooking ? 'Varies' : slotDataForCalendar.start_time;
      const emailEndTime = isBundleBooking ? 'Varies' : slotDataForCalendar.end_time;
      const sessionSchedule = isBundleBooking
        ? sessionDates.map((session: any) => ({
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
          }))
        : [
            {
              date: slotDataForCalendar.date,
              startTime: slotDataForCalendar.start_time,
              endTime: slotDataForCalendar.end_time,
            },
          ];

      const therapistId = slotDataForCalendar?.therapist_id || calendarTherapistId;
      const { data: therapistData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', therapistId)
        .single();

      await sendBookingConfirmationEmail({
        clientEmail: userEmail,
        clientName: userName,
        therapistEmail:
          therapistData?.email || process.env.THERAPIST_EMAIL || process.env.EMAIL_USER || '',
        therapistName: therapistData?.name || 'Therapist',
        sessionType,
        date: emailDate,
        startTime: emailStartTime,
        endTime: emailEndTime,
        sessionSchedule,
        meetingLink: meetingLinks[0] || '',
      });
      console.log('✅ Confirmation email sent');
    } catch (calendarError) {
      console.error('❌ Error in calendar/email processing:', calendarError instanceof Error ? calendarError.message : calendarError);
      // Don't fail the booking if calendar/email fails
    }

    // Mark slots as unavailable
    if (isBundleBooking) {
      // Mark each slot in the bundle as unavailable
      for (const session of sessionDates) {
        const { error: slotUpdateError } = await supabase
          .from('therapy_slots')
          .update({ is_available: false })
          .eq('id', session.slotId);

        if (slotUpdateError) {
          console.warn(`⚠️ Failed to mark slot ${session.slotId} unavailable:`, slotUpdateError);
        } else {
          console.log(`✅ Slot ${session.slotId} marked as unavailable`);
        }
      }
    } else {
      // Single booking - mark single slot
      const { error: updateError } = await supabase
        .from('therapy_slots')
        .update({ is_available: false })
        .eq('id', slotId);

      if (updateError) {
        console.error('Error marking slot unavailable:', updateError);
      } else {
        console.log('Slot marked as unavailable');
      }
    }

    // Fetch the updated booking
    const { data: finalBooking, error: finalError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking.id)
      .single();

    console.log('✅ Final booking fetched from DB:', {
      id: finalBooking?.id || booking.id,
      meeting_link: finalBooking?.meeting_link,
      meeting_links: finalBooking?.meeting_links,
      isBundleBooking,
      sessions: isBundleBooking ? sessionDates.length : 1,
    });

    if (finalError) {
      console.error('Error fetching final booking:', finalError);
    }

    console.log('✅ Payment verification complete. Final booking:', {
      id: finalBooking?.id || booking.id,
      isBundleBooking,
      sessions: isBundleBooking ? sessionDates.length : 1,
      meetingLinks: meetingLinks,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: finalBooking?.id || booking.id,
        orderId,
        paymentId,
        sessionType,
        isBundleBooking,
        number_of_sessions: isBundleBooking ? bundle : 1,
        meeting_link: finalBooking?.meeting_link || meetingLinks[0] || null,
        meeting_links: finalBooking?.meeting_links || (meetingLinks.length > 1 ? meetingLinks : undefined),
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
