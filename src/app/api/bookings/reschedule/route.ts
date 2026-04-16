'use server';

import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { sendRescheduleNotificationWhatsApp } from '@/lib/whatsapp';
import { sendBookingPostponedEmail } from '@/lib/email';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookingId, newSlotId, newDate, newStartTime, newEndTime, sessionIndex } = body;

    if (!bookingId || !newSlotId || !newDate || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify ownership
    if (booking.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the new slot is already booked
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', newSlotId)
      .eq('status', 'confirmed');

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'This slot was just booked. Please select another.' },
        { status: 409 }
      );
    }

    // Check if user is selecting the same slot
    if (booking.slot_id === newSlotId) {
      return NextResponse.json(
        { error: 'You already have this slot. Please choose a different time.' },
        { status: 400 }
      );
    }

    // Free the old slot
    const { error: oldSlotError } = await supabase
      .from('therapy_slots')
      .update({ is_available: true })
      .eq('id', booking.slot_id);

    if (oldSlotError) {
      console.error('❌ Error freeing old slot:', oldSlotError);
    } else {
      console.log('✅ Old slot freed:', booking.slot_id);
    }

    // Mark new slot as unavailable
    const { error: newSlotError } = await supabase
      .from('therapy_slots')
      .update({ is_available: false })
      .eq('id', newSlotId);

    if (newSlotError) {
      console.error('❌ Error marking new slot:', newSlotError);
    } else {
      console.log('✅ New slot marked unavailable:', newSlotId);
    }

    // Get the new slot details to denormalize into booking
    const { data: newSlot, error: slotFetchError } = await supabase
      .from('therapy_slots')
      .select('date, start_time, end_time')
      .eq('id', newSlotId)
      .single();

    if (slotFetchError || !newSlot) {
      console.error('❌ Error fetching new slot:', slotFetchError);
      return NextResponse.json(
        { error: 'New slot not found' },
        { status: 404 }
      );
    }

    console.log('📅 New slot details retrieved:', newSlot);

    // For bundle bookings, handle session_dates update
    let updateData: any = {
      slot_id: newSlotId,
      slot_date: newSlot.date,
      slot_start_time: newSlot.start_time,
      slot_end_time: newSlot.end_time,
    };

    // If bundle booking and sessionIndex is provided, update that specific session
    if (booking.number_of_sessions && booking.number_of_sessions > 1 && sessionIndex !== undefined) {
      if (booking.session_dates && Array.isArray(booking.session_dates)) {
        const updatedSessions = [...booking.session_dates];
        if (updatedSessions[sessionIndex]) {
          updatedSessions[sessionIndex] = {
            date: newSlot.date,
            start_time: newSlot.start_time,
            end_time: newSlot.end_time,
            slotId: newSlotId,
          };
          updateData.session_dates = updatedSessions;
        }
      }
    }

    // Generate new Google Meet link
    let newMeetingLink = booking.meeting_link;
    let newGoogleEventId = booking.google_calendar_event_id;
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      );

      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      if (refreshToken) {
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Delete old Google Calendar event if it exists
        if (booking.google_calendar_event_id) {
          try {
            await calendar.events.delete({
              calendarId: 'primary',
              eventId: booking.google_calendar_event_id,
            });
            console.log('✅ Old Google Calendar event deleted:', booking.google_calendar_event_id);
          } catch (deleteError: any) {
            if (deleteError.code !== 404) {
              console.error('⚠️ Error deleting old calendar event:', deleteError.message);
            }
          }
        }

        // Create a new event in Google Calendar
        // Use the database slot values for accuracy
        // Ensure time is in HH:mm format
        let startTimeStr = typeof newSlot.start_time === 'string' 
          ? newSlot.start_time 
          : newSlot.start_time?.toString?.() || newStartTime;
        let endTimeStr = typeof newSlot.end_time === 'string'
          ? newSlot.end_time
          : newSlot.end_time?.toString?.() || newEndTime;

        // Trim to HH:mm if longer (e.g., "17:00:00" -> "17:00")
        if (startTimeStr.length > 5) {
          startTimeStr = startTimeStr.substring(0, 5);
        }
        if (endTimeStr.length > 5) {
          endTimeStr = endTimeStr.substring(0, 5);
        }

        // Format as ISO 8601 local time (without Z, with timezone parameter)
        const eventStartDateTime = `${newSlot.date}T${startTimeStr}:00`;
        const eventEndDateTime = `${newSlot.date}T${endTimeStr}:00`;

        console.log('📅 Creating Google Calendar event with local times:', {
          date: newSlot.date,
          startTime: startTimeStr,
          endTime: endTimeStr,
          startDateTime: eventStartDateTime,
          endDateTime: eventEndDateTime,
          timezone: 'Asia/Kolkata',
        });

        const event = {
          summary: `${booking.session_type === 'personal' ? 'Personal' : 'Couple'} Therapy Session - Mannosaar`,
          description: `Rescheduled session for ${session.user.name}`,
          start: {
            dateTime: eventStartDateTime,
            timeZone: 'Asia/Kolkata',
          },
          end: {
            dateTime: eventEndDateTime,
            timeZone: 'Asia/Kolkata',
          },
          conferenceData: {
            createRequest: {
              requestId: `reschedule-${bookingId}-${Date.now()}`,
              conferenceSolution: {
                key: {
                  conferenceType: 'hangoutsMeet',
                },
              },
            },
          },
        };

        const calendarEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
          conferenceDataVersion: 1,
        });

        if (calendarEvent.data.id) {
          newGoogleEventId = calendarEvent.data.id;
          console.log('✅ New Google Calendar event created:', newGoogleEventId);
          console.log('📋 Calendar event response:', {
            id: calendarEvent.data.id,
            summary: calendarEvent.data.summary,
            start: calendarEvent.data.start,
            end: calendarEvent.data.end,
            conferenceDataExists: !!calendarEvent.data.conferenceData,
            entryPointsCount: calendarEvent.data.conferenceData?.entryPoints?.length || 0,
          });

          // Try to extract meeting link from initial response
          let extractedLink: string | null = null;

          if (calendarEvent.data.conferenceData?.entryPoints) {
            console.log('🔍 Searching for meeting link in entryPoints:', calendarEvent.data.conferenceData.entryPoints);
            const meetLink = calendarEvent.data.conferenceData.entryPoints.find(
              (entry: any) => entry.entryPointType === 'video' || entry.uri?.includes('meet.google.com')
            );
            extractedLink = meetLink?.uri || null;
            if (extractedLink) {
              console.log('✅ New Google Meet link extracted from initial response:', extractedLink);
            } else {
              console.warn('⚠️ No video entry point found in initial response');
            }
          } else {
            console.log('ℹ️ No conference data in initial response, will fetch later');
          }

          // If conference data not in initial response or link not found, fetch the event again
          if (!extractedLink) {
            console.log('⏳ Conference data not found or no link extracted, fetching updated event with conferenceData...');
            try {
              const getEventResponse = await calendar.events.get({
                calendarId: 'primary',
                eventId: newGoogleEventId,
              });

              const fetchedEvent = getEventResponse.data;
              
              console.log('📋 Fetched event details:', {
                id: fetchedEvent.id,
                summary: fetchedEvent.summary,
                conferenceDataExists: !!fetchedEvent.conferenceData,
                entryPointsCount: fetchedEvent.conferenceData?.entryPoints?.length || 0,
                allEntryPoints: fetchedEvent.conferenceData?.entryPoints,
              });

              if (fetchedEvent.conferenceData?.entryPoints && fetchedEvent.conferenceData.entryPoints.length > 0) {
                console.log('🔍 Searching for meeting link in fetched entryPoints:', fetchedEvent.conferenceData.entryPoints);
                
                // Try to find video conference link
                let meetLink = fetchedEvent.conferenceData.entryPoints.find(
                  (entry: any) => entry.entryPointType === 'video'
                );
                
                // If not found by type, try by URL pattern
                if (!meetLink) {
                  meetLink = fetchedEvent.conferenceData.entryPoints.find(
                    (entry: any) => entry.uri?.includes('meet.google.com')
                  );
                }
                
                extractedLink = meetLink?.uri || null;
                
                if (extractedLink) {
                  console.log('✅ New Google Meet link extracted from fetched event:', extractedLink);
                } else {
                  console.warn('⚠️ No video meet link found in any entry points:', fetchedEvent.conferenceData.entryPoints.map((e: any) => ({ type: e.entryPointType, uri: e.uri })));
                }
              } else {
                console.warn('⚠️ No conference data in fetched event');
              }
            } catch (fetchError) {
              console.error('⚠️ Error fetching event details:', fetchError);
            }
          }

          // Update the link if we successfully extracted one
          if (extractedLink) {
            newMeetingLink = extractedLink;
            console.log('✅ Meeting link updated to:', newMeetingLink);
          } else {
            console.error('❌ Failed to extract new Google Meet link, keeping old link:', booking.meeting_link);
            // Don't use old link - try without one
            newMeetingLink = '';
          }
        }
      }
    } catch (error) {
      console.error('❌ Error managing Google Calendar event:', error);
      // Continue without calendar update if it fails
    }

    // Update meeting_link for single bookings or meeting_links for bundle bookings
    if (booking.number_of_sessions && booking.number_of_sessions > 1 && sessionIndex !== undefined) {
      // For bundle bookings, update the meeting_links array
      const meetingLinks = booking.meeting_links || [];
      meetingLinks[sessionIndex] = newMeetingLink;
      updateData.meeting_links = meetingLinks;
    } else {
      // For single bookings, update meeting_link
      updateData.meeting_link = newMeetingLink;
    }

    // Always update the google calendar event ID for the new event
    updateData.google_calendar_event_id = newGoogleEventId;

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to reschedule booking' },
        { status: 500 }
      );
    }

    console.log('✅ Booking rescheduled successfully:', {
      bookingId,
      oldDate: booking.slot_date,
      newDate,
      oldTime: booking.slot_start_time,
      newTime: newStartTime,
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
          oldDate: booking.slot_date,
          oldStartTime: booking.slot_start_time,
          oldEndTime: booking.slot_end_time,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          meetingLink: newMeetingLink,
          sessionType: booking.session_type,
        });

        console.log('✅ WhatsApp reschedule notification sent to:', profileData.whatsapp_number);
      } else {
        console.log('ℹ️ User has no WhatsApp number linked, skipping WhatsApp notification');
      }
    } catch (whatsappError) {
      console.warn('⚠️ WhatsApp sending error (non-blocking):', whatsappError);
      // Don't fail the reschedule if WhatsApp fails
    }

    // Send email reschedule notification
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
      const formatTime = (time: any): string => {
        if (!time) return 'N/A';
        const timeStr = typeof time === 'string' ? time : time.toString();
        // Keep only HH:mm
        return timeStr.substring(0, 5);
      };

      // Send email to client
      await sendBookingPostponedEmail({
        clientEmail: booking.user_email || session.user?.email || '',
        clientName: booking.user_name || session.user?.name || 'Client',
        therapistName,
        sessionType: booking.session_type,
        oldDate: booking.slot_date,
        oldStartTime: formatTime(booking.slot_start_time),
        oldEndTime: formatTime(booking.slot_end_time),
        newDate: newSlot.date,
        newStartTime: formatTime(newSlot.start_time),
        newEndTime: formatTime(newSlot.end_time),
      });

      console.log('✅ Reschedule email notification sent to:', booking.user_email || session.user?.email);
    } catch (emailError) {
      console.warn('⚠️ Email sending error (non-blocking):', emailError);
      // Don't fail the reschedule if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Session rescheduled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('❌ Reschedule error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
