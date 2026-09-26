'use server';

import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/lib/google-calendar';
import { sendRescheduleNotificationWhatsApp } from '@/lib/whatsapp';
import { sendAdminRescheduleNotificationEmail, sendBookingPostponedEmail } from '@/lib/email';
import { getTherapistNotificationRecipients } from '@/lib/therapist-email';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  try {
    const body = await request.json();
    const { bookingId, newSlotId, sessionIndex } = body;

    if (!bookingId || !newSlotId) {
      return NextResponse.json(
        { error: 'Booking and new slot are required.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the current booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.booking_source === 'WHATSAPP') {
      return NextResponse.json({ error: 'Manage this booking through WhatsApp or the WhatsApp operations dashboard.' }, { status: 409 });
    }

    // Verify ownership
    if (booking.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isBundleSession = Boolean(booking.number_of_sessions && booking.number_of_sessions > 1);
    if (isBundleSession && (!Number.isInteger(sessionIndex) || !booking.session_dates?.[sessionIndex])) {
      return NextResponse.json({ error: 'Select the bundle session you want to reschedule.' }, { status: 400 });
    }
    const bundleSessionIndex = typeof sessionIndex === 'number' ? sessionIndex : 0;
    const oldSession = isBundleSession ? booking.session_dates[bundleSessionIndex] : null;
    const previousRescheduleData = isBundleSession
      ? oldSession
      : Array.isArray(booking.session_dates) ? booking.session_dates[0] : null;
    if (previousRescheduleData?.rescheduled_at || Number(previousRescheduleData?.reschedule_count || 0) >= 1) {
      return NextResponse.json({ error: 'This session has already been rescheduled once.' }, { status: 409 });
    }
    const currentSlotId = oldSession?.slotId || oldSession?.slot_id || booking.slot_id;
    const originalDate = oldSession?.date || booking.slot_date;
    const originalStartTime = oldSession?.start_time || oldSession?.startTime || booking.slot_start_time;
    const originalEndTime = oldSession?.end_time || oldSession?.endTime || booking.slot_end_time;

    // Check if the new slot is already booked
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', newSlotId)
      .eq('status', 'confirmed')
      .neq('id', bookingId);

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'This slot was just booked. Please select another.' },
        { status: 409 }
      );
    }

    // Check if user is selecting the same slot
    if (currentSlotId === newSlotId) {
      return NextResponse.json(
        { error: 'You already have this slot. Please choose a different time.' },
        { status: 400 }
      );
    }

    // Validate the target before changing the existing booking.
    const { data: newSlot, error: slotFetchError } = await supabase
      .from('therapy_slots')
      .select('id, date, start_time, end_time, therapist_id, is_available, is_blocked')
      .eq('id', newSlotId)
      .single();

    if (slotFetchError || !newSlot) {
      console.error('❌ Error fetching new slot:', slotFetchError);
      return NextResponse.json(
        { error: 'New slot not found' },
        { status: 404 }
      );
    }
    if (!newSlot.is_available || newSlot.is_blocked) {
      return NextResponse.json({ error: 'This slot is no longer available. Please choose another.' }, { status: 409 });
    }
    if (booking.therapist_id && newSlot.therapist_id && booking.therapist_id !== newSlot.therapist_id) {
      return NextResponse.json({ error: 'Please choose a slot offered by your current therapist.' }, { status: 400 });
    }

    console.log('📅 New slot details retrieved:', newSlot);

    // For bundle bookings, handle session_dates update
    const updateData: Record<string, unknown> = isBundleSession
      ? {}
      : {
          slot_id: newSlotId,
          slot_date: newSlot.date,
          slot_start_time: newSlot.start_time,
          slot_end_time: newSlot.end_time,
          session_dates: [{
            date: newSlot.date,
            slot_id: newSlotId,
            start_time: newSlot.start_time,
            end_time: newSlot.end_time,
            rescheduled_at: new Date().toISOString(),
            reschedule_count: 1,
            original_date: originalDate,
            original_start_time: originalStartTime,
            original_end_time: originalEndTime,
          }],
        };

    // If bundle booking and sessionIndex is provided, update that specific session
    if (isBundleSession) {
      if (booking.session_dates && Array.isArray(booking.session_dates)) {
        const updatedSessions = [...booking.session_dates];
        if (updatedSessions[sessionIndex]) {
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            date: newSlot.date,
            start_time: newSlot.start_time,
            end_time: newSlot.end_time,
            slot_id: newSlotId,
            slotId: newSlotId,
            rescheduled_at: new Date().toISOString(),
            reschedule_count: 1,
            original_date: originalDate,
            original_start_time: originalStartTime,
            original_end_time: originalEndTime,
          };
          updateData.session_dates = updatedSessions;
          if (bundleSessionIndex === 0) {
            updateData.slot_id = newSlotId;
            updateData.slot_date = newSlot.date;
            updateData.slot_start_time = newSlot.start_time;
            updateData.slot_end_time = newSlot.end_time;
          }
        }
      }
    }

    let newMeetingLink = '';
    let newGoogleEventId = '';

    try {
      const calendarResult = await createGoogleCalendarEvent(
        booking.therapist_id || 'default-therapist',
        booking.user_email || session.user?.email || '',
        booking.user_name || session.user?.name || 'Client',
        newSlot.date,
        newSlot.start_time,
        newSlot.end_time,
        booking.session_type
      );

      newMeetingLink = calendarResult?.meetLink || '';
      newGoogleEventId = calendarResult?.eventId || '';
      if (!newMeetingLink || !newGoogleEventId) throw new Error('Google Meet link is not ready. Please try again.');
    } catch (calendarError) {
      console.error('Calendar reschedule creation failed:', calendarError);
      if (newGoogleEventId) {
        await deleteGoogleCalendarEvent(booking.therapist_id || 'default-therapist', newGoogleEventId);
      }
      return NextResponse.json(
        { error: calendarError instanceof Error ? calendarError.message : 'Unable to create a new Google Meet link. Please try again.' },
        { status: 503 }
      );
    }

    const { data: claimedSlot, error: claimError } = await supabase
      .from('therapy_slots')
      .update({ is_available: false })
      .eq('id', newSlotId)
      .eq('is_available', true)
      .eq('is_blocked', false)
      .select('id')
      .maybeSingle();
    if (claimError || !claimedSlot) {
      await deleteGoogleCalendarEvent(booking.therapist_id || 'default-therapist', newGoogleEventId);
      return NextResponse.json({ error: 'This slot was just taken. Please choose another.' }, { status: 409 });
    }

    // Update meeting_link for single bookings or meeting_links for bundle bookings
    if (isBundleSession) {
      // For bundle bookings, update the meeting_links array
      const meetingLinks = Array.isArray(booking.meeting_links) ? [...booking.meeting_links] : [];
      meetingLinks[sessionIndex] = newMeetingLink;
      updateData.meeting_links = meetingLinks;
      if (meetingLinks[0]) {
        updateData.meeting_link = meetingLinks[0];
      }
    } else {
      // For single bookings, update meeting_link
      updateData.meeting_link = newMeetingLink;
    }

    if (newGoogleEventId) {
      updateData.google_calendar_event_id = newGoogleEventId;
    }

    // Update the existing row only if it still points at the session we read.
    // This prevents double-clicks/concurrent requests from consuming two slots
    // or silently granting more than the single allowed reschedule.
    let updateQuery = supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);
    updateQuery = isBundleSession
      ? updateQuery.contains('session_dates', [oldSession])
      : updateQuery.eq('slot_id', currentSlotId);

    const { data: updatedBooking, error: updateError } = await updateQuery
      .select()
      .maybeSingle();

    if (updateError || !updatedBooking) {
      console.error('❌ Error updating booking:', updateError);
      await supabase.from('therapy_slots').update({ is_available: true }).eq('id', newSlotId);
      await deleteGoogleCalendarEvent(booking.therapist_id || 'default-therapist', newGoogleEventId);
      return NextResponse.json(
        { error: updateError?.message || 'This session was already changed. Refresh your profile to see the current booking.' },
        { status: updateError ? 500 : 409 }
      );
    }

    const oldSlotId = isBundleSession
      ? currentSlotId
      : booking.slot_id;
    if (oldSlotId && oldSlotId !== newSlotId) {
      const { error: releaseError } = await supabase.from('therapy_slots').update({ is_available: true }).eq('id', oldSlotId);
      if (releaseError) console.error('Unable to release old slot:', releaseError);
    }

    if (!isBundleSession && booking.google_calendar_event_id) {
      await deleteGoogleCalendarEvent(booking.therapist_id || 'default-therapist', booking.google_calendar_event_id);
    }

    try {
      await writeAudit({ userId: session.user.id, actorRole: 'user', action: 'BOOKING_UPDATED', resourceType: 'booking', resourceId: bookingId, ipAddress: requestIp(request.headers), metadata: { change: 'RESCHEDULE' } });
    } catch (auditError) {
      console.warn('Reschedule audit logging failed after a successful update:', auditError);
    }

    console.log('✅ Booking rescheduled successfully:', {
      bookingId,
      oldDate: oldSession?.date || booking.slot_date,
      newDate: newSlot.date,
      oldTime: oldSession?.start_time || booking.slot_start_time,
      newTime: newSlot.start_time,
    });

    // Send WhatsApp reschedule notification if user has WhatsApp number linked
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('id', booking.user_id)
        .maybeSingle();

      if (profileData?.whatsapp_number) {
        const { data: therapistData } = await supabase
          .from('users')
          .select('name')
          .eq('id', booking.therapist_id)
          .single();

        await sendRescheduleNotificationWhatsApp({
          toPhoneNumber: profileData.whatsapp_number,
          clientName: booking.user_name || 'Client',
          therapistName: therapistData?.name || 'Therapist',
          oldDate: oldSession?.date || booking.slot_date,
          oldStartTime: oldSession?.start_time || booking.slot_start_time,
          oldEndTime: oldSession?.end_time || booking.slot_end_time,
          date: newSlot.date,
          startTime: newSlot.start_time,
          endTime: newSlot.end_time,
          meetingLink: newMeetingLink,
          sessionType: booking.session_type,
        });

        console.log('✅ WhatsApp reschedule notification sent');
      } else {
        console.log('ℹ️ User has no WhatsApp number linked, skipping WhatsApp notification');
      }
    } catch (whatsappError) {
      console.warn('⚠️ WhatsApp sending error (non-blocking):', whatsappError);
      // Don't fail the reschedule if WhatsApp fails
    }

    // Send email reschedule notification. Retry once for transient SMTP failures.
    let emailSent = false;
    try {
      console.log('📧 Sending reschedule email notification...');
      
      // Fetch therapist name for email
      const { data: therapistData } = await supabase
        .from('users')
        .select('name')
        .eq('id', booking.therapist_id)
        .single();

      const therapistName = therapistData?.name || 'Your Therapist';

      // Format times (ensure HH:mm format, trim seconds if present)
      const formatTime = (time: unknown): string => {
        if (!time) return 'N/A';
        const timeStr = typeof time === 'string' ? time : time.toString();
        // Keep only HH:mm
        return timeStr.substring(0, 5);
      };

      // Send email to client
      const emailPayload = {
        clientEmail: booking.user_email || session.user?.email || '',
        clientName: booking.user_name || session.user?.name || 'Client',
        therapistName,
        sessionType: booking.session_type,
        oldDate: originalDate,
        oldStartTime: formatTime(originalStartTime),
        oldEndTime: formatTime(originalEndTime),
        newDate: newSlot.date,
        newStartTime: formatTime(newSlot.start_time),
        newEndTime: formatTime(newSlot.end_time),
        meetingLink: newMeetingLink,
      };
      emailSent = await sendBookingPostponedEmail(emailPayload);
      if (!emailSent) emailSent = await sendBookingPostponedEmail(emailPayload);
      if (emailSent) console.log('✅ Reschedule email notification sent to:', emailPayload.clientEmail);
      else console.warn('Reschedule completed, but email delivery could not be confirmed.');

      const { data: adminUsers } = await supabase.from('users').select('email').eq('role', 'admin');
      const adminRecipients = getTherapistNotificationRecipients(
        (adminUsers || []).map((admin) => admin.email).filter(Boolean).join(',')
      );
      await sendAdminRescheduleNotificationEmail({
        recipients: adminRecipients,
        bookingId,
        clientName: booking.user_name || session.user?.name || 'Client',
        clientEmail: booking.user_email || session.user?.email || '',
        sessionType: booking.session_type,
        oldDate: originalDate,
        oldStartTime: formatTime(originalStartTime),
        oldEndTime: formatTime(originalEndTime),
        newDate: newSlot.date,
        newStartTime: formatTime(newSlot.start_time),
        newEndTime: formatTime(newSlot.end_time),
      });
    } catch (emailError) {
      console.warn('⚠️ Email sending error (non-blocking):', emailError);
      // Don't fail the reschedule if email fails
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Session rescheduled successfully. A confirmation email has been sent.'
        : 'Session rescheduled successfully, but confirmation email delivery could not be verified.',
      emailSent,
      booking: {
        ...updatedBooking,
        meeting_link: newMeetingLink,
      },
    });
  } catch (error) {
    console.error('❌ Reschedule error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
